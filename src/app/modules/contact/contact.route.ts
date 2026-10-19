import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { optionalAuth } from "../../middlewares/optionalAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ContactController } from "./contact.controller";
import { createContactZodSchema, updateContactZodSchema } from "./contact.validation";

const router = Router();

// Public / Guest / User inquiry submission
router.post(
    "/create",
    optionalAuth,
    validateRequest(createContactZodSchema),
    ContactController.createContact
);

router.post(
    "/send",
    optionalAuth,
    validateRequest(createContactZodSchema),
    ContactController.createContact
);

// Admin-only endpoints
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ContactController.getAllContacts
);

router.get(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ContactController.getSingleContact
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateContactZodSchema),
    ContactController.updateContact
);

router.delete(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    ContactController.deleteContact
);

export const ContactRoutes = router;
