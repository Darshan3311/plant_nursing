// test routes for role-based access
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// staff or admin can see this
router.get("/staff-area", protect, (req, res) => {
  res.json({
    message: `Welcome ${req.user.staffId}, you are a ${req.user.role}`,
  });
});

// only admin can see this
router.get("/admin-area", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin! Only admins can see this." });
});

export default router;
