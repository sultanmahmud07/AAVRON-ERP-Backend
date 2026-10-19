import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    image: z.string().optional(),
    thumbnail: z.string().optional(),
    itemCount: z.number().optional(),
    featured: z.boolean().optional(),
    tagline: z.string().optional(),
    badge: z.string().optional(),
    startingPrice: z.number().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    thumbnail: z.string().optional(),
    itemCount: z.number().optional(),
    featured: z.boolean().optional(),
    tagline: z.string().optional(),
    badge: z.string().optional(),
    startingPrice: z.number().optional(),
});
