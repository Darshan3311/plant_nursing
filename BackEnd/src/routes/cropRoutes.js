// crop routes
import express from "express";
import {
  addCropGroup,
  addCropVariety,
  getAllCropGroups,
  getVarietiesByGroup
} from "../controllers/cropController.js";
import { protect, staffOrAdmin, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- staff or admin ---
router.use(protect, staffOrAdmin);
router.post("/addgroups", addCropGroup);
router.post("/addvarieties", addCropVariety);
router.get("/groups", getAllCropGroups);
router.get("/varieties/:groupId", getVarietiesByGroup);


export default router;
