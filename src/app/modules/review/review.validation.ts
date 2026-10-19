import { z } from "zod";
import { REVIEW_STATUS } from "./review.interface";

export const createReviewZodSchema = z.object({
    product: z.string().min(1, "Product ID or slug is required").optional(),
    productId: z.string().optional(),
    userName: z.string().min(1, "Your name is required").optional(),
    name: z.string().optional(),
    userEmail: z.string().email().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    rating: z.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
    comment: z.string().min(3, "Review comment must be at least 3 characters long"),
    images: z.array(z.string()).optional(),
}).refine(
    (data) => data.product || data.productId,
    { message: "Product is required", path: ["product"] }
);

export const updateReviewZodSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(3).optional(),
    status: z.nativeEnum(REVIEW_STATUS).optional(),
});
