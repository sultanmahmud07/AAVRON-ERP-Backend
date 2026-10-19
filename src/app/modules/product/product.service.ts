/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { REVIEW_STATUS } from "../review/review.interface";
import { Review } from "../review/review.model";
import { productSearchableFields } from "./product.constant";
import { IProduct } from "./product.interface";
import { Product } from "./product.model";

const createProduct = async (payload: IProduct) => {
    const existingProduct = await Product.findOne({
        $or: [{ slug: payload.slug }, { name: payload.name }]
    });
    if (existingProduct) {
        throw new AppError(httpStatus.BAD_REQUEST, "A product with this slug or name already exists.");
    }

    payload.rating = 0;
    payload.reviewCount = 0;

    const product = await Product.create(payload);
    return product;
};

const getAllProducts = async (query: Record<string, string>) => {
    const filterQuery: Record<string, any> = { ...query };

    // Convert boolean query params
    if (filterQuery.isNew !== undefined) {
        filterQuery.isNew = filterQuery.isNew === "true" || filterQuery.isNew === true;
    }
    if (filterQuery.isTrending !== undefined) {
        filterQuery.isTrending = filterQuery.isTrending === "true" || filterQuery.isTrending === true;
    }
    if (filterQuery.isBestSeller !== undefined) {
        filterQuery.isBestSeller = filterQuery.isBestSeller === "true" || filterQuery.isBestSeller === true;
    }
    if (filterQuery.isFeatured !== undefined) {
        filterQuery.isFeatured = filterQuery.isFeatured === "true" || filterQuery.isFeatured === true;
    }

    // Handle minPrice and maxPrice
    if (filterQuery.minPrice || filterQuery.maxPrice) {
        filterQuery.price = {};
        if (filterQuery.minPrice) {
            filterQuery.price.$gte = Number(filterQuery.minPrice);
            delete filterQuery.minPrice;
        }
        if (filterQuery.maxPrice) {
            filterQuery.price.$lte = Number(filterQuery.maxPrice);
            delete filterQuery.maxPrice;
        }
    }

    // Handle sizes filter (e.g. sizes=M or sizes=M,L)
    if (filterQuery.sizes) {
        const sizesArray = typeof filterQuery.sizes === "string" ? filterQuery.sizes.split(",") : filterQuery.sizes;
        filterQuery.sizes = { $in: sizesArray };
    }

    // Handle tags filter (e.g. tags=Heavyweight or tags=Heavyweight,Monogram)
    if (filterQuery.tags) {
        const tagsArray = typeof filterQuery.tags === "string" ? filterQuery.tags.split(",") : filterQuery.tags;
        filterQuery.tags = { $in: tagsArray };
    }

    const queryBuilder = new QueryBuilder(Product.find(), filterQuery);

    const productQuery = queryBuilder
        .search(productSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        productQuery.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getSingleProduct = async (slugOrId: string) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
    const product = isObjectId
        ? await Product.findOne({ $or: [{ _id: slugOrId }, { slug: slugOrId }] })
        : await Product.findOne({ slug: slugOrId });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Fetch approved reviews and calculate rating breakdown
    const [reviews, breakdownData] = await Promise.all([
        Review.find({ product: product._id, status: REVIEW_STATUS.APPROVED }).sort({ createdAt: -1 }),
        Review.aggregate([
            {
                $match: {
                    product: product._id,
                    status: REVIEW_STATUS.APPROVED,
                },
            },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    breakdownData.forEach((item) => {
        ratingBreakdown[item._id] = item.count;
    });

    const productObj = product.toObject();

    // Live real reviews calculation
    const liveReviewCount = reviews.length;
    const liveAvgRating = liveReviewCount > 0
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / liveReviewCount) * 10) / 10
        : 0;

    productObj.rating = liveAvgRating;
    productObj.reviewCount = liveReviewCount;

    return {
        ...productObj,
        reviews,
        ratingBreakdown,
    };
};

const getRelatedProducts = async (slug: string, limit = 4) => {
    const currentProduct = await Product.findOne({ slug });
    if (!currentProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const relatedProducts = await Product.find({
        slug: { $ne: slug },
        $or: [
            { categorySlug: currentProduct.categorySlug },
            { category: currentProduct.category },
            { tags: { $in: currentProduct.tags || [] } }
        ]
    }).limit(Number(limit));

    return relatedProducts;
};

const updateProduct = async (id: string, payload: Partial<IProduct>) => {
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    // rating and reviewCount are strictly derived from real reviews
    delete payload.rating;
    delete payload.reviewCount;

    // Handle slug or name collisions
    if (payload.slug || payload.name) {
        const duplicate = await Product.findOne({
            _id: { $ne: id },
            $or: [
                ...(payload.slug ? [{ slug: payload.slug }] : []),
                ...(payload.name ? [{ name: payload.name }] : [])
            ]
        });
        if (duplicate) {
            throw new AppError(httpStatus.BAD_REQUEST, "Another product with this name or slug already exists.");
        }
    }

    let finalImages = existingProduct.images || [];

    // Add new images
    if (payload.images && payload.images.length > 0) {
        finalImages = [...finalImages, ...payload.images];
    }

    // Delete requested images
    if (payload.deleteImages && payload.deleteImages.length > 0) {
        finalImages = finalImages.filter(img => !payload.deleteImages?.includes(img));
        await Promise.all(
            payload.deleteImages.map(url => deleteImageFromCLoudinary(url).catch(() => null))
        );
    }

    payload.images = finalImages;

    const updatedProduct = await Product.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    });

    return updatedProduct;
};

const deleteProduct = async (id: string) => {
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    if (existingProduct.images && Array.isArray(existingProduct.images) && existingProduct.images.length > 0) {
        await Promise.all(
            existingProduct.images.map(url => deleteImageFromCLoudinary(url).catch(() => null))
        );
    }

    await Product.findByIdAndDelete(id);
    return null;
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    getRelatedProducts,
    updateProduct,
    deleteProduct,
};
