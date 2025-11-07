import express from "express";
import {
  createNewEntry,
  getNewEntries,
  deleteNewEntry,
} from "../controllers/newEntryController.js";

const router = express.Router();

router.post("/", createNewEntry);
router.get("/", getNewEntries);
router.delete("/:id", deleteNewEntry);

export default router;