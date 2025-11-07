// controllers/attendance.controller.js
import Attendance from "../models/Attendance.js";
import Labor from "../models/Labor.js";
import Salary from "../models/Salary.js";

// ✅ Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { laborId, date } = req.body;
    if (!laborId || !date) return res.status(400).json({ message: "laborId and date are required." });

    const d = new Date(date);
    if (isNaN(d)) return res.status(400).json({ message: "Invalid date format." });

    const attendance = await Attendance.findOneAndUpdate(
      { laborId, date: d },
      { laborId, date: d },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Attendance marked", data: attendance });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Available Labors for a Specific Date who are not marked present
export const getAvailableLabors = async (req, res) => {
  try {
    const { type, date } = req.query;

    if (!type || !date) {
      return res.status(400).json({ message: "type and date are required." });
    }

    const allLabors = await Labor.find({ type, status: "active" });

    const alreadyMarked = await Attendance.find({ date });
    const markedIds = alreadyMarked.map((entry) => entry.laborId.toString());

    const available = allLabors.filter(
      (labor) => !markedIds.includes(labor._id.toString())
    );

    res.status(200).json({ data: available });
  } catch (err) {
    console.error("Error fetching available labors:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /attendance?month=YYYY-MM&type=all|wages|regular
export const getAttendanceByMonth = async (req, res) => {
  try {
    let { month, year, type } = req.query;

    // Support month=YYYY-MM or month + year separately
    if (month && !year && typeof month === "string" && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-");
      year = y;
      month = m;
    }
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    month = parseInt(month, 10);
    year = parseInt(year, 10);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    // Normalize type parameter if provided (accept both 'salaried' and 'regular')
    if (type) {
      type = String(type).toLowerCase();
      if (type === "salaried") type = "regular"; // map older name if any
    }

    // Filter labors by type
    const laborFilter = {};
    if (type && type !== "all") {
      laborFilter.type = type; // expects 'wages' or 'regular'
    }
    const labors = await Labor.find(laborFilter);

    const result = await Promise.all(
      labors.map(async (labor) => {
        const presentCount = await Attendance.countDocuments({
          laborId: labor._id,
          date: { $gte: startDate, $lte: endDate },
        });

        const absentCount = totalDaysInMonth - presentCount;
        const paymentDue =
          labor.type === "wages"
            ? presentCount * (labor.dailyWages || 0)
            : labor.salary || 0;

        // Check if salary is already paid
        const salaryRecord = await Salary.findOne({ labor: labor._id, month: monthKey });
        // Use consistent status value 'paid' or 'pending'
        const status = salaryRecord ? "paid" : "pending";

        return {
          laborId: labor._id,
          name: labor.fullName,
          present: presentCount,
          absent: absentCount,
          totalDays: totalDaysInMonth,
          paymentDue,
          status,
        };
      })
    );

    return res.json({ data: result });
  } catch (err) {
    console.error("getAttendanceByMonth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /attendance/pay-salary
export const paySalary = async (req, res) => {
  try {
    const { laborId, month } = req.body;
    if (!laborId || !month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "laborId and month (YYYY-MM) are required" });
    }

    const labor = await Labor.findById(laborId);
    if (!labor) return res.status(404).json({ error: "Labor not found" });

    const [year, m] = month.split("-");
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);

    const presentCount = await Attendance.countDocuments({
      laborId: labor._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const paymentDue =
      labor.type === "wages"
        ? presentCount * (labor.dailyWages || 0)
        : labor.salary || 0;

    const salary = new Salary({
      labor: labor._id,
      month,
      totalPresentDays: presentCount,
      totalAmount: paymentDue,
      status: "paid", // <-- consistent status
      paymentDate: new Date(),
    });

    await salary.save();

    return res.json({ message: "Salary paid successfully", salary });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Salary already paid for this month" });
    }
    console.error("paySalary error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
