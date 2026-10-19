import mongoose from "mongoose";

export const cleanLegacyIndexes = async () => {
    try {
        if (!mongoose.connection.db) return;

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (collectionNames.includes("payments")) {
            const paymentIndexes = await mongoose.connection.db.collection("payments").indexes();
            const hasBookingIndex = paymentIndexes.some(idx => idx.name === "booking_1");
            if (hasBookingIndex) {
                await mongoose.connection.db.collection("payments").dropIndex("booking_1");
                // eslint-disable-next-line no-console
                console.log("Successfully dropped legacy 'booking_1' index from payments collection.");
            }
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Legacy index cleanup error (safe to ignore):", error);
    }
};
