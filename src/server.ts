/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";
import { connectRedis } from "./app/config/redis.config";
import { ReviewService } from "./app/modules/review/review.service";
import { cleanLegacyIndexes } from "./app/utils/cleanLegacyIndexes";
import { seedEcommerceData } from "./app/utils/seedEcommerceData";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";

let server: Server;


const startServer = async (): Promise<boolean> => {
    // Start HTTP server so port is bound and active
    server = app.listen(envVars.PORT, () => {
        console.log(`🚀 Server is listening on port ${envVars.PORT}`);
    });

    try {
        await mongoose.connect(envVars.DB_URL);
        console.log(" Connected to DB!!");
        await cleanLegacyIndexes();
        return true;
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        console.error("💡 Hint: Your IP has changed. Please add 0.0.0.0/0 (or your current IP) to MongoDB Atlas -> Network Access.");
        return false;
    }
}

(async () => {
    try {
        await connectRedis();
    } catch (redisErr) {
        console.error("Redis connection warning:", redisErr);
    }

    const isConnected = await startServer();
    if (isConnected) {
        await seedSuperAdmin();
        await seedEcommerceData();
        await ReviewService.syncAllProductRatings();
    } else {
        console.warn("⚠️ Database not connected. Skipping seeding and background sync. Please whitelist your IP in Atlas.");
    }
})();

process.on("SIGTERM", () => {
    console.log("SIGTERM signal recieved... Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})

process.on("SIGINT", () => {
    console.log("SIGINT signal recieved... Server shutting down..");

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})


process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejecttion detected... Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception detected... Server shutting down..", err);

    if (server) {
        server.close(() => {
            process.exit(1)
        });
    }

    process.exit(1)
})

// Unhandler rejection error
// Promise.reject(new Error("I forgot to catch this promise"))

// Uncaught Exception Error
// throw new Error("I forgot to handle this local erro")


/**
 * unhandled rejection error
 * uncaught rejection error
 * signal termination sigterm
 */

