import { model, Schema } from "mongoose";
import { CONTACT_STATUS, IContact, INQUIRY_TOPIC } from "./contact.interface";

const contactSchema = new Schema<IContact>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        topic: {
            type: String,
            enum: Object.values(INQUIRY_TOPIC),
            default: INQUIRY_TOPIC.GENERAL,
        },
        orderNumber: {
            type: String,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: Object.values(CONTACT_STATUS),
            default: CONTACT_STATUS.PENDING,
        },
        adminNotes: {
            type: String,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

export const Contact = model<IContact>("Contact", contactSchema);
