// src/app/modules/blog/blog.model.ts
import { Schema, model } from "mongoose";
import { IBlog } from "./blog.interface";

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    reference: { type: String, required: true, lowercase: true },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory"},
    metaTitle: String,
    metaDescription: String,
    description: { type: String, required: true },
    readTime: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    keywords: [{ type: String }],
    relevantKeywords: [{ type: String }],
    focusingKeyword: { type: String },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    thumbnail: String,
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Blog = model<IBlog>("Blog", blogSchema);
