import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);

export default router;
