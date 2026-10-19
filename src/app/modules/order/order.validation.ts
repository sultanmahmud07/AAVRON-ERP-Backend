import { z } from "zod";
import { ORDER_STATUS, PAYMENT_METHOD } from "./order.interface";

const orderItemZodSchema = z.object({
    product: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    slug: z.string().optional(),
    image: z.string().optional(),
    price: z.number().min(0, "Price must be >= 0"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    size: z.string().optional(),
    color: z.string().optional(),
});

const shippingAddressZodSchema = z.object({
    name: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    detailedAddress: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    postalCode: z.string().optional().or(z.literal("")),
    country: z.string().optional(),
    specialInstructions: z.string().optional(),
    notes: z.string().optional(),
}).refine(
    (data) => (data.name || data.fullName),
    { message: "Full name is required", path: ["fullName"] }
).refine(
    (data) => (data.phone || data.phoneNumber),
    { message: "Mobile phone number is required", path: ["phoneNumber"] }
).refine(
    (data) => (data.address || data.detailedAddress || data.streetAddress),
    { message: "Detailed street address is required", path: ["detailedAddress"] }
).refine(
    (data) => (data.city || data.district),
    { message: "City / District is required", path: ["district"] }
);

export const createOrderZodSchema = z.object({
    items: z.array(orderItemZodSchema).min(1, "At least one item is required in your bag"),
    shippingAddress: shippingAddressZodSchema,
    deliveryZone: z.string().optional(),
    paymentMethod: z.nativeEnum(PAYMENT_METHOD).default(PAYMENT_METHOD.COD),
    subtotal: z.number().min(0).optional(),
    shippingCost: z.number().min(0).optional(),
    deliveryFee: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
});

export const updateOrderStatusZodSchema = z.object({
    status: z.nativeEnum(ORDER_STATUS),
});
