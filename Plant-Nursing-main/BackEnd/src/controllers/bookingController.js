// src/controllers/bookingController.js
import Booking from "../models/Booking.js";
import Farmer from "../models/Farmer.js";
import Income from "../models/Income.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import TopCrop from "../models/TopCrop.js";
import CropVariety from "../models/CropVariety.js";
import Stock from "../models/Stock.js";
import { afterBookingCreated } from "../utils/scheduleUtils.js";

export const createBooking = async (req, res) => {
  try {
    const {
      farmerId,
      bookingDate,
      cropGroup,
      variety, 
      quantity,
      ratePerUnit,
      plotNumber,
      sowingDate,
      dispatchDate,
      vehicleNumber,
      driverName,
      startKm,
      endKm,
      ratePerKm,
      advancePayment,
      totalPayment,
      pendingPayment,
      finalTotalPrice,
    } = req.body;

    // ---------- Validate farmer ----------
    const farmer = await Farmer.findById(farmerId);
    if (!farmer)
      return res.status(404).json(new ApiResponse(404, {}, "Farmer not found"));

    // ---------- Create booking ----------
    const newBooking = new Booking({
      farmer: farmerId,
      bookingDate,
      cropGroup,
      variety,
      quantity,
      ratePerUnit,
      plotNumber,
      sowingDate,
      dispatchDate,
      vehicleNumber,
      driverName,
      startKm,
      endKm,
      ratePerKm,
      advancePayment,
      totalPayment,
      pendingPayment,
      finalTotalPrice,
    });
    await newBooking.save();

    // ✅ Call your post-booking function here
    afterBookingCreated(newBooking);

    // Update farmer status
    farmer.status = "pending";
    await farmer.save();

    const qty = Number(quantity) || 0;

    // ---------- Determine varietyRef & varietyName ----------
    let varietyRef = null;
    let varietyName = typeof variety === "string" ? variety : String(variety);
    let cropGroupId = cropGroup || null;

    if (variety && mongoose.Types.ObjectId.isValid(String(variety))) {
      const cv = await CropVariety.findById(variety);
      if (cv) {
        varietyRef = cv._id;
        varietyName = cv.name;
        if (!cropGroupId && cv.group) cropGroupId = cv.group;
      }
    } else {
      const cvByName = await CropVariety.findOne({ name: varietyName });
      if (cvByName) {
        varietyRef = cvByName._id;
        varietyName = cvByName.name;
        if (!cropGroupId && cvByName.group) cropGroupId = cvByName.group;
      }
    }

    // ---------- Update TopCrop ----------
    const topCropFilter = varietyRef ? { varietyRef } : { varietyName };
    const topCropUpdate = {
      $inc: { bookedQuantity: qty },
      $set: { lastBookedAt: new Date(), varietyName },
    };
    if (cropGroupId) topCropUpdate.$set.cropGroup = cropGroupId;
    if (varietyRef) topCropUpdate.$set.varietyRef = varietyRef;

    const topCropDoc = await TopCrop.findOneAndUpdate(
      topCropFilter,
      topCropUpdate,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // ---------- Update Stock ----------
    if (varietyRef) {
      const stockDoc = await Stock.findOne({ variety: varietyRef });
      if (stockDoc) {
        stockDoc.quantity = Math.max(stockDoc.quantity - qty, 0); // prevent negative stock
        stockDoc.lastUpdated = new Date();
        await stockDoc.save();
      }
    }

    // ---------- Respond ----------
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { booking: newBooking, topCrop: topCropDoc },
          "Booking created, top-crop updated, stock decremented"
        )
      );
  } catch (error) {
    console.error("Booking creation failed:", error);
    res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};


// src/controllers/bookingController.js
export const getBookings = async (req, res) => {
  try {
    const { status } = req.query;

    const bookings = await Booking.find({})
      .populate("farmer", "fullName status")
      .populate("cropGroup", "name")
      .lean();

    // Now filter in JS by farmer.status if status query param exists
    const filteredBookings = status
      ? bookings.filter(
          (b) =>
            b.farmer?.status &&
            b.farmer.status.toLowerCase() === status.toLowerCase()
        )
      : bookings;

    // console.log("Fetched bookings:", filteredBookings);

    const formatted = filteredBookings.map((b) => ({
      _id: b._id,
      bookingId: `#${b._id.toString().slice(-4)}`,
      farmer: b.farmer?.fullName || "N/A",
      cropGroup: b.cropGroup?.name || "N/A",
      variety: b.variety || "N/A",
      quantity: `${b.quantity} seedlings`,
      bookingDate: b.bookingDate?.toISOString().split("T")[0] || "N/A",
      status: b.farmer?.status || "Pending",
      amount: b.finalTotalPrice ?? 0,
    }));

    res.status(200).json(new ApiResponse(200, formatted, "Bookings fetched"));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};

// DELETE booking by ID
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate booking ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch farmer to check status
    const farmer = await Farmer.findById(booking.farmer);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const qty = Number(booking.quantity) || 0;
    let varietyRef = null;

    if (mongoose.Types.ObjectId.isValid(String(booking.variety))) {
      varietyRef = booking.variety;
    }

    // Only adjust Stock and TopCrop if farmer status is "pending"
    if (farmer.status === "pending") {
      // ---------- Restore Stock ----------
      if (!varietyRef) {
        const cv = await CropVariety.findOne({ name: booking.variety });
        if (cv) varietyRef = cv._id;
      }

      if (varietyRef) {
        const stockDoc = await Stock.findOne({ variety: varietyRef });
        if (stockDoc) {
          stockDoc.quantity += qty;
          stockDoc.lastUpdated = new Date();
          await stockDoc.save();
        }
      }

      // ---------- Adjust TopCrop ----------
      const topCropFilter = varietyRef
        ? { varietyRef }
        : { varietyName: booking.variety };
      const topCropDoc = await TopCrop.findOne(topCropFilter);
      if (topCropDoc) {
        topCropDoc.bookedQuantity = Math.max(
          topCropDoc.bookedQuantity - qty,
          0
        );
        topCropDoc.lastBookedAt = new Date();
        await topCropDoc.save();
      }
    }

    // ---------- Delete booking ----------
    await booking.deleteOne();

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Promote booking status
export const promoteBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    // Find booking with farmer
    const booking = await Booking.findById(id).populate("farmer");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const currentStatus = (booking.farmer.status || "").toLowerCase();
    let newStatus;

    if (currentStatus === "pending") {
      newStatus = "sowing";
    } else if (currentStatus === "sowing" || currentStatus === "sown") {
      newStatus = "completed";

      // ✅ If promoting to completed, set pendingPayment to 0
      booking.pendingPayment = 0;
      await booking.save();

      // ✅ Create new Income record
      const income = new Income({
        date: new Date(),
        amount: booking.finalTotalPrice, // or booking.totalPayment if needed
        booking: booking._id,
        farmer: booking.farmer._id,
      });

      await income.save();
    } else {
      return res.status(400).json({ message: "Cannot promote this status" });
    }

    booking.farmer.status = newStatus;
    await booking.farmer.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookingId: booking._id,
          newStatus,
          pendingPayment: booking.pendingPayment ?? null,
        },
        `Booking promoted to ${newStatus}`
      )
    );
  } catch (error) {
    console.error("Error promoting booking:", error);
    res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};
