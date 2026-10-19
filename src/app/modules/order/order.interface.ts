import { Types } from "mongoose";
import { PAYMENT_STATUS } from "../payment/payment.interface";

export enum ORDER_STATUS {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

export enum PAYMENT_METHOD {
    SSLCOMMERZ = "SSLCOMMERZ",
    COD = "COD"
}

export interface IOrderItem {
    product: Types.ObjectId | string;
    name: string;
    slug?: string;
    image?: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
}

export interface IShippingAddress {
    name: string;
    fullName?: string;
    email?: string;
    phone: string;
    phoneNumber?: string;
    address: string;
    detailedAddress?: string;
    city: string;
    district?: string;
    postalCode?: string;
    country?: string;
    specialInstructions?: string;
    notes?: string;
}

export interface IOrder {
    orderNumber: string;
    user?: Types.ObjectId;
    isGuest?: boolean;
    deliveryZone?: "inside_dhaka" | "outside_dhaka" | string;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    paymentMethod: PAYMENT_METHOD;
    payment?: Types.ObjectId;
    subtotal: number;
    shippingCost: number;
    deliveryFee?: number;
    discount: number;
    totalAmount: number;
    status: ORDER_STATUS;
    paymentStatus: PAYMENT_STATUS;
    createdAt?: Date;
    updatedAt?: Date;
}
