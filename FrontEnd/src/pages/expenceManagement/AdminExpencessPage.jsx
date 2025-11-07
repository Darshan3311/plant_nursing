// src/pages/AdminExpensesPage.jsx
import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import NurseryExpenses from "./StaffAddExpenses";

export default function AdminExpensesPage() {
  const defaultExpenses = [
    {
      id: 1,
      date: new Date(),
      category: "Seed",
      description: "Default seed expense",
      amount: 500,
      receiptUrl: "",
    },
    {
      id: 2,
      date: new Date(),
      category: "Fertilizer",
      description: "Default fertilizer expense",
      amount: 800,
      receiptUrl: "",
    },
    {
      id: 3,
      date: new Date(),
      category: "Labour",
      description: "Default labour expense",
      amount: 1200,
      receiptUrl: "",
    },
  ];

  const [expenses, setExpenses] = useState(defaultExpenses.map(normalize));
  const [summary, setSummary] = useState({
    total: 0,
    thisMonth: 0,
    seeds: 0,
    seedsPercentage: 0,
    pesticide: 0,
    pesticidePercentage: 0,
    labour: 0,
    labourPercentage: 0,
  });
  const [totalCount, setTotalCount] = useState(defaultExpenses.length);
  const [isDefaultData, setIsDefaultData] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // ====== Shared controls for Expenses table ======
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [activeTab, setActiveTab] = useState("All Expenses");

  const tabs = ["All Expenses", "Nursery", "Labour"];

  // ====== Losses-specific state ======
  const [losses, setLosses] = useState([]);
  const [lossesTotalCount, setLossesTotalCount] = useState(0);
  const [lossesLoading, setLossesLoading] = useState(true);
  const [lossesError, setLossesError] = useState(null);
  const [lossesCurrentPage, setLossesCurrentPage] = useState(1);
  const [lossesRowsPerPage, setLossesRowsPerPage] = useState(10);
  const [lossSearch, setLossSearch] = useState("");

  const [showLossModal, setShowLossModal] = useState(false);
  const [editingLoss, setEditingLoss] = useState(null);

  // ====== NEW income summary state ======
  const [incomeSummary, setIncomeSummary] = useState({
    daily: 0,
    monthly: 0,
    yearly: 0,
    total: 0,
  });

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return d.toString();
      return dt.toLocaleDateString();
    } catch {
      return d.toString();
    }
  };

  const formatCurrency = (a) => {
    if (a == null || a === "") return "—";
    try {
      return a.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });
    } catch {
      return `₹${a}`;
    }
  };

  function normalize(item) {
    return {
      id: item._id || item.id || item.bookingId || null,
      date:
        item.date ||
        item.transactionDate ||
        item.createdAt ||
        item.bookingDate ||
        null,
      category: item.category || item.type || "",
      description: item.description || item.desc || item.invoice || "",
      amount: Number(item.amount ?? item.value ?? item.total ?? 0),
      receiptUrl: item.receiptUrl || item.receipt || item.receipt_url || "",
      raw: item,
    };
  }

  function normalizeLoss(item) {
    return {
      id: item._id || item.id || null,
      date: item.date || item.createdAt || item.lossDate || null,
      group:
        (item.group && (item.group.name || item.group.groupName)) ||
        item.cropGroup ||
        item.groupName ||
        "",
      variety:
        (item.variety && (item.variety.name || item.variety.varietyName)) ||
        item.varietyName ||
        "",
      description: item.description || item.note || item.reason || "",
      amount: Number(item.amount ?? item.lossAmount ?? item.value ?? 0),
      raw: item,
    };
  }

  const calculateSummary = (items) => {
    return items.reduce(
      (acc, e) => {
        acc.total += e.amount || 0;
        const cat = (e.category || "").toLowerCase().trim();
        if (cat.includes("seed")) acc.seeds += e.amount || 0;
        else if (cat.includes("fertil")) acc.pesticide += e.amount || 0;
        else if (cat.includes("labour")) acc.labour += e.amount || 0;
        return acc;
      },
      { total: 0, seeds: 0, pesticide: 0, labour: 0 }
    );
  };

  const mapTabToCategoryParam = (tabLabel) => {
    if (!tabLabel) return undefined;
    const t = tabLabel.toLowerCase();
    if (t === "all expenses") return undefined;
    if (t === "nursery") return "nursery";
    if (t === "labour") return "labour";
    return t;
  };

  // ====== Expenses fetch ======
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);

    const params = {
      page: currentPage,
      pageSize: rowsPerPage,
      search: search || undefined,
    };

    const categoryParam = mapTabToCategoryParam(activeTab);
    if (categoryParam) {
      params.category = categoryParam;
    }

    try {
      const resp = await axios.get(`/expenses`, { params });
      const data = resp?.data ?? {};

      let items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      if (!items.length) {
        const normalizedDefaults = defaultExpenses.map(normalize);
        setExpenses(normalizedDefaults);
        setTotalCount(defaultExpenses.length);
        setSummary(calculateSummary(normalizedDefaults));
        setIsDefaultData(true);
        return;
      }

      const normalized = items.map(normalize);
      setExpenses(normalized);
      setTotalCount(Number(data.totalCount ?? data.total ?? normalized.length));
      setIsDefaultData(false);

      try {
        const summaryResp = await axios.get(`/expenses/summary`, {
          params: categoryParam ? { category: categoryParam } : {},
        });
        const sData = summaryResp?.data ?? {};
        setSummary({
          total: sData.total ?? 0,
          thisMonth: sData.thisMonth ?? 0,
          seeds:
            sData.breakdown?.Seed?.total ?? sData.breakdown?.seed?.total ?? 0,
          seedsPercentage:
            sData.breakdown?.Seed?.percentageOfExpenses ??
            sData.breakdown?.seed?.percentageOfExpenses ??
            0,
          pesticide:
            sData.breakdown?.Pesticide?.total ??
            sData.breakdown?.pesticide?.total ??
            0,
          pesticidePercentage:
            sData.breakdown?.Pesticide?.percentageOfExpenses ??
            sData.breakdown?.pesticide?.percentageOfExpenses ??
            0,
          labour: sData.labour?.total ?? 0,
          labourPercentage: sData.labour?.percentageOfExpenses ?? 0,
        });
      } catch (summaryErr) {
        console.warn("Summary fetch failed, calculating locally", summaryErr);
        setSummary(calculateSummary(normalized));
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load expenses");
      const normalizedDefaults = defaultExpenses.map(normalize);
      setExpenses(normalizedDefaults);
      setTotalCount(defaultExpenses.length);
      setSummary(calculateSummary(normalizedDefaults));
      setIsDefaultData(true);
    } finally {
      setLoading(false);
    }
  };

  // ====== Income fetch ======
  // This part is already correct in your component
