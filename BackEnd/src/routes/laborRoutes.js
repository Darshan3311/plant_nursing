// labor routes
import express from "express";
import {
  addLabor,
  getAllLabors,
  updateLabor,
  deleteLabor
} from "../controllers/laborController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);

// add labor
router.post("/", addLabor);

// get all labors
router.get("/", getAllLabors);

// update labor by id
router.put("/:id", updateLabor);

// delete labor by id
router.delete("/:id", deleteLabor);

export default router;
