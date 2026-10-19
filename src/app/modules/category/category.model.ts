import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        description: { type: String },
        image: { type: String },
        thumbnail: { type: String },
        itemCount: { type: Number, default: 0 },
        featured: { type: Boolean, default: false },
        tagline: { type: String },
        badge: { type: String },
        startingPrice: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

export const Category = model<ICategory>("Category", categorySchema);