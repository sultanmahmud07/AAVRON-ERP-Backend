import express from "express";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { BlogController } from "./blog.controller";
import { createBlogZodSchema, updateBlogZodSchema } from "./blog.validation";

const router = express.Router();
router.get("/", BlogController.getAllBlog);

router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    multerUpload.single("file"),
    validateRequest(createBlogZodSchema),
    BlogController.createBlog
);

router.get(
    "/:slug",
    BlogController.getSingleBlog
);
router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
     multerUpload.single("file"),
    validateRequest(updateBlogZodSchema),
    BlogController.updateBlog
);

router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), BlogController.deleteBlog);




export const BlogRoutes = router