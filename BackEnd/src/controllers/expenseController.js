import Expense from "../models/Expense.js";
import Salary from "../models/Salary.js";
import Labor from "../models/Labor.js";
import mongoose from "mongoose";
import DailyExpense from "../models/DailyExpense.js";

export const addExpenses = async (req, res) => {
  try {
    const { type, expenses } = req.body;

    if (!type || !expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const dataToSave = expenses.map((exp) => ({ ...exp, type }));

    await Expense.insertMany(dataToSave);

    res.status(201).json({ message: `${expenses.length} expenses saved.` });
  } catch (error) {
    console.error("Error saving expenses:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /expenses/daily
// Create a simple daily expense entry
export const createDailyExpense = async (req, res) => {
  try {
    const { amount, description, date } = req.body || {};

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const payload = {
      amount: parsedAmount,
      description: description || "",
    };
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) payload.date = d;
    }

    const created = await DailyExpense.create(payload);
    return res.status(201).json({ message: "Daily expense recorded", data: created });
  } catch (err) {
    console.error("createDailyExpense error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * GET /api/expenses?category=nursery|labour&page=1&pageSize=10&search=...
 */
export const getExpenses = async (req, res) => {
  try {
    const category = (req.query.category || "").toLowerCase();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Number(req.query.pageSize) || 10);
    const search = (req.query.search || "").trim();

    // Helper: build regex for search if provided
    const buildRegex = (s) => (s ? new RegExp(s, "i") : null);

    // Query / map for nursery (Expense collection)
    const fetchNursery = async () => {
      const q = {};
      if (search) {
        const re = buildRegex(search);
        q.$or = [
          { shop: re },
          { invoice: re },
          { type: re }, // type field on Expense maps to category for nursery
        ];
      }

      const docs = await Expense.find(q)
        .sort({ date: -1, createdAt: -1 })
        .lean();

      const mapped = docs.map((d) => ({
        id: d._id?.toString() ?? null,
        date: d.date || d.createdAt || null,
        category: d.type || "Expense",
        description:
          `Brought ${d.type} from ${d.shop}` || d.invoice || d.shop || "",
        amount: Number(d.total ?? 0),
        receiptUrl: d.receiptUrl || d.receipt || d.receipt_url || "",
        raw: d,
        source: "expense", // indicates origin
      }));

      return mapped;
    };

    // Query / map for labour (Salary collection)
    const fetchLabour = async () => {
      const salaryQuery = {};

      if (search) {
        const re = buildRegex(search);

        // find labors matching fullName
        const matchingLabors = await Labor.find({ fullName: re })
          .select("_id")
          .lean();

        if (matchingLabors.length > 0) {
          salaryQuery.labor = { $in: matchingLabors.map((l) => l._id) };
        } else {
          // If no labor fullName matches, also try to search by month field
          salaryQuery.$or = [{ month: re }];
        }
      }

      // populate fullName & type
      const docs = await Salary.find(salaryQuery)
        .populate("labor", "fullName type") // ✅ include fullName
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean();

      const mapped = docs.map((d) => {
        const labor = d.labor || {};
        const laborType = (labor.type || "").toLowerCase(); // expected "regular" or "wages"

        return {
          id: d._id?.toString() ?? null,
          date: d.paymentDate || d.createdAt || null,
          category:
            laborType === "regular"
              ? "Salary"
              : laborType === "wages"
              ? "Wages"
              : "Salary",
          description: labor.fullName
            ? `Paid to ${labor.fullName} ${d.month || ""}`.trim()
            : d.month || "Salary/Wages",
          amount: Number(d.totalAmount ?? 0),
          receiptUrl: "",
          raw: d,
          source: "salary",
          laborType: laborType,
        };
      });

      return mapped;
    };

    // If category === 'nursery' or 'labour', return only that slice with pagination applied server-side.
    if (category === "nursery") {
      const allNursery = await fetchNursery();
      const totalCount = allNursery.length;
      const start = (page - 1) * pageSize;
      const pageItems = allNursery.slice(start, start + pageSize);
      return res.json({ items: pageItems, totalCount });
    }

    if (category === "labour") {
      const allLabour = await fetchLabour();
      const totalCount = allLabour.length;
      const start = (page - 1) * pageSize;
      const pageItems = allLabour.slice(start, start + pageSize);
      return res.json({ items: pageItems, totalCount });
    }

    // category not provided -> "All" : merge both sources, sort by date desc, then paginate
    const [nurseryList, labourList] = await Promise.all([
      fetchNursery(),
      fetchLabour(),
    ]);
    // merge
    const merged = [...nurseryList, ...labourList];

    // normalize date for sorting (convert to timestamp) and sort desc by date (fallback to createdAt)
    merged.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });

    const totalCount = merged.length;
    const start = (page - 1) * pageSize;
    const pageItems = merged.slice(start, start + pageSize);

    return res.json({ items: pageItems, totalCount });
  } catch (err) {
    console.error("getExpenses error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch expenses", error: err.message });
  }
};

/**
 * GET /expenses/summary
 * Returns summary (totals & percentages) for current financial year and current month.
 */
export const getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();

    // --- Financial year: April 1 -> March 31 ---
    const currentYear = now.getFullYear();
    // If month >= April (3 index = April), FY starts this year Apr 1; else previous year Apr 1.
    const fyStart =
      now.getMonth() + 1 >= 4
        ? new Date(currentYear, 3, 1, 0, 0, 0, 0)
        : new Date(currentYear - 1, 3, 1, 0, 0, 0, 0);
    const fyEnd =
      now.getMonth() + 1 >= 4
        ? new Date(currentYear + 1, 2, 31, 23, 59, 59, 999)
        : new Date(currentYear, 2, 31, 23, 59, 59, 999);

    // helper to build month string "YYYY-MM"
    const pad = (n) => String(n).padStart(2, "0");
    const fyStartMonthStr = `${fyStart.getFullYear()}-${pad(
      fyStart.getMonth() + 1
    )}`;
    const fyEndMonthStr = `${fyEnd.getFullYear()}-${pad(fyEnd.getMonth() + 1)}`;

    const currentMonthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // --- Aggregate expenses for financial year ---
    const expenseSumFYPromise = Expense.aggregate([
      { $match: { date: { $gte: fyStart, $lte: fyEnd } } },
      { $group: { _id: null, totalExpenses: { $sum: "$total" } } },
    ]);

    // totals per expense type for FY
    const expenseByTypePromise = Expense.aggregate([
      { $match: { date: { $gte: fyStart, $lte: fyEnd } } },
      { $group: { _id: "$type", total: { $sum: "$total" } } },
    ]);

    // this month's expenses
    const expenseThisMonthPromise = Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, thisMonthExpenses: { $sum: "$total" } } },
    ]);

    // --- Aggregate salaries (labour) ---
    // Salary.month uses "YYYY-MM" format, so we can compare strings lexicographically
    const salarySumFYPromise = Salary.aggregate([
      { $match: { month: { $gte: fyStartMonthStr, $lte: fyEndMonthStr } } },
      { $group: { _id: null, totalSalaries: { $sum: "$totalAmount" } } },
    ]);

    const salaryThisMonthPromise = Salary.aggregate([
      { $match: { month: currentMonthStr } },
      { $group: { _id: null, thisMonthSalaries: { $sum: "$totalAmount" } } },
    ]);

    // run parallel
    const [
      expenseSumFYRes,
      expenseByTypeRes,
      expenseThisMonthRes,
      salarySumFYRes,
      salaryThisMonthRes,
    ] = await Promise.all([
      expenseSumFYPromise,
      expenseByTypePromise,
      expenseThisMonthPromise,
      salarySumFYPromise,
      salaryThisMonthPromise,
    ]);

    const totalExpenses =
      (expenseSumFYRes[0] && expenseSumFYRes[0].totalExpenses) || 0;
    const totalSalaries =
      (salarySumFYRes[0] && salarySumFYRes[0].totalSalaries) || 0;
    const thisMonthExpenses =
      (expenseThisMonthRes[0] && expenseThisMonthRes[0].thisMonthExpenses) || 0;
    const thisMonthSalaries =
      (salaryThisMonthRes[0] && salaryThisMonthRes[0].thisMonthSalaries) || 0;

    const total = totalExpenses + totalSalaries;
    const thisMonth = thisMonthExpenses + thisMonthSalaries;

    // build breakdown for known types (falls back to 0 for missing types)
    const expenseTypes = ["Seed", "Cocopeat", "Tray (Monthly)", "Pesticide"];
    const typeTotalsMap = {};
    expenseByTypeRes.forEach((r) => {
      typeTotalsMap[r._id] = r.total || 0;
    });

    const breakdown = {};
    expenseTypes.forEach((t) => {
      const tTotal = typeTotalsMap[t] || 0;
      const pctOfExpenses =
        totalExpenses > 0 ? (tTotal / totalExpenses) * 100 : 0;
      breakdown[t] = {
        total: tTotal,
        percentageOfExpenses: parseFloat(pctOfExpenses.toFixed(2)),
      };
    });

    // salary percentages: relative to expenses and relative to grand total
    const salaryPercentageOfExpenses =
      totalExpenses > 0 ? (totalSalaries / totalExpenses) * 100 : 0;
    const salaryPercentageOfTotal =
      total > 0 ? (totalSalaries / total) * 100 : 0;

    // Response: include both expense totals and salary totals with helpful breakdown
    const responseData = {
      total: parseFloat(total.toFixed(2)),
      thisMonth: parseFloat(thisMonth.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      totalSalaries: parseFloat(totalSalaries.toFixed(2)),
      thisMonthExpenses: parseFloat(thisMonthExpenses.toFixed(2)),
      thisMonthSalaries: parseFloat(thisMonthSalaries.toFixed(2)),
      breakdown,
      labour: {
        total: parseFloat(totalSalaries.toFixed(2)),
        percentageOfExpenses: parseFloat(salaryPercentageOfExpenses.toFixed(2)),
        percentageOfTotal: parseFloat(salaryPercentageOfTotal.toFixed(2)),
      },
      meta: {
        financialYearStart: fyStart.toISOString(),
        financialYearEnd: fyEnd.toISOString(),
        month: currentMonthStr,
      },
    };

    // Log the response (pretty-printed)
    // console.log("Expense Summary Response:", JSON.stringify(responseData, null, 2));

    // Send the response
    return res.json(responseData);
  } catch (err) {
    console.error("getExpenseSummary error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// GET single expense by ID
export const getExpenseById = (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    date: "2025-08-10",
    category: "Seed",
    description: "Bought wheat seeds",
    amount: 1500,
    receiptUrl: "https://example.com/receipt1.pdf",
  });
};

// PUT /expenses/:id
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and update the expense
    const updatedExpense = await Expense.findByIdAndUpdate(id, req.body, {
      new: true, // return the updated document
      runValidators: true, // ensure schema validation
    });

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({
      message: `Expense ${id} updated successfully`,
      expense: updatedExpense,
    });
  } catch (err) {
    console.error("Update expense error:", err);
    res.status(500).json({ message: "Server error while updating expense" });
  }
};

// DELETE /expenses/:id
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if expense exists
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Delete expense
    await Expense.findByIdAndDelete(id);

    res.json({ message: `Expense ${id} deleted successfully` });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Server error while deleting expense" });
  }
};
