import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentGatewayData: {
            type: Schema.Types.Mixed,
        },
        invoiceUrl: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ order: 1 });

export const Payment = model<IPayment>("Payment", paymentSchema);

Payment.collection.dropIndex("booking_1").catch(() => {
    // Ignore if index doesn't exist
});