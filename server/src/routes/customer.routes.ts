import { Router } from "express";
import * as customerController from "../controllers/customer.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
} from "../validations/customer.validation.js";

const router = Router();

// All customer routes require auth + tenant
router.use(protect, requireTenant);

router.get(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(listCustomersSchema),
  customerController.listCustomers
);

router.get(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  customerController.getCustomer
);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(createCustomerSchema),
  customerController.createCustomer
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  customerController.deleteCustomer
);

export default router;
