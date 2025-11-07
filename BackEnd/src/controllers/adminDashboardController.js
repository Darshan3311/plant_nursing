// controllers/adminDashboardController.js
import Booking from "../models/Booking.js";
import DailyBooking from "../models/DailyBooking.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import Salary from "../models/Salary.js";
import Nutrient from "../models/Nutrient.js";
import Loss from "../models/Loss.js";
import DailyExpense from "../models/DailyExpense.js";

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

    // Calculate gross income (bookings + other income)
    const calcGrossIncome = async (start, end) => {
      // Booking income (existing detailed bookings)
      const bookingIncome = await Booking.aggregate([
        {
          $match: {
            bookingDate: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $add: ["$advancePayment", "$totalPayment"] } }
          }
        }
      ]);

      // DailyBooking income (new simple daily bookings)
      const dailyBookingIncome = await DailyBooking.aggregate([
        {
          $match: {
            date: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ]);

      // Other income
      const otherIncome = await Income.aggregate([
        {
          $match: {
            date: { $gte: start, $lt: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);

      return (bookingIncome[0]?.total || 0)
        + (dailyBookingIncome[0]?.total || 0)
        + (otherIncome[0]?.total || 0);
    };

    // Calculate expenses
    const calcExpenses = async (start, end) => {
      const expenses = await Expense.aggregate([
        {
          $match: {
            date: { $gte: start, $lt: end },
            status: "Done"
          }
        },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);

      const salaries = await Salary.aggregate([
        {
          $match: {
            paymentDate: { $gte: start, $lt: end },
            status: "paid"
          }
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);

      // Daily expenses (simple amount/date)
      const dailyExpenses = await DailyExpense.aggregate([
        {
          $match: {
            date: { $gte: start, $lt: end },
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      return (expenses[0]?.total || 0) + (salaries[0]?.total || 0) + (dailyExpenses[0]?.total || 0);
    };

    // Calculate losses
    const calcLosses = async (start, end) => {
      const losses = await Loss.aggregate([
        {
          $match: {
            date: { $gte: start, $lt: end },
            status: "Done"
          }
        },
        { $group: { _id: null, total: { $sum: "$value" } } }
      ]);

      return losses[0]?.total || 0;
    };

    // Calculate net income for each period
    const calcNetIncome = async (type) => {
      const { start, end } = getDateRange(type);

      const grossIncome = await calcGrossIncome(start, end);
      const expenses = await calcExpenses(start, end);
      
      let net = grossIncome - expenses;

      // Subtract losses only for month & year
      if (type === "month" || type === "year") {
        const losses = await calcLosses(start, end);
        net -= losses;
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