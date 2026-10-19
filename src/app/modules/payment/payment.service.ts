/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { sendOrderConfirmationEmail } from "../../utils/orderEmail";
import { ORDER_STATUS } from "../order/order.interface";
import { Order } from "../order/order.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { IUser } from "../user/user.interface";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";

const initPayment = async (orderId: string) => {
    const payment = await Payment.findOne({ order: orderId });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment record not found for this order.");
    }

    const order = await Order.findById(payment.order).populate("user");
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Associated order not found.");
    }

    const shipping = order.shippingAddress;

    const sslPayload: ISSLCommerz = {
        address: shipping.address,
        email: shipping.email || "guest@arvyno.com",
        phoneNumber: shipping.phone,
        name: shipping.name,
        amount: payment.amount,
        transactionId: payment.transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    return {
        paymentUrl: sslPayment.GatewayPageURL,
    };
};

const successPayment = async (query: Record<string, string>) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: query.transactionId },
            { status: PAYMENT_STATUS.PAID },
            { new: true, runValidators: true, session }
        );

        if (!updatedPayment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment record not found.");
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            updatedPayment.order,
            {
                status: ORDER_STATUS.PROCESSING,
                paymentStatus: PAYMENT_STATUS.PAID,
            },
            { new: true, runValidators: true, session }
        ).populate("user", "name email");

        if (!updatedOrder) {
            throw new AppError(httpStatus.NOT_FOUND, "Order record not found.");
        }

        const invoiceData: IInvoiceData = {
            orderNumber: updatedOrder.orderNumber,
            transactionId: updatedPayment.transactionId,
            orderDate: updatedOrder.createdAt as Date,
            userName: updatedOrder.shippingAddress.name || (updatedOrder.user as unknown as IUser)?.name || "Customer",
            userEmail: updatedOrder.shippingAddress.email || (updatedOrder.user as unknown as IUser)?.email || "",
            shippingAddress: `${updatedOrder.shippingAddress.address}${updatedOrder.shippingAddress.city ? `, ${updatedOrder.shippingAddress.city}` : ""}`,
            items: updatedOrder.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color,
            })),
            subtotal: updatedOrder.subtotal,
            shippingCost: updatedOrder.shippingCost,
            discount: updatedOrder.discount,
            totalAmount: updatedPayment.amount,
        };

        try {
            const pdfBuffer = await generatePdf(invoiceData);
            const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

            if (cloudinaryResult?.secure_url) {
                await Payment.findByIdAndUpdate(
                    updatedPayment._id,
                    { invoiceUrl: cloudinaryResult.secure_url },
                    { runValidators: true, session }
                );
            }
        } catch (pdfErr: any) {
            // eslint-disable-next-line no-console
            console.error("PDF upload skipped during payment success:", pdfErr.message || pdfErr);
        }

        await session.commitTransaction();
        session.endSession();

        // Send order confirmation & invoice email asynchronously without risking payment completion
        sendOrderConfirmationEmail(updatedOrder, updatedPayment).catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("Payment confirmation email sending error:", err.message || err);
        });

        return { success: true, message: "Payment Completed Successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const failPayment = async (query: Record<string, string>) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: query.transactionId },
            { status: PAYMENT_STATUS.FAILED },
            { new: true, runValidators: true, session }
        );

        if (updatedPayment?.order) {
            await Order.findByIdAndUpdate(
                updatedPayment.order,
                { paymentStatus: PAYMENT_STATUS.FAILED },
                { runValidators: true, session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return { success: false, message: "Payment Failed" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const cancelPayment = async (query: Record<string, string>) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: query.transactionId },
            { status: PAYMENT_STATUS.CANCELLED },
            { new: true, runValidators: true, session }
        );

        if (updatedPayment?.order) {
            await Order.findByIdAndUpdate(
                updatedPayment.order,
                { paymentStatus: PAYMENT_STATUS.CANCELLED },
                { runValidators: true, session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return { success: false, message: "Payment Cancelled" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getInvoiceDownloadUrl = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId).select("invoiceUrl");

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (!payment.invoiceUrl) {
        throw new AppError(httpStatus.NOT_FOUND, "No invoice found for this payment");
    }

    return payment.invoiceUrl;
};

export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
};
