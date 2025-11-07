// src/routes/sowingRoutes.js
import express from "express";
import {
  getOngoingAndUpcomingSchedules,
  updateSchedule,
} from "../controllers/scheduleController.js";

const router = express.Router();

// Public stubs for now
// GET  /api/progress/summary  -> returns dummy progress JSON
router.get('/', getOngoingAndUpcomingSchedules);

// // PATCH /api/progress/update   -> accepts a JSON body and returns a stub response
router.patch('/update', updateSchedule);




export default router;
