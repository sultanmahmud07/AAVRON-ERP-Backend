import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { optionalAuth } from "../../middlewares/optionalAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ReviewController } from "./review.controller";
import { createReviewZodSchema, updateReviewZodSchema } from "./review.validation";

const router = Router();

router.post(
    "/create",
    optionalAuth,
    multerUpload.array("files"),
    validateRequest(createReviewZodSchema),
    ReviewController.createReview
);

router.get("/product/:productIdOrSlug", ReviewController.getProductReviews);

router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ReviewController.getAllReviews
);

router.patch(
    "/:id",
    optionalAuth,
    validateRequest(updateReviewZodSchema),
    ReviewController.updateReview
);

router.delete(
    "/:id",
    optionalAuth,
    ReviewController.deleteReview
);

export const ReviewRoutes = router;
