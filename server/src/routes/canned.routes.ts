import { Router } from "express";
import * as cannedController from "../controllers/canned.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createCannedSchema,
  updateCannedSchema,
} from "../validations/canned.validation.js";

const router = Router();

router.use(protect, requireTenant);

router.get(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  cannedController.listCanned
);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(createCannedSchema),
  cannedController.createCanned
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(updateCannedSchema),
  cannedController.updateCanned
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  cannedController.deleteCanned
);

export default router;
