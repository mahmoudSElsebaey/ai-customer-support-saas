import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);

export default router;
