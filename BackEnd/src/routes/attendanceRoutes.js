// attendance routes
import express from "express";
import {
  markAttendance,
  getAvailableLabors,
  getAttendanceByMonth,
  paySalary,
} from "../controllers/attendanceController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);

// mark daily attendance
router.post("/mark", markAttendance);

// get labors available for today
router.get("/available-labors", getAvailableLabors);

// get monthly attendance summary
router.get("/attendance", getAttendanceByMonth);

// pay salary for a labor
router.post("/pay-salary", paySalary);

export default router;
