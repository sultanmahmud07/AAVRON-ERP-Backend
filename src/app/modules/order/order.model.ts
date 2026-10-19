import { model, Schema } from "mongoose";
import { IOrder, IOrderItem, IShippingAddress, ORDER_STATUS, PAYMENT_METHOD } from "./order.interface";
import { PAYMENT_STATUS } from "../payment/payment.interface";

const orderItemSchema = new Schema<IOrderItem>(
    {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        name: { type: String, required: true },
        slug: { type: String },
        image: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        size: { type: String },
        color: { type: String },
    },
    { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
    {
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String },
        country: { type: String, default: "Bangladesh" },
        specialInstructions: { type: String },
        notes: { type: String },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        user: { type: Schema.Types.ObjectId, ref: "User" },
        isGuest: { type: Boolean, default: false },
        deliveryZone: { type: String, default: "inside_dhaka" },
        items: { type: [orderItemSchema], required: true },
        shippingAddress: { type: shippingAddressSchema, required: true },
        paymentMethod: {
            type: String,
            enum: Object.values(PAYMENT_METHOD),
            default: PAYMENT_METHOD.COD,
        },
        payment: { type: Schema.Types.ObjectId, ref: "Payment" },
        subtotal: { type: Number, required: true },
        shippingCost: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDING,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID,
        },
    },
    { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "shippingAddress.phone": 1 });

export const Order = model<IOrder>("Order", orderSchema);
