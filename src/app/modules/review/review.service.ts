/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Order } from "../order/order.model";
import { Product } from "../product/product.model";
import { User } from "../user/user.model";
import { reviewSearchableFields } from "./review.constant";
import { IReview, REVIEW_STATUS } from "./review.interface";
import { Review } from "./review.model";

const updateProductRatingStats = async (productId: Types.ObjectId | string) => {
    const stats = await Review.aggregate([
        {
            $match: {
                product: new Types.ObjectId(productId.toString()),
                status: REVIEW_STATUS.APPROVED,
            },
        },
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    if (stats.length > 0) {
        const roundedRating = Math.round(stats[0].avgRating * 10) / 10;
        await Product.findByIdAndUpdate(productId, {
            rating: roundedRating,
            reviewCount: stats[0].totalReviews,
        });
    } else {
        await Product.findByIdAndUpdate(productId, {
            rating: 0,
            reviewCount: 0,
        });
    }
};

const syncAllProductRatings = async () => {
    const products = await Product.find({}, "_id");
    await Promise.all(products.map((prod) => updateProductRatingStats(prod._id)));
};

const createReview = async (payload: any, userId?: string) => {
    const productIdentifier = payload.product || payload.productId;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productIdentifier);

    const product = isObjectId
        ? await Product.findById(productIdentifier)
        : await Product.findOne({ slug: productIdentifier });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found to review.");
    }

    let reviewerName = payload.userName || payload.name;
    let reviewerEmail = payload.userEmail || payload.email;

    if (userId) {
        const user = await User.findById(userId);
        if (user) {
            reviewerName = reviewerName || user.name;
            reviewerEmail = reviewerEmail || user.email;
        }
    }

    if (!reviewerName) {
        reviewerName = "Valued Customer";
    }

    // Check if buyer has completed an order for this product (Verified Buyer)
    let isVerifiedBuyer = false;
    if (userId || reviewerEmail) {
        const purchaseMatch: any = {
            "items.product": product._id,
        };
        if (userId) {
            purchaseMatch.user = userId;
        } else if (reviewerEmail) {
            purchaseMatch["shippingAddress.email"] = reviewerEmail;
        }

        const hasPurchased = await Order.findOne(purchaseMatch);
        if (hasPurchased) {
            isVerifiedBuyer = true;
        }
    }

    const reviewData: Partial<IReview> = {
        product: product._id,
        userName: reviewerName,
        userEmail: reviewerEmail,
        rating: Number(payload.rating),
        comment: payload.comment,
        isVerifiedBuyer,
        images: payload.images || [],
        status: REVIEW_STATUS.APPROVED,
    };

    if (userId) {
        reviewData.user = new Types.ObjectId(userId);
    }

    const review = await Review.create(reviewData);

    // Automatically recalculate product's average rating & review count
    await updateProductRatingStats(product._id);

    return review;
};

const getProductReviews = async (productIdentifier: string, query: Record<string, string>) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productIdentifier);
    const product = isObjectId
        ? await Product.findById(productIdentifier)
        : await Product.findOne({ slug: productIdentifier });

    if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, "Product not found.");
    }

    const queryBuilder = new QueryBuilder(
        Review.find({ product: product._id, status: REVIEW_STATUS.APPROVED }),
        query
    );

    const reviewsQuery = queryBuilder
        .search(reviewSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [reviews, meta, breakdownData] = await Promise.all([
        reviewsQuery.build(),
        queryBuilder.getMeta(),
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

    return {
        data: reviews,
        meta,
        summary: {
            averageRating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            ratingBreakdown,
        },
    };
};

const getAllReviews = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Review.find().populate("product", "name slug images price"),
        query
    );

    const reviewsQuery = queryBuilder
        .search(reviewSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        reviewsQuery.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const updateReview = async (id: string, payload: Partial<IReview>, userId?: string, isAdmin = false) => {
    const filter: Record<string, any> = { _id: id };
    if (!isAdmin && userId) {
        filter.user = userId;
    }

    const review = await Review.findOne(filter);
    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, "Review not found or unauthorized to edit.");
    }

    const updatedReview = await Review.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.rating || payload.status) {
        await updateProductRatingStats(review.product);
    }

    return updatedReview;
};

const deleteReview = async (id: string, userId?: string, isAdmin = false) => {
    const filter: Record<string, any> = { _id: id };
    if (!isAdmin && userId) {
        filter.user = userId;
    }

    const review = await Review.findOne(filter);
    if (!review) {
        throw new AppError(httpStatus.NOT_FOUND, "Review not found or unauthorized to delete.");
    }

    await Review.findByIdAndDelete(id);
    await updateProductRatingStats(review.product);

    return null;
};

export const ReviewService = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReview,
    deleteReview,
    updateProductRatingStats,
    syncAllProductRatings,
};
