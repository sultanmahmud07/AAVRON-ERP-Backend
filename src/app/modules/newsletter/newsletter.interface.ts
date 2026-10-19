export interface INewsletter {
    email: string;
    isSubscribed: boolean;
    source?: string;
    subscribedAt?: Date;
    unsubscribedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
