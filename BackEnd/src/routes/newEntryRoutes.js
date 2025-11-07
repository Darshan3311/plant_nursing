import express from "express";
import { createNewEntry, getNewEntries, deleteNewEntry, updateNewEntryVarieties } from "../controllers/newEntryController.js";

const router = express.Router();

router.post("/", createNewEntry);
router.get("/", getNewEntries);
router.patch("/:id", updateNewEntryVarieties);
router.delete("/:id", deleteNewEntry);

export default router;
