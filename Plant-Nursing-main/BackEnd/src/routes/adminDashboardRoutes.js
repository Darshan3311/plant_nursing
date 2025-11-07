// admin dashboard routes
import express from "express";
import {
  getIncomeData,
  getBookingStats,
  getNutrientStock
} from "../controllers/adminDashboardController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect, adminOnly);

// get income data
router.get("/income", getIncomeData);

// get booking stats
router.get("/bookings", getBookingStats);

// get nutrient stock
router.get("/nutrients", getNutrientStock);

export default router;
