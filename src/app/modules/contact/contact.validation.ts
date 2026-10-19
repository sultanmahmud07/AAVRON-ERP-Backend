import { z } from "zod";
import { CONTACT_STATUS, INQUIRY_TOPIC } from "./contact.interface";

export const createContactZodSchema = z
    .object({
        name: z.string().optional(),
        fullName: z.string().optional(),
        yourFullName: z.string().optional(),
        phone: z.string().optional(),
        phoneNumber: z.string().optional(),
        mobileNumber: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        topic: z.nativeEnum(INQUIRY_TOPIC).optional(),
        orderNumber: z.string().optional(),
        orderReference: z.string().optional(),
        message: z.string().optional(),
        details: z.string().optional(),
        inquiryDetails: z.string().optional(),
    })
    .refine(
        (data) => Boolean(data.name || data.fullName || data.yourFullName),
        { message: "Your Full Name is required", path: ["name"] }
    )
    .refine(
        (data) => Boolean(data.phone || data.phoneNumber || data.mobileNumber || data.whatsapp),
        { message: "Mobile Number / WhatsApp is required", path: ["phone"] }
    )
    .refine(
        (data) => Boolean(data.message || data.details || data.inquiryDetails),
        { message: "Message / Inquiry details are required", path: ["message"] }
    );

export const updateContactZodSchema = z.object({
    status: z.nativeEnum(CONTACT_STATUS).optional(),
    adminNotes: z.string().optional(),
});
