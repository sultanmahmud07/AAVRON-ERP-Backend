import { Types } from "mongoose";

export enum CONTACT_STATUS {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    ARCHIVED = "ARCHIVED",
}

export enum INQUIRY_TOPIC {
    GENERAL = "GENERAL",
    SIZING_GUIDANCE = "SIZING_GUIDANCE",
    ORDER_TRACKING = "ORDER_TRACKING",
    STYLING_ADVICE = "STYLING_ADVICE",
    ATELIER_APPOINTMENT = "ATELIER_APPOINTMENT",
    BESPOKE = "BESPOKE",
}

export interface IContact {
    name: string;
    phone: string;
    email?: string;
    topic?: INQUIRY_TOPIC;
    orderNumber?: string;
    message: string;
    status?: CONTACT_STATUS;
    adminNotes?: string;
    user?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
