/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { IProduct } from "./product.interface";
import { ProductService } from "./product.service";

const parseJsonField = (field: any) => {
    if (typeof field === "string") {
        try {
            return JSON.parse(field);
        } catch {
            return field;
        }
    }
    return field;
};

const formatProductPayload = (body: any, files?: Express.Multer.File[]): Partial<IProduct> => {
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

    const payload: any = { ...parsedBody };

    if (files && files.length > 0) {
        const uploadedImages = files.map(file => file.path);
        payload.images = payload.images ? [...(Array.isArray(payload.images) ? payload.images : [payload.images]), ...uploadedImages] : uploadedImages;
    }

    if (payload.colors) payload.colors = parseJsonField(payload.colors);
    if (payload.sizes) payload.sizes = parseJsonField(payload.sizes);
    if (payload.tags) payload.tags = parseJsonField(payload.tags);
    if (payload.details) payload.details = parseJsonField(payload.details);
    if (payload.fabricCare) payload.fabricCare = parseJsonField(payload.fabricCare);
    if (payload.deleteImages) payload.deleteImages = parseJsonField(payload.deleteImages);

    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.compareAtPrice !== undefined) payload.compareAtPrice = Number(payload.compareAtPrice);
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (payload.rating !== undefined) payload.rating = Number(payload.rating);
    if (payload.reviewCount !== undefined) payload.reviewCount = Number(payload.reviewCount);

    if (payload.isNew !== undefined) payload.isNew = payload.isNew === "true" || payload.isNew === true;
    if (payload.isTrending !== undefined) payload.isTrending = payload.isTrending === "true" || payload.isTrending === true;
    if (payload.isBestSeller !== undefined) payload.isBestSeller = payload.isBestSeller === "true" || payload.isBestSeller === true;
    if (payload.isFeatured !== undefined) payload.isFeatured = payload.isFeatured === "true" || payload.isFeatured === true;

    return payload;
};

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const payload = formatProductPayload(req.body, files) as IProduct;
    console.log(payload)
    const result = await ProductService.createProduct(payload);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Product created successfully",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await ProductService.getAllProducts(query as Record<string, string>);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Products retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const result = await ProductService.getSingleProduct(slug);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product retrieved successfully",
        data: result,
    });
});

const getRelatedProducts = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug;
    const limit = Number(req.query.limit) || 4;
    const result = await ProductService.getRelatedProducts(slug, limit);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Related products retrieved successfully",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const payload = formatProductPayload(req.body, files);

    const result = await ProductService.updateProduct(req.params.id, payload);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product updated successfully",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductService.deleteProduct(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully",
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    getRelatedProducts,
    updateProduct,
    deleteProduct,
};