import { model, Schema } from "mongoose";
import { IProduct, IProductColor } from "./product.interface";

const productColorSchema = new Schema<IProductColor>(
    {
        name: { type: String, required: true },
        hex: { type: String, required: true },
    },
    { _id: false }
);

const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        subtitle: { type: String },
        description: { type: String },
        shortDescription: { type: String },
        price: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, min: 0 },
        category: { type: String, trim: true },
        categorySlug: { type: String, trim: true, lowercase: true },
        images: { type: [String], default: [] },
        colors: { type: [productColorSchema], default: [] },
        sizes: { type: [String], default: [] },
        stock: { type: Number, required: true, default: 0, min: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0, min: 0 },
        tags: { type: [String], default: [] },
        details: { type: [String], default: [] },
        fabricCare: { type: [String], default: [] },
        isNew: { type: Boolean, default: false },
        isTrending: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        isFeatured: { type: Boolean, default: false },
        deleteImages: { type: [String], default: [] },
    },
    { timestamps: true, suppressReservedKeysWarning: true }
);

productSchema.index({ categorySlug: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ isTrending: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });

export const Product = model<IProduct>("Product", productSchema);