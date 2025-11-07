// staff dashboard routes
import express from "express";
import {
  getOverviewMetrics,
  getUpcomingSchedules,
  getRecentPayments,
  getMonthlyBookings,
  getTopCrops,
  getLowStockDetails,
  getAllUpcomingSchedules,
  getAllRecentPayments,
} from "../controllers/staffDashboardController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect, staffOrAdmin);

// overview stats
router.get("/overview", getOverviewMetrics);

// schedules (short)
router.get("/schedules", getUpcomingSchedules);

// payments (short)
router.get("/payments", getRecentPayments);

// monthly bookings
router.get("/monthly-bookings", getMonthlyBookings);

// top crops
router.get("/top-crops", getTopCrops);

// low stock
router.get("/low-stock", getLowStockDetails);

// schedules (all)
router.get("/schedules/all", getAllUpcomingSchedules);

// payments (all)
router.get("/payments/all", getAllRecentPayments);

export default router;
