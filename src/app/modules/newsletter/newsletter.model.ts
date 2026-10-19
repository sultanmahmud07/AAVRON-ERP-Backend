import { model, Schema } from "mongoose";
import { INewsletter } from "./newsletter.interface";

const newsletterSchema = new Schema<INewsletter>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        isSubscribed: {
            type: Boolean,
            default: true,
        },
        source: {
            type: String,
            default: "website_footer",
            trim: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
        unsubscribedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

newsletterSchema.index({ isSubscribed: 1 });
newsletterSchema.index({ createdAt: -1 });

export const Newsletter = model<INewsletter>("Newsletter", newsletterSchema);
