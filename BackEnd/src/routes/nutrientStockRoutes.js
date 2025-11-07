import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createNutrientStock, listNutrientStock } from "../controllers/nutrientStockController.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", listNutrientStock);
router.post("/", createNutrientStock);

export default router;
