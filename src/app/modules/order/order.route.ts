import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { optionalAuth } from "../../middlewares/optionalAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { OrderController } from "./order.controller";
import { createOrderZodSchema, updateOrderStatusZodSchema } from "./order.validation";

const router = Router();

// Guest & Authenticated checkout
router.post(
    "/create",
    optionalAuth,
    validateRequest(createOrderZodSchema),
    OrderController.createOrder
);

router.get(
    "/my-orders",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
    OrderController.getUserOrders
);

router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    OrderController.getAllOrders
);

router.get(
    "/:id",
    optionalAuth,
    OrderController.getSingleOrder
);

router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateOrderStatusZodSchema),
    OrderController.updateOrderStatus
);

router.patch(
    "/:id/cancel",
    optionalAuth,
    OrderController.cancelOrder
);

export const OrderRoutes = router;
