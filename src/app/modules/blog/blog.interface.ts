// src/app/modules/blog/blog.interface.ts
import { Types } from "mongoose";

export interface IBlog {
  title: string;
  slug: string;
  reference: string;
  category: Types.ObjectId; // ✅ Reference to Category
  metaTitle?: string;
  metaDescription?: string;
  description: string;
  readTime?: number;
  commentCount?: number;
  tags?: string[];
  keywords?: string[]; // ✅ SEO keywords
  relevantKeywords?: string[]; // ✅ Related keywords
  focusingKeyword?: string; // ✅ Main SEO keyword
  content: string;
  author?: Types.ObjectId;
  thumbnail?: string;
  views?: number; // ✅ Track blog views
  isPublished?: boolean;
}
