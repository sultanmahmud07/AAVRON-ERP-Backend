import { IReview } from "../review/review.interface";

export interface IProductColor {
    name: string;
    hex: string;
}

export interface IProduct {
    id?: string;
    slug: string;
    name: string;
    subtitle?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    category?: string;
    categorySlug?: string;
    images: string[];
    colors?: IProductColor[];
    sizes?: string[];
    stock: number;
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    details?: string[];
    fabricCare?: string[];
    isNew?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    isFeatured?: boolean;
    deleteImages?: string[];
    reviews?: IReview[];
    ratingBreakdown?: Record<number, number>;
    createdAt?: Date;
    updatedAt?: Date;
}
