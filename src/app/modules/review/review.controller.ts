/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "../user/user.interface";
import { ReviewService } from "./review.service";

const formatReviewPayload = (body: any, files?: Express.Multer.File[]) => {
    let parsedBody = { ...body };

    if (body.data) {
        try {
            const dataObj = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
            parsedBody = { ...dataObj, ...body };
            delete parsedBody.data;
        } catch {
            // Keep original
        }
    }

    const payload: any = { ...parsedBody };

    if (files && files.length > 0) {
        const uploadedImages = files.map((file) => file.path);
        payload.images = payload.images ? [...payload.images, ...uploadedImages] : uploadedImages;
    }

    if (payload.rating !== undefined) {
        payload.rating = Number(payload.rating);
    }

    return payload;
};

const createReview = catchAsync(async (req: Request, res: Response) => {
    const decodeToken = req.user as JwtPayload | undefined;
    const files = req.files as Express.Multer.File[] | undefined;
    const payload = formatReviewPayload(req.body, files);

    const result = await ReviewService.createReview(payload, decodeToken?.userId);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review submitted successfully",
        data: result,
    });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
    const { productIdOrSlug } = req.params;
    const result = await ReviewService.getProductReviews(
        productIdOrSlug,
        req.query as Record<string, string>
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product reviews retrieved successfully",
        data: {
            reviews: result.data,
            summary: result.summary,
        },
        meta: result.meta,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.getAllReviews(req.query as Record<string, string>);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All reviews retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const decodeToken = req.user as JwtPayload | undefined;
    const isAdmin = decodeToken?.role === Role.ADMIN || decodeToken?.role === Role.SUPER_ADMIN;

    const result = await ReviewService.updateReview(id, req.body, decodeToken?.userId, isAdmin);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const decodeToken = req.user as JwtPayload | undefined;
    const isAdmin = decodeToken?.role === Role.ADMIN || decodeToken?.role === Role.SUPER_ADMIN;

    const result = await ReviewService.deleteReview(id, decodeToken?.userId, isAdmin);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReview,
    deleteReview,
};
