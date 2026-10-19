import { model, Schema } from "mongoose";
import { IReview, REVIEW_STATUS } from "./review.interface";

const reviewSchema = new Schema<IReview>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        userEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        isVerifiedBuyer: {
            type: Boolean,
            default: true,
        },
        images: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: Object.values(REVIEW_STATUS),
            default: REVIEW_STATUS.APPROVED,
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });

export const Review = model<IReview>("Review", reviewSchema);
