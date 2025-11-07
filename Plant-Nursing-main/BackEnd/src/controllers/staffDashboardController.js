import Farmer from "../models/Farmer.js";
import Booking from "../models/Booking.js";
import Stock from "../models/Stock.js";
import TopCrop from "../models/TopCrop.js";
import mongoose from "mongoose";

// src/controllers/dashboardController.js
export const getLowStockDetails = async (req, res) => {
  try {
    const lowStocks = await Stock.find({
      $expr: { $lt: ["$quantity", "$lowerLimit"] },
    }).populate("variety", "name"); // show variety name

    res.json(lowStocks);
  } catch (err) {
    console.error("Error in getLowStockDetails:", err);
    res.status(500).json({ error: "Failed to load low stock details" });
  }
};
export const getOverviewMetrics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const today = new Date();

    // 1. Total Bookings
    const totalBookings = await Booking.countDocuments();

    // 2. Bookings This Month
    const bookingsThisMonth = await Booking.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    // 3. Active Farmers (status = sowing)
    const activeFarmers = await Farmer.countDocuments({
      status: "sowing",
    });

    // 4. New Farmers (status = sowing, created this month)
    const newFarmers = await Farmer.countDocuments({
      status: "sowing",
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    // 5. Pending Tasks (example with farmer status & sowingDate)
    const pendingTasksResult = await Booking.aggregate([
      {
        $lookup: {
          from: "farmers",
          localField: "farmer",
          foreignField: "_id",
          as: "farmerData",
        },
      },
      { $unwind: "$farmerData" },
      {
        $match: {
          "farmerData.status": "pending",
          sowingDate: { $lt: today },
        },
      },
      {
        $group: { _id: "$farmer" },
      },
    ]);
    const pendingTasks = pendingTasksResult.length;

    // 6. Urgent Tasks (placeholder until model defined)
    const urgentTasks = 500;

    // 7. Low Stock Items → count stocks where quantity < lowerLimit
    const lowStock = await Stock.countDocuments({
      $expr: { $lt: ["$quantity", "$lowerLimit"] },
    });

    res.json({
      totalBookings,
      bookingsThisMonth,
      activeFarmers,
      newFarmers,
      pendingTasks,
      urgentTasks,
      lowStock,
    });
  } catch (error) {
    console.error("Error in getOverviewMetrics:", error);
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
};
export const getUpcomingSchedules = async (req, res) => {
  try {
    const today = new Date();
    const next4Days = new Date();
    next4Days.setDate(today.getDate() + 4);

    const upcomingBookings = await Booking.aggregate([
      {
        $match: {
          sowingDate: { $gte: today, $lte: next4Days },
        },
      },
      {
        $lookup: {
          from: "farmers",
          localField: "farmer",
          foreignField: "_id",
          as: "farmerData",
        },
      },
      { $unwind: "$farmerData" },
      {
        $lookup: {
          from: "cropgroups",
          localField: "cropGroup",
          foreignField: "_id",
          as: "cropGroupData",
        },
      },
      { $unwind: "$cropGroupData" },
      {
        $project: {
          title: {
            $concat: [
              "Dispatch ",
              { $ifNull: ["$cropGroupData.name", "Unknown Crop"] },
              " Seedlings",
            ],
          },
          farmer: "$farmerData.fullName",
          quantity: 1,
          dueDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$sowingDate" },
          },
          urgent: {
            $lte: [
              {
                $subtract: [{ $toLong: "$sowingDate" }, { $toLong: today }],
              },
              2 * 24 * 60 * 60 * 1000, // within 2 days
            ],
          },
          sowingDate: 1, // keep raw date for sorting
        },
      },
      { $sort: { sowingDate: 1 } }, // earliest first
      { $limit: 2 }, // only top 2
    ]);

    res.json(upcomingBookings);
  } catch (err) {
    console.error("Error fetching upcoming schedules:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getRecentPayments = async (req, res) => {
  try {
    // Calculate date 4 days ago
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    //  Find farmers whose status is 'completed' and were updated in last 4 days
    const completedFarmers = await Farmer.find({
      status: "completed",
      updatedAt: { $gte: fourDaysAgo },
    }).select("_id fullName");

    const farmerIds = completedFarmers.map((farmer) => farmer._id);
    const farmerMap = Object.fromEntries(
      completedFarmers.map((f) => [f._id.toString(), f.fullName])
    );

    //  Find latest 3 bookings for these farmers
    const bookings = await Booking.find({
      farmer: { $in: farmerIds },
    })
      .sort({ createdAt: -1 }) // newest first
      .limit(3);

    //  Format response
    const result = bookings.map((booking) => ({
      date: booking.createdAt?.toISOString().split("T")[0] || "N/A",
      farmer: farmerMap[booking.farmer.toString()],
      amount: booking.totalPayment,
      status: "Paid",
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ Error in getRecentPayments:", error);
    res.status(500).json({ error: "Failed to fetch recent payments" });
  }
};
export const getMonthlyBookings = async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // Jan 1
    const endOfYear = new Date(now.getFullYear(), 11, 31); // Dec 31

    const monthlyBookings = await Booking.aggregate([
      {
        // Only consider bookings from this year
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        // Group by month number
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        // Clean result structure
        $project: {
          month: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        // Sort by month number (1–12)
        $sort: { month: 1 },
      },
    ]);

    // 🗓️ Optional: Convert numeric months to names (Jan, Feb...)
    const monthNames = [
      "",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedResult = monthlyBookings.map((entry) => ({
      month: monthNames[entry.month],
      count: entry.count,
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error("Error in getMonthlyBookings:", error);
    res.status(500).json({ error: "Failed to fetch monthly bookings" });
  }
};
// GET top 5 crops by bookedQuantity
export const getTopCrops = async (req, res) => {
  try {
    // find all, sort by bookedQuantity desc, limit 5
    const topCrops = await TopCrop.find({})
      .sort({ bookedQuantity: -1 })
      .limit(5)
      .select("varietyName bookedQuantity"); // only return necessary fields

    // Format response for frontend (name, value)
    const formatted = topCrops.map(crop => ({
      name: crop.varietyName,
      value: crop.bookedQuantity,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching top crops:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
export const getAllUpcomingSchedules = async (req, res) => {
  try {
    const today = new Date();
    const next4Days = new Date();
    next4Days.setDate(today.getDate() + 4);

    const upcomingBookings = await Booking.aggregate([
      {
        $match: {
          sowingDate: { $gte: today, $lte: next4Days },
        },
      },
      {
        $lookup: {
          from: "farmers",
          localField: "farmer",
          foreignField: "_id",
          as: "farmerData",
        },
      },
      { $unwind: "$farmerData" },
      {
        $lookup: {
          from: "cropgroups",
          localField: "cropGroup",
          foreignField: "_id",
          as: "cropGroupData",
        },
      },
      { $unwind: "$cropGroupData" },
      {
        $project: {
          title: {
            $concat: [
              "Dispatch ",
              { $ifNull: ["$cropGroupData.name", "Unknown Crop"] },
              " Seedlings",
            ],
          },
          farmer: "$farmerData.fullName",
          quantity: 1,
          dueDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$sowingDate" },
          },
          urgent: {
            $lte: [
              {
                $subtract: [{ $toLong: "$sowingDate" }, { $toLong: today }],
              },
              2 * 24 * 60 * 60 * 1000,
            ],
          },
        },
      },
    ]);

    res.json(upcomingBookings);
  } catch (err) {
    console.error("Error fetching upcoming schedules:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getAllRecentPayments = async (req, res) => {
  try {
    // Calculate date 4 days ago
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    console.log("📅 Four days ago:", fourDaysAgo.toISOString());

    //  Find farmers whose status is 'completed' and were updated in last 4 days
    const completedFarmers = await Farmer.find({
      status: "completed",
      updatedAt: { $gte: fourDaysAgo },
    }).select("_id fullName");
    console.log(
      "👨‍🌾 Recently Updated Completed Farmers Count:",
      completedFarmers.length
    );
    console.log("👨‍🌾 Farmers List:", completedFarmers);

    // Extract farmer IDs and names
    const farmerIds = completedFarmers.map((farmer) => farmer._id);
    const farmerMap = Object.fromEntries(
      completedFarmers.map((f) => [f._id.toString(), f.fullName])
    );
    console.log("🆔 Farmer IDs:", farmerIds);
    console.log("📘 Farmer Map:", farmerMap);

    //  Find all bookings for these farmers (regardless of booking date)
    const bookings = await Booking.find({
      farmer: { $in: farmerIds },
    });
    console.log("📦 Bookings Found:", bookings.length);
    console.log("📦 Booking Details:", bookings);

    //  Format response
    const result = bookings.map((booking) => ({
      date: booking.createdAt?.toISOString().split("T")[0] || "N/A",
      farmer: farmerMap[booking.farmer.toString()],
      amount: booking.totalPayment,
      status: "Paid",
    }));

    console.log("💸 Final Recent Payments Result:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in getRecentPayments:", error);
    res.status(500).json({ error: "Failed to fetch recent payments" });
  }
};

