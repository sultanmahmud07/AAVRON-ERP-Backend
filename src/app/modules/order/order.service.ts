/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { sendOrderConfirmationEmail } from "../../utils/orderEmail";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Product } from "../product/product.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { orderSearchableFields } from "./order.constant";
import { IShippingAddress, ORDER_STATUS, PAYMENT_METHOD } from "./order.interface";
import { Order } from "./order.model";

const generateOrderNumber = (): string => {
    return `ARV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const normalizeShippingAddress = (rawAddress: any): IShippingAddress => {
    return {
        name: rawAddress.name || rawAddress.fullName || "Guest Customer",
        phone: rawAddress.phone || rawAddress.phoneNumber || "",
        email: rawAddress.email || "",
        address: rawAddress.address || rawAddress.detailedAddress || rawAddress.streetAddress || "",
        city: rawAddress.city || rawAddress.district || "Dhaka",
        postalCode: rawAddress.postalCode || "",
        country: rawAddress.country || "Bangladesh",
        notes: rawAddress.notes || rawAddress.specialInstructions || "",
    };
};

const createOrder = async (payload: any, userId?: string) => {
    const transactionId = getTransactionId();
    const orderNumber = generateOrderNumber();

    if (!payload.items || payload.items.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order must contain at least one item.");
    }

    const shippingAddress = normalizeShippingAddress(payload.shippingAddress || {});
    const deliveryZone = payload.deliveryZone || "inside_dhaka";
    const paymentMethod = payload.paymentMethod || PAYMENT_METHOD.COD;

    // Verify and compute amounts
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of payload.items) {
        let product = null;
        if (item.product && /^[0-9a-fA-F]{24}$/.test(item.product)) {
            product = await Product.findById(item.product);
        } else if (item.slug) {
            product = await Product.findOne({ slug: item.slug });
        } else {
            product = await Product.findOne({ name: item.name });
        }

        const price = item.price ?? product?.price ?? 0;
        const quantity = Number(item.quantity) || 1;
        calculatedSubtotal += price * quantity;

        validatedItems.push({
            product: product?._id,
            name: item.name || product?.name || "Apparel Item",
            slug: item.slug || product?.slug,
            image: item.image || product?.images?.[0],
            price,
            quantity,
            size: item.size,
            color: item.color,
        });
    }

    const shippingCost = payload.shippingCost ?? payload.deliveryFee ?? 0;
    const discount = payload.discount ?? 0;
    const totalAmount = calculatedSubtotal + shippingCost - discount;

    const session = await Order.startSession();
    session.startTransaction();

    try {
        const orderData: any = {
            orderNumber,
            isGuest: !userId,
            deliveryZone,
            items: validatedItems,
            shippingAddress,
            paymentMethod,
            subtotal: calculatedSubtotal,
            shippingCost,
            discount,
            totalAmount,
            status: ORDER_STATUS.PENDING,
            paymentStatus: PAYMENT_STATUS.UNPAID,
        };

        if (userId) {
            orderData.user = userId;
        }

        const [newOrder] = await Order.create([orderData], { session });

        // Update product stock counts if product ID exists
        for (const item of validatedItems) {
            if (item.product) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { session }
                );
            }
        }

        const [payment] = await Payment.create(
            [
                {
                    order: newOrder._id,
                    transactionId,
                    amount: totalAmount,
                    status: PAYMENT_STATUS.UNPAID,
                    paymentGatewayData: { paymentMethod },
                },
            ],
            { session }
        );

        const updatedOrder = await Order.findByIdAndUpdate(
            newOrder._id,
            { payment: payment._id },
            { new: true, session }
        ).populate("payment");

        let paymentUrl: string | null = null;

        if (paymentMethod === PAYMENT_METHOD.SSLCOMMERZ) {
            const sslPayload: ISSLCommerz = {
                address: shippingAddress.address,
                email: shippingAddress.email || "guest@arvyno.com",
                phoneNumber: shippingAddress.phone,
                name: shippingAddress.name,
                amount: totalAmount,
                transactionId,
            };

            const sslResponse = await SSLService.sslPaymentInit(sslPayload);
            paymentUrl = sslResponse.GatewayPageURL;
        }

        await session.commitTransaction();
        session.endSession();

        // For Cash on Delivery orders, send order confirmation email if valid email exists
        if (paymentMethod === PAYMENT_METHOD.COD && updatedOrder) {
            sendOrderConfirmationEmail(updatedOrder, payment).catch((err: any) => {
                // eslint-disable-next-line no-console
                console.error("Order confirmation email sending error:", err.message || err);
            });
        }

        return {
            order: updatedOrder,
            paymentUrl,
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getUserOrders = async (userId: string, query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Order.find({ user: userId }).populate("payment"),
        query
    );

    const ordersQuery = queryBuilder
        .search(orderSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        ordersQuery.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const getSingleOrder = async (orderIdOrNumber: string) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderIdOrNumber);
    const order = isObjectId
        ? await Order.findById(orderIdOrNumber).populate("payment")
        : await Order.findOne({ orderNumber: orderIdOrNumber }).populate("payment");

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const getAllOrders = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Order.find().populate("user", "name email phone address").populate("payment"),
        query
    );

    const ordersQuery = queryBuilder
        .search(orderSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        ordersQuery.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const updateOrderStatus = async (id: string, status: ORDER_STATUS) => {
    const order = await Order.findById(id);
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).populate("payment");

    return updatedOrder;
};

const cancelOrder = async (id: string, userId?: string, isAdmin = false) => {
    const filter: Record<string, any> = { _id: id };
    if (!isAdmin && userId) {
        filter.user = userId;
    }

    const order = await Order.findOne(filter);
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.DELIVERED) {
        throw new AppError(httpStatus.BAD_REQUEST, `Cannot cancel an order that is already ${order.status.toLowerCase()}`);
    }

    // Restore inventory
    for (const item of order.items) {
        if (item.product) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }
    }

    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    return order;
};

export const OrderService = {
    createOrder,
    getUserOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
};
