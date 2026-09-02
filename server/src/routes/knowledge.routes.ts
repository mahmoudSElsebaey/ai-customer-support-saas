import { Router } from "express";
import * as knowledgeController from "../controllers/knowledge.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createArticleSchema,
  updateArticleSchema,
  listArticlesSchema,
} from "../validations/knowledge.validation.js";

const router = Router();

router.use(protect, requireTenant);

router.get(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(listArticlesSchema),
  knowledgeController.listArticles
);

router.get(
  "/categories",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  knowledgeController.listCategories
);

router.get(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  knowledgeController.getArticle
);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(createArticleSchema),
  knowledgeController.createArticle
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER"),
  validate(updateArticleSchema),
  knowledgeController.updateArticle
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  knowledgeController.deleteArticle
);

export default router;
