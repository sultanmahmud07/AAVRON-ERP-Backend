import { Types } from "mongoose";

export enum REVIEW_STATUS {
    APPROVED = "APPROVED",
    PENDING = "PENDING",
    REJECTED = "REJECTED"
}

export interface IReview {
    product: Types.ObjectId;
    user?: Types.ObjectId;
    userName: string;
    userEmail?: string;
    rating: number;
    comment: string;
    isVerifiedBuyer?: boolean;
    images?: string[];
    status?: REVIEW_STATUS;
    createdAt?: Date;
    updatedAt?: Date;
}
