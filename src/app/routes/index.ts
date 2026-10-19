import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { BlogRoutes } from "../modules/blog/blog.route";
import { CategoryRoutes } from "../modules/category/category.route";
import { ContactRoutes } from "../modules/contact/contact.route";
import { NewsletterRoutes } from "../modules/newsletter/newsletter.route";
import { OrderRoutes } from "../modules/order/order.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { ProductRoutes } from "../modules/product/product.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { StatsRoutes } from "../modules/stats/stats.route";
import { UserRoutes } from "../modules/user/user.route";

export const router = Router();

const moduleRoutes = [
    {
        path: "/user",
        route: UserRoutes,
    },
    {
        path: "/auth",
        route: AuthRoutes,
    },
    {
        path: "/category",
        route: CategoryRoutes,
    },
    {
        path: "/product",
        route: ProductRoutes,
    },
    {
        path: "/order",
        route: OrderRoutes,
    },
    {
        path: "/payment",
        route: PaymentRoutes,
    },
    {
        path: "/review",
        route: ReviewRoutes,
    },
    {
        path: "/contact",
        route: ContactRoutes,
    },
    {
        path: "/newsletter",
        route: NewsletterRoutes,
    },
    {
        path: "/blog",
        route: BlogRoutes,
    },
    {
        path: "/otp",
        route: OtpRoutes,
    },
    {
        path: "/stats",
        route: StatsRoutes,
    },
];

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});