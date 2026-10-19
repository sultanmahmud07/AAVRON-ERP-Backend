/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ICategory } from "./category.interface";
import { CategoryService } from "./category.service";

const formatCategoryPayload = (body: any, file?: Express.Multer.File): ICategory => {
    let parsedBody = { ...body };

    if (body.data) {
        try {
            const dataObj = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
            parsedBody = { ...dataObj, ...body };
            delete parsedBody.data;
        } catch {
            // Keep original if JSON parsing fails
        }
    }

    const payload: ICategory = {
        ...parsedBody,
        ...(file?.path ? { image: file.path, thumbnail: file.path } : {})
    };

    if (parsedBody.featured !== undefined) {
        payload.featured = parsedBody.featured === "true" || parsedBody.featured === true;
    }
    if (payload.startingPrice !== undefined) {
        payload.startingPrice = Number(payload.startingPrice);
    }
    if (payload.itemCount !== undefined) {
        payload.itemCount = Number(payload.itemCount);
    }

    return payload;
};

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = formatCategoryPayload(req.body, req.file);
    const result = await CategoryService.createCategory(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await CategoryService.getAllCategory(query as Record<string, string>);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Categories retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const result = await CategoryService.getSingleCategory(slug);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category retrieved successfully",
        data: result.data,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const payload = formatCategoryPayload(req.body, req.file);

    const result = await CategoryService.updateCategory(id, payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category updated successfully",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.deleteCategory(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category deleted successfully",
        data: result,
    });
});

export const CategoryController = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
