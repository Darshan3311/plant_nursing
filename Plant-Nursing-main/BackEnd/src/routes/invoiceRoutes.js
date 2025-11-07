// invoice routes
import express from "express";
import { getInvoiceDetails, } from "../controllers/invoiceController.js";
import { protect, staffOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, staffOrAdmin);
router.get("/:bookingId", getInvoiceDetails);



export default router;
