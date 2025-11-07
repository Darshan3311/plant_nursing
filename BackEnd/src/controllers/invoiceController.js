
// controllers/invoiceController.js
import Booking from "../models/Booking.js";
import Farmer from "../models/Farmer.js";
import {ApiResponse} from "../utils/apiResponse.js";

export const getInvoiceDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("farmer")       // includes full farmer details
      .populate("cropGroup");   // includes crop group details if needed

    if (!booking) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Booking not found"));
    }
    
    return res.status(200).json(
      new ApiResponse(
        200,
        booking, // booking already contains farmer & cropGroup populated
        "Invoice data fetched successfully"
      )
    );
  } catch (err) {
    console.error("Error fetching invoice data:", err);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "Server error while fetching invoice data")
      );
  }
};
