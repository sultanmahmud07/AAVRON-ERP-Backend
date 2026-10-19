import { z } from "zod";

export const subscribeNewsletterZodSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
    source: z.string().optional(),
});

export const unsubscribeNewsletterZodSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
});