const fetchIncome = async () => {
  try {
    const resp = await axios.get("/api/income/summary");
    const data = resp?.data ?? {};
    setIncomeSummary({
      daily: data.daily ?? 0,
      monthly: data.monthly ?? 0,
      yearly: data.yearly ?? 0,
      total: data.total ?? 0,
    });
  } catch (err) {
    console.error("Income fetch failed:", err);
    setIncomeSummary({ daily: 0, monthly: 0, yearly: 0, total: 0 });
  }
};

  // ====== Losses fetch ======
  const fetchLosses = async () => {
    setLossesLoading(true);
    setLossesError(null);
    const params = {
      page: lossesCurrentPage,
      pageSize: lossesRowsPerPage,
      search: lossSearch || undefined,
    };
    try {
      const resp = await axios.get(`/expenses/getallloss`, { params });
      const data = resp?.data ?? {};
      let items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      if (!items.length) {
        setLosses([]);
        setLossesTotalCount(0);
        return;
      }
      const normalized = items.map(normalizeLoss);
      setLosses(normalized);
      setLossesTotalCount(
        Number(data.totalCount ?? data.total ?? normalized.length)
      );
    } catch (err) {
      console.error(err);
      setLossesError(err?.message || "Failed to load losses");
      setLosses([]);
      setLossesTotalCount(0);
    } finally {
      setLossesLoading(false);
    }
  };

  // ====== Effects ======
  useEffect(() => {
    fetchExpenses();
    fetchIncome(); // <-- fetch income summary
  }, [activeTab, currentPage, rowsPerPage, search]);

  useEffect(() => {
    fetchLosses();
  }, [lossesCurrentPage, lossesRowsPerPage, lossSearch]);

  // ... rest of your existing AdminExpensesPage component unchanged ...

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Expense Tracker</h1>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Add Expense
          </button>
        </div>

        {/* NEW Income Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Today's Income"
            value={formatCurrency(incomeSummary.daily)}
            colorClass="border-green-500"
          />
          <SummaryCard
            title="This Month's Income"
            value={formatCurrency(incomeSummary.monthly)}
            colorClass="border-blue-500"
          />
          <SummaryCard
            title="This Year's Income"
            value={formatCurrency(incomeSummary.yearly)}
            colorClass="border-purple-500"
          />
          <SummaryCard
            title="Total Income"
            value={formatCurrency(incomeSummary.total)}
            colorClass="border-indigo-500"
          />
        </div>

        {/* Existing Expense Summary Row (unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(summary.total)}
            colorClass="border-red-400"
            sub={`This month: ${summary.thisMonth || 0}`}
          />
          <SummaryCard
            title="Seeds"
            value={formatCurrency(summary.seeds)}
            colorClass="border-green-400"
            sub={`${summary.seedsPercentage || 0}% of total`}
          />
          <SummaryCard
            title="Pesticide"
            value={formatCurrency(summary.pesticide)}
            colorClass="border-blue-400"
            sub={`${summary.pesticidePercentage || 0}% of total`}
          />
          <SummaryCard
            title="Labour"
            value={formatCurrency(summary.labour)}
            colorClass="border-yellow-400"
            sub={`${summary.labourPercentage || 0}% of total`}
          />
        </div>

        {/* ... your existing JSX for tables, tabs, losses, modals remains unchanged ... */}
      </div>
    </div>
  );
}

// --- rest of your helper components (SummaryCard, CategoryBadge, LossEditModal) stay same ---
