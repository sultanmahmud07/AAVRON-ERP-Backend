import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = Router();

// Dashboard Overview (Supports both /stats and /stats/overview)
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getDashboardOverview
);

router.get(
    "/overview",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getDashboardOverview
);

// Sales Analytics
router.get(
    "/sales/weekly",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getWeeklySales
);

router.get(
    "/sales/monthly",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getMonthlySales
);

// Domain-specific stats
router.get(
    "/user",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getUserStats
);

router.get(
    "/product",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getProductStats
);

router.get(
    "/order",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getOrderStats
);

router.get(
    "/payment",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    StatsController.getPaymentStats
);

export const StatsRoutes = router;
