/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { sendEmail } from "../../utils/sendEmail";
import { User } from "../user/user.model";
import { contactSearchableFields } from "./contact.constant";
import { CONTACT_STATUS, IContact, INQUIRY_TOPIC } from "./contact.interface";
import { Contact } from "./contact.model";

const createContact = async (payload: any, userId?: string) => {
    let name = payload.name || payload.fullName || payload.yourFullName;
    const phone = payload.phone || payload.phoneNumber || payload.mobileNumber || payload.whatsapp;
    let email = payload.email;
    const message = payload.message || payload.details || payload.inquiryDetails;
    const topic = payload.topic || INQUIRY_TOPIC.GENERAL;
    const orderNumber = payload.orderNumber || payload.orderReference;

    if (userId) {
        const user = await User.findById(userId);
        if (user) {
            name = name || user.name;
            email = email || user.email;
        }
    }

    const contactData: Partial<IContact> = {
        name,
        phone,
        email,
        topic,
        orderNumber,
        message,
        status: CONTACT_STATUS.PENDING,
    };

    if (userId) {
        contactData.user = new Types.ObjectId(userId);
    }

    const contact = await Contact.create(contactData);

    // Send notification email to admin
    try {
        const adminEmail = envVars.SUPER_ADMIN_EMAIL || "arvyno365@gmail.com";
        await sendEmail({
            to: adminEmail,
            subject: `[ARVYNO] New Contact Message from ${name}`,
            templateName: "contactInquiry",
            templateData: {
                name,
                phone,
                email: email || "Not provided",
                topic,
                orderNumber: orderNumber || "N/A",
                message,
                submittedAt: new Date().toLocaleString("en-US", {
                    timeZone: "Asia/Dhaka",
                    dateStyle: "medium",
                    timeStyle: "short",
                }),
            },
        });
    } catch (emailError: any) {
        // eslint-disable-next-line no-console
        console.error("Failed to send admin concierge notification email:", emailError.message || emailError);
    }

    return contact;
};

const getAllContacts = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(
        Contact.find().populate("user", "name email phone role"),
        query
    );

    const contactsQuery = queryBuilder
        .search(contactSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        contactsQuery.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const getSingleContact = async (id: string) => {
    const contact = await Contact.findById(id).populate("user", "name email phone role");
    if (!contact) {
        throw new AppError(httpStatus.NOT_FOUND, "Inquiry not found.");
    }
    return contact;
};

const updateContact = async (id: string, payload: Partial<IContact>) => {
    const contact = await Contact.findById(id);
    if (!contact) {
        throw new AppError(httpStatus.NOT_FOUND, "Inquiry not found.");
    }

    const updatedContact = await Contact.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return updatedContact;
};

const deleteContact = async (id: string) => {
    const contact = await Contact.findById(id);
    if (!contact) {
        throw new AppError(httpStatus.NOT_FOUND, "Inquiry not found.");
    }

    await Contact.findByIdAndDelete(id);
    return null;
};

export const ContactService = {
    createContact,
    getAllContacts,
    getSingleContact,
    updateContact,
    deleteContact,
};
