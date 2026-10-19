import httpStatus from "http-status-codes";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { categorySearchableFields } from "./category.constant";
import { ICategory } from "./category.interface";
import { Category } from "./category.model";

const createCategory = async (payload: ICategory) => {
    const existingCategory = await Category.findOne({
        $or: [{ slug: payload.slug }, { name: payload.name }]
    });
    if (existingCategory) {
        throw new AppError(httpStatus.BAD_REQUEST, "A category with this name or slug already exists.");
    }

    const category = await Category.create(payload);
    return category;
};

const getAllCategory = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Category.find(), query);

    const categoriesData = queryBuilder
        .search(categorySearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        categoriesData.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getSingleCategory = async (slugOrId: string) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);
    const category = isObjectId
        ? await Category.findOne({ $or: [{ _id: slugOrId }, { slug: slugOrId }] })
        : await Category.findOne({ slug: slugOrId });

    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }

    return {
        data: category,
    };
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    if (payload.name || payload.slug) {
        const duplicateCategory = await Category.findOne({
            _id: { $ne: id },
            $or: [
                ...(payload.name ? [{ name: payload.name }] : []),
                ...(payload.slug ? [{ slug: payload.slug }] : []),
            ]
        });

        if (duplicateCategory) {
            throw new AppError(httpStatus.BAD_REQUEST, "A category with this name or slug already exists.");
        }
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    });

    const oldImage = existingCategory.image || existingCategory.thumbnail;
    const newImage = payload.image || payload.thumbnail;
    if (newImage && oldImage && oldImage !== newImage) {
        await deleteImageFromCLoudinary(oldImage);
    }

    return updatedCategory;
};

const deleteCategory = async (id: string) => {
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        throw new AppError(httpStatus.NOT_FOUND, "Category not found.");
    }

    const imageToDelete = existingCategory.image || existingCategory.thumbnail;
    if (imageToDelete) {
        await deleteImageFromCLoudinary(imageToDelete);
    }

    await Category.findByIdAndDelete(id);
    return null;
};

export const CategoryService = {
    createCategory,
    getAllCategory,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
