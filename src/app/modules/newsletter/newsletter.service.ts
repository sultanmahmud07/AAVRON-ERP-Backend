/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { sendEmail } from "../../utils/sendEmail";
import { newsletterSearchableFields } from "./newsletter.constant";
import { Newsletter } from "./newsletter.model";

const subscribe = async (payload: { email: string; source?: string }) => {
    const email = payload.email.toLowerCase().trim();
    const source = payload.source || "website_footer";

    let subscriber = await Newsletter.findOne({ email });
    let isNewSubscription = false;

    if (subscriber) {
        if (subscriber.isSubscribed) {
            return {
                subscriber,
                isAlreadySubscribed: true,
                message: "You are already subscribed to the ARVYNO Private Club Newsletter.",
            };
        }

        // Re-subscribe previously unsubscribed email
        subscriber.isSubscribed = true;
        subscriber.source = source;
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = undefined;
        await subscriber.save();
        isNewSubscription = true;
    } else {
        subscriber = await Newsletter.create({
            email,
            isSubscribed: true,
            source,
            subscribedAt: new Date(),
        });
        isNewSubscription = true;
    }

    // Send welcome email to subscriber asynchronously
    if (isNewSubscription) {
        sendEmail({
            to: email,
            subject: "Welcome to the ARVYNO Private Club",
            templateName: "newsletterWelcome",
            templateData: {
                email,
            },
        }).catch((err: any) => {
            // eslint-disable-next-line no-console
            console.error("Failed to send newsletter welcome email:", err.message || err);
        });
    }

    return {
        subscriber,
        isAlreadySubscribed: false,
        message: "Thank you for subscribing to the ARVYNO Private Club Newsletter.",
    };
};

const unsubscribe = async (email: string) => {
    const formattedEmail = email.toLowerCase().trim();
    const subscriber = await Newsletter.findOne({ email: formattedEmail });

    if (!subscriber) {
        throw new AppError(httpStatus.NOT_FOUND, "Email not found in our newsletter list.");
    }

    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    return subscriber;
};

const getAllSubscribers = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Newsletter.find(), query);

    const subscribersQuery = queryBuilder
        .search(newsletterSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        subscribersQuery.build(),
        queryBuilder.getMeta(),
    ]);

    return { data, meta };
};

const deleteSubscriber = async (id: string) => {
    const subscriber = await Newsletter.findById(id);
    if (!subscriber) {
        throw new AppError(httpStatus.NOT_FOUND, "Subscriber not found.");
    }

    await Newsletter.findByIdAndDelete(id);
    return null;
};

const getNewsletterStats = async () => {
    const [total, active, unsubscribed] = await Promise.all([
        Newsletter.countDocuments(),
        Newsletter.countDocuments({ isSubscribed: true }),
        Newsletter.countDocuments({ isSubscribed: false }),
    ]);

    return {
        total,
        active,
        unsubscribed,
    };
};

export const NewsletterService = {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    deleteSubscriber,
    getNewsletterStats,
};
