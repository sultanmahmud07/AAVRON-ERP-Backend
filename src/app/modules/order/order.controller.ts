import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { Role } from "../user/user.interface";
import { ORDER_STATUS } from "./order.interface";
import { OrderService } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const decodeToken = req.user as JwtPayload | undefined;
    const result = await OrderService.createOrder(req.body, decodeToken?.userId);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order placed successfully",
        data: result,
    });
});

const getUserOrders = catchAsync(async (req: Request, res: Response) => {
    const decodeToken = req.user as JwtPayload;
    const result = await OrderService.getUserOrders(decodeToken.userId, req.query as Record<string, string>);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await OrderService.getSingleOrder(id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.getAllOrders(req.query as Record<string, string>);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All orders retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await OrderService.updateOrderStatus(id, status as ORDER_STATUS);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const decodeToken = req.user as JwtPayload;
    const isAdmin = decodeToken.role === Role.ADMIN || decodeToken.role === Role.SUPER_ADMIN;

    const result = await OrderService.cancelOrder(id, decodeToken.userId, isAdmin);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order cancelled successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    getUserOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
};
