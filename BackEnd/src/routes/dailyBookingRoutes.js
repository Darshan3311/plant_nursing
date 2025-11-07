import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createDailyBooking, updateDailyBooking, deleteDailyBooking } from "../controllers/dailyBookingController.js";

const router = express.Router();

router.use(protect, adminOnly);

// Create a daily booking and record income
router.post("/", createDailyBooking);

// Update within 48 hours
router.put("/:id", updateDailyBooking);

// Delete within 48 hours
router.delete("/:id", deleteDailyBooking);

export default router;
