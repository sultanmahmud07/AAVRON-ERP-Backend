import express from "express";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { ProductController } from "./product.controller";

const router = express.Router();

router.get("/", ProductController.getAllProducts);
router.get("/related/:slug", ProductController.getRelatedProducts);
router.get("/:slug", ProductController.getSingleProduct);

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.array("files"),
    ProductController.createProduct
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.array("files"),
    ProductController.updateProduct
);

router.delete(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ProductController.deleteProduct
);

export const ProductRoutes = router;