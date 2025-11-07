// src/routes/incomeRoutes.js
import express from "express";
import { getIncomeSummary } from "../controllers/incomeController.js";

const router = express.Router();

// GET /api/income/summary
router.get("/summary", getIncomeSummary);

export default router;
