import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { NewsletterController } from "./newsletter.controller";
import { subscribeNewsletterZodSchema, unsubscribeNewsletterZodSchema } from "./newsletter.validation";

const router = Router();

// Public subscription endpoints
router.post(
    "/subscribe",
    validateRequest(subscribeNewsletterZodSchema),
    NewsletterController.subscribe
);

router.post(
    "/",
    validateRequest(subscribeNewsletterZodSchema),
    NewsletterController.subscribe
);

router.post(
    "/unsubscribe",
    validateRequest(unsubscribeNewsletterZodSchema),
    NewsletterController.unsubscribe
);

// Admin-only endpoints
router.get(
    "/stats",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    NewsletterController.getNewsletterStats
);

router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    NewsletterController.getAllSubscribers
);

router.delete(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    NewsletterController.deleteSubscriber
);

export const NewsletterRoutes = router;
