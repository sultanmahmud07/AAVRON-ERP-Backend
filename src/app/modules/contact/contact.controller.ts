import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ContactService } from "./contact.service";

const createContact = catchAsync(async (req: Request, res: Response) => {
    const decodeToken = req.user as JwtPayload | undefined;
    const result = await ContactService.createContact(req.body, decodeToken?.userId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Your inquiry has been sent to our atelier concierge. We will get back to you shortly.",
        data: result,
    });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
    const result = await ContactService.getAllContacts(req.query as Record<string, string>);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inquiries retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleContact = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ContactService.getSingleContact(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inquiry retrieved successfully",
        data: result,
    });
});

const updateContact = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ContactService.updateContact(id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inquiry updated successfully",
        data: result,
    });
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ContactService.deleteContact(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inquiry deleted successfully",
        data: result,
    });
});

export const ContactController = {
    createContact,
    getAllContacts,
    getSingleContact,
    updateContact,
    deleteContact,
};
