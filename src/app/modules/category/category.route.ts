import { Router } from "express";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { CategoryController } from "./category.controller";
import { createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(createCategorySchema),
    CategoryController.createCategory
);

router.get("/", CategoryController.getAllCategories);
router.get("/:slug", CategoryController.getSingleCategory);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(updateCategorySchema),
    CategoryController.updateCategory
);

router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;