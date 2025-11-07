// controllers/incomeController.js
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import Salary from "../models/Salary.js";
import Nutrient from "../models/Nutrient.js";
import Loss from "../models/Loss.js"; 


export const getIncomeData = async (req, res) => {
  try {
    // Helper to get start and end of a period
    const getDateRange = (type) => {
      const now = new Date();
      let start, end;

      if (type === "day") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
        end.setDate(end.getDate() + 1);
      } else if (type === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else if (type === "year") {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
      }

      return { start, end };
    };

    // Helper to sum values from a collection for a period
    const sumAmounts = async (Model, field, dateField, start, end, extraFilter = {}) => {
      const result = await Model.aggregate([
        {
          $match: {
            [dateField]: { $gte: start, $lt: end },
            ...extraFilter
          }
        },
        { $group: { _id: null, total: { $sum: `$${field}` } } }
      ]);
      return result[0]?.total || 0;
    };

    // Function to calculate net income for a period
    const calcNetIncome = async (type) => {
      const { start, end } = getDateRange(type);

      const totalIncome = await sumAmounts(Income, "amount", "date", start, end);
      const totalExpenses = await sumAmounts(Expense, "total", "date", start, end, { status: "Done" });
      const totalSalaries = await sumAmounts(Salary, "totalAmount", "paymentDate", start, end, { status: "paid" });

      let net = totalIncome - totalExpenses - totalSalaries;

      // ✅ Subtract losses only for month & year
      if (type === "month" || type === "year") {
        const totalLosses = await sumAmounts(Loss, "value", "date", start, end, { status: "Done" });
        net -= totalLosses;
      }

      return net;
    };

    const daily = await calcNetIncome("day");
    const monthly = await calcNetIncome("month");
    const yearly = await calcNetIncome("year");

    res.json({
      success: true,
      data: { daily, monthly, yearly }
    });
  } catch (error) {
    console.error("Error fetching income data:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const getBookingStats = async (req, res) => {
  try {
    const now = new Date();

    // Today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // This year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    // Get counts
    const daily = await Booking.countDocuments({
      bookingDate: { $gte: startOfDay, $lt: endOfDay },
    });

    const monthly = await Booking.countDocuments({
      bookingDate: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const yearly = await Booking.countDocuments({
      bookingDate: { $gte: startOfYear, $lt: endOfYear },
    });

    // Monthly trend for current year
    const monthlyTrendRaw = await Booking.aggregate([
      {
        $match: {
          bookingDate: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$bookingDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // Convert month numbers to short names & fill missing months with 0
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly_trend = monthNames.map((name, idx) => {
      const found = monthlyTrendRaw.find(m => m._id.month === idx + 1);
      return { month: name, count: found ? found.count : 0 };
    });

    res.json({
      daily,
      monthly,
      yearly,
      monthly_trend
    });
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    res.status(500).json({ message: "Server error fetching booking stats" });
  }
};

export const getNutrientStock = async (req, res) => {
  try {
    const nutrients = await Nutrient.find();

    const formatted = nutrients.map((nutrient) => {
      const available = nutrient.currentStock;
      const lowerLimit = nutrient.threshold; // as per your note: used = lower limit
      const status = available < nutrient.threshold ? "low" : "ok";

      return {
        id: nutrient._id || null,
        name: nutrient.name,
        available,
        lowerLimit,
        status,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching nutrient stock:", error);
    res.status(500).json({ message: "Failed to fetch nutrient stock" });
  }
};

