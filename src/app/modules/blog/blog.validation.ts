import { z } from "zod";

export const createBlogZodSchema = z.object({
    title: z.string().min(3, "Title is required"),
    slug: z.string().min(3, "Slug is required"),
    reference: z.string().min(3, "Reference site is required"),
    category: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    description: z.string().min(10),
    readTime: z.number().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    relevantKeywords: z.array(z.string()).optional(),
    focusingKeyword: z.string().optional(),
    content: z.string().min(20),
    thumbnail: z.string().optional(),
});

// Update Product Validator
export const updateBlogZodSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").optional(),
  slug: z.string().optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional(), // ObjectId validation
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  description: z.string().optional(),
  readTime: z.number().int().positive().optional(),
  commentCount: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  relevantKeywords: z.array(z.string()).optional(),
  focusingKeyword: z.string().optional(),
  content: z.string().optional(),
  thumbnail: z.string().url("Thumbnail must be a valid URL").optional(),
  views: z.number().int().nonnegative().optional(),
  isPublished: z.boolean().optional(),
});


