// farmer routes
import express from "express";
import {
  createFarmer,
  getNewFarmers,
  getPendingFarmers,
  getCompletedFarmers,
  getSowingFarmers,
  updateFarmerStatus,
  getAllFarmers,
  getFarmerById,
  updateFarmer,
  deleteFarmer,
} from "../controllers/farmerController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);

// add new farmer
router.post("/", createFarmer);

// get farmers
router.get("/", getNewFarmers);        // default = new farmers
router.get("/all-farmers", getAllFarmers);
router.get("/new", getNewFarmers);
router.get("/sowing", getSowingFarmers);
router.get("/completed", getCompletedFarmers);
router.get("/pending", getPendingFarmers);

// update farmer status
router.patch("/:id/status", updateFarmerStatus);

// get single farmer
router.get("/:id", getFarmerById);

// update farmer
router.put("/:id", updateFarmer);

// delete farmer
router.delete("/:id", deleteFarmer);

export default router;
