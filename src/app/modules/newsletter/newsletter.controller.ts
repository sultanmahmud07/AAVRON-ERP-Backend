import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NewsletterService } from "./newsletter.service";

const subscribe = catchAsync(async (req: Request, res: Response) => {
    const result = await NewsletterService.subscribe(req.body);

    sendResponse(res, {
        statusCode: result.isAlreadySubscribed ? httpStatus.OK : httpStatus.CREATED,
        success: true,
        message: result.message,
        data: result.subscriber,
    });
});

const unsubscribe = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await NewsletterService.unsubscribe(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "You have been unsubscribed from the ARVYNO Newsletter.",
        data: result,
    });
});

const getAllSubscribers = catchAsync(async (req: Request, res: Response) => {
    const result = await NewsletterService.getAllSubscribers(req.query as Record<string, string>);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Newsletter subscribers retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const deleteSubscriber = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await NewsletterService.deleteSubscriber(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscriber deleted successfully",
        data: result,
    });
});

const getNewsletterStats = catchAsync(async (req: Request, res: Response) => {
    const result = await NewsletterService.getNewsletterStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Newsletter stats retrieved successfully",
        data: result,
    });
});

export const NewsletterController = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    deleteSubscriber,
    getNewsletterStats,
};
