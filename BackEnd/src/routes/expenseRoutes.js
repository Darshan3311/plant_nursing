// expense routes
import express from "express";
import {
  addExpenses,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  createDailyExpense,
} from "../controllers/expenseController.js";
import{createLoss,getAllLosses,deleteLoss,updateLoss} from "../controllers/lossController.js";
import { protect, staffOrAdmin, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- staff or admin ---
router.use(protect, staffOrAdmin);
router.post("/", addExpenses);
router.post("/daily", createDailyExpense);
router.post("/loss", createLoss); 
router.get("/getallloss", getAllLosses); 
router.delete("/loss/:id", deleteLoss);
router.put("/loss/:id", updateLoss);

// --- admin only ---
router.use(protect, adminOnly);
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
