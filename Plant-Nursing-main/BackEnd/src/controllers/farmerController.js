import Farmer from "../models/Farmer.js";
import Booking from "../models/Booking.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new farmer
export const createFarmer = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      address,
      aadhaarNumber,
      vehicleNumber,
      driverName,
      pincode,
    } = req.body;

    if (!fullName || !phone || !address) {
      return res
        .status(400)
        .json({ message: "Full name, phone, and address are required" });
    }

    const newFarmer = new Farmer({
      fullName,
      phone,
      address,
      aadhaarNumber,
      vehicleNumber,
      driverName,
      pincode,
    });

    const savedFarmer = await newFarmer.save();
    res.status(201).json(savedFarmer);
  } catch (err) {
    console.error("Error saving farmer:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get all farmers (no status filter)
export const getAllFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: farmers,
      message: "All farmers fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching all farmers:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching farmers" });
  }
};
export const getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }
    res.json({ data: farmer }); // ✅ must match frontend's res.data.data
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
// UPDATE farmer
export const updateFarmer = async (req, res) => {
  try {
    const updatedFarmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedFarmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.json({ success: true, message: "Farmer updated", data: updatedFarmer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// DELETE farmer
export const deleteFarmer = async (req, res) => {
  try {
    const deletedFarmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!deletedFarmer) {
      return res.status(404).json({ success: false, message: "Farmer not found" });
    }
    res.json({ success: true, message: "Farmer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Get new farmers
export const getNewFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({ status: "new" }).sort({
      createdAt: -1,
    });
    res.json(farmers);
  } catch (err) {
    console.error("Error fetching farmers:", err);
    res.status(500).json({ message: "Server error while fetching farmers" });
  }
};
// Get pending farmers
export const getPendingFarmers = async (req, res) => {
  try {
    const pendingFarmers = await Farmer.find({ status: "pending" });
    res
      .status(200)
      .json(new ApiResponse(200, pendingFarmers, "Pending farmers fetched"));
  } catch (error) {
    console.error("Error fetching pending farmers:", error);
    res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};
// GET /farmers/sowing
export const getSowingFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({ status: "sowing" });
    res.status(200).json({ success: true, data: farmers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sowing farmers." });
  }
};
// GET /farmers/completed
export const getCompletedFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find({ status: "completed" });
    res.status(200).json({ success: true, data: farmers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch completed farmers." });
  }
};
// PATCH /farmers/:id/status
export const updateFarmerStatus = async (req, res) => {
  try {
    const farmerId = req.params.id;
    const { status } = req.body;

    if (!["new", "pending", "sowing", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    farmer.status = status;
    await farmer.save();

    // ⛳ When status is marked as 'completed', update all related bookings
    if (status === "completed") {
      const result = await Booking.updateMany(
        { farmer: farmerId, pendingPayment: { $gt: 0 } },
        { $set: { pendingPayment: 0 } }
      );

      console.log(`${result.modifiedCount} bookings updated.`);
    }

    res
      .status(200)
      .json({ message: "Status updated successfully", data: farmer });
  } catch (error) {
    console.error("Error updating farmer status:", error);
    res.status(500).json({ message: "Server error" });
  }
};
