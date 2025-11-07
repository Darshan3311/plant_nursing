// booking routes
import express from "express";
import {
  createBooking,
  getBookings,
  deleteBooking,
  promoteBookingStatus,
  payBooking
} from "../controllers/bookingController.js";
import { getBookingById } from "../controllers/bookingController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);

// get all bookings
router.get("/", getBookings);

// create new booking
router.post("/create", createBooking);

// delete booking by id
router.delete("/:id", deleteBooking);

// promote booking status
router.patch("/:id/promote", promoteBookingStatus);

// pay remaining / add payment
router.post("/:id/pay", payBooking);

// get single booking (keep after more specific routes)
router.get("/:id", getBookingById);

export default router;
