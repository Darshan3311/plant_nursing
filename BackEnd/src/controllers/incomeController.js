// src/controllers/incomeController.js
import Booking from "../models/Booking.js";
import Income from "../models/Income.js";
import Salary from "../models/Salary.js";

export const getIncomeSummary = async (req, res) => {
  try {
    const now = new Date();

    // --- Date Ranges ---
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // --- Helper functions ---
    const calcBookingIncome = (bookings) => {
      return bookings.reduce((sum, b) => {
        const received = (b.advancePayment || 0) + (b.totalPayment || 0);
        return sum + received;
      }, 0);
    };

    const calcOtherIncome = async (start, end) => {
      const otherIncome = await Income.aggregate([
        {
          $match: {
            date: { $gte: start, $lte: end },
            type: { $ne: "booking" } // Exclude booking income as it's handled separately
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      return otherIncome[0]?.total || 0;
    };

    // --- Queries ---
    const [dailyBookings, monthlyBookings, yearlyBookings, allBookings] = await Promise.all([
      Booking.find({ bookingDate: { $gte: dayStart, $lte: dayEnd } }).lean(),
      Booking.find({ bookingDate: { $gte: monthStart, $lte: monthEnd } }).lean(),
      Booking.find({ bookingDate: { $gte: yearStart, $lte: yearEnd } }).lean(),
      Booking.find().lean(),
    ]);

    // Calculate other income sources
    const [dailyOther, monthlyOther, yearlyOther] = await Promise.all([
      calcOtherIncome(dayStart, dayEnd),
      calcOtherIncome(monthStart, monthEnd),
      calcOtherIncome(yearStart, yearEnd)
    ]);

    // --- Totals ---
    const daily = calcBookingIncome(dailyBookings) + dailyOther;
    const monthly = calcBookingIncome(monthlyBookings) + monthlyOther;
    const yearly = calcBookingIncome(yearlyBookings) + yearlyOther;
    
    // For total, we need to calculate all-time income
    const allOtherIncome = await Income.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalOther = allOtherIncome[0]?.total || 0;
    const total = calcBookingIncome(allBookings) + totalOther;

    return res.json({
      daily: parseFloat(daily.toFixed(2)),
      monthly: parseFloat(monthly.toFixed(2)),
      yearly: parseFloat(yearly.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    });
  } catch (err) {
    console.error("getIncomeSummary error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};