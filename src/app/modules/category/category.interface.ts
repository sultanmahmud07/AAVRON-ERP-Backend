export interface ICategory {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    thumbnail?: string;
    itemCount?: number;
    featured?: boolean;
    tagline?: string;
    badge?: string;
    startingPrice?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
