// asset routes
import express from "express";
import {
  createAsset,
  createNutrient,
  getCropGroups,
  getVarieties,
  upsertStock,
  getAssets,
  getNutrients,
  getStock,
  updateAsset,
  updateNutrient,
  updateStock,
  deleteAsset,
  deleteNutrient,
  deleteStock,
} from "../controllers/assetController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);

// --- assets ---
router.get("/assets", getAssets);
router.post("/asset", createAsset);
router.put("/asset/:id", updateAsset);
router.delete("/asset/:id", deleteAsset);

// --- nutrients ---
router.get("/nutrients", getNutrients);
router.post("/nutrient", createNutrient);
router.put("/nutrient/:id", updateNutrient);
router.delete("/nutrient/:id", deleteNutrient);

// --- stock ---
router.get("/stock", getStock);
router.get("/stock/crop-groups", getCropGroups);
router.get("/stock/varieties", getVarieties);
router.post("/stock", upsertStock);
router.put("/stock/:id", updateStock);
router.delete("/stock/:id", deleteStock);

export default router;
