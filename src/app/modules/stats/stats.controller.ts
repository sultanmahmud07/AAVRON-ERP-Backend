import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getDashboardOverview();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard overview stats fetched successfully",
        data: stats,
    });
});

const getWeeklySales = catchAsync(async (req: Request, res: Response) => {
    const weeklySales = await StatsService.getWeeklySalesData();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Weekly sales data fetched successfully",
        data: weeklySales,
    });
});

const getMonthlySales = catchAsync(async (req: Request, res: Response) => {
    const monthlySales = await StatsService.getMonthlySalesData();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Monthly sales data fetched successfully",
        data: monthlySales,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getUserStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User stats fetched successfully",
        data: stats,
    });
});

const getProductStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getProductStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product stats fetched successfully",
        data: stats,
    });
});

const getOrderStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getOrderStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order stats fetched successfully",
        data: stats,
    });
});

const getPaymentStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await StatsService.getPaymentStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment stats fetched successfully",
        data: stats,
    });
});

export const StatsController = {
    getDashboardOverview,
    getWeeklySales,
    getMonthlySales,
    getUserStats,
    getProductStats,
    getOrderStats,
    getPaymentStats,
};
