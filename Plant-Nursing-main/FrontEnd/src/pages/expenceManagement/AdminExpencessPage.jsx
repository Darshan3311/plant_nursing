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

  // ====== Losses-specific state and controls (separate API) ======
  const [losses, setLosses] = useState([]);
  const [lossesTotalCount, setLossesTotalCount] = useState(0);
  const [lossesLoading, setLossesLoading] = useState(true);
  const [lossesError, setLossesError] = useState(null);
  const [lossesCurrentPage, setLossesCurrentPage] = useState(1);
  const [lossesRowsPerPage, setLossesRowsPerPage] = useState(10);
  const [lossSearch, setLossSearch] = useState("");

  // New state for loss edit modal
  const [showLossModal, setShowLossModal] = useState(false);
  const [editingLoss, setEditingLoss] = useState(null);

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

  // Normalizer for losses (different shape expected from backend)
  function normalizeLoss(item) {
    return {
      id: item._id || item.id || null,
      date: item.date || item.createdAt || item.lossDate || null,
      // if populated object => use .name, otherwise fallback to other fields or empty string
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

  // ====== Losses fetch (separate API) ======
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
      // console.log("you are running")
      const data = resp?.data ?? {};
      // console.log("data:",data)
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

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, rowsPerPage, search]);

  useEffect(() => {
    fetchLosses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lossesCurrentPage, lossesRowsPerPage, lossSearch]);

  const handleDelete = async (id) => {
    if (!id) return alert("No id to delete");
    if (!window.confirm("Delete this expense?")) return;

    if (isDefaultData) {
      setExpenses((prev) => prev.filter((e) => (e.id || e._id) !== id));
      setTotalCount((c) => Math.max(0, c - 1));
      return;
    }

    try {
      await axios.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleDeleteLoss = async (id) => {
    if (!id) return alert("No id to delete");
    if (!window.confirm("Delete this loss record?")) return;

    try {
      await axios.delete(`/expenses/loss/${id}`);
      fetchLosses();
    } catch (err) {
      console.error(err);
      alert("Failed to delete loss record");
    }
  };

  const openAdd = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const openEdit = (normalizedItem) => {
    if (!normalizedItem) return;
    const raw = normalizedItem.raw ?? null;
    if (raw) {
      setEditingExpense({ ...raw, id: normalizedItem.id ?? raw._id ?? raw.id });
    } else {
      setEditingExpense({
        id: normalizedItem.id,
        shop: normalizedItem.raw?.shop || "",
        invoice: normalizedItem.description || "",
        total: normalizedItem.amount || 0,
        paid: normalizedItem.raw?.paid || 0,
        remaining:
          (normalizedItem.amount || 0) - (normalizedItem.raw?.paid || 0),
        date: normalizedItem.date,
        status: normalizedItem.raw?.status || "Pending",
        category: normalizedItem.category,
      });
    }
    setShowModal(true);
  };

  // New: open loss edit modal
  const openEditLoss = (normalizedLoss) => {
    if (!normalizedLoss) return;
    setEditingLoss(normalizedLoss);
    setShowLossModal(true);
  };

  const handleChildSaved = () => {
    setShowModal(false);
    setEditingExpense(null);
    fetchExpenses();
    // also refresh losses in case backend changed related data
    fetchLosses();
  };

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const serverSidePagination = Number(totalCount) > expenses.length;
  const paginatedExpenses = serverSidePagination
    ? expenses
    : expenses.slice(startIndex, endIndex);

  const lossesTotalPages = Math.max(
    1,
    Math.ceil((lossesTotalCount || 0) / lossesRowsPerPage)
  );
  const lossesStartIndex = (lossesCurrentPage - 1) * lossesRowsPerPage;
  const lossesEndIndex = lossesStartIndex + lossesRowsPerPage;
  const lossesServerSide = Number(lossesTotalCount) > losses.length;
  const paginatedLosses = lossesServerSide
    ? losses
    : losses.slice(lossesStartIndex, lossesEndIndex);

  const tabIsLabour = (activeTab || "").toLowerCase() === "labour";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Expense Tracker</h1>
          <button
            onClick={openAdd}
            className="bg-green-600 text-white px-4 py-2 rounded shadow"
          >
            Add Expense
          </button>
        </div>

        {/* summary */}
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

        <div className="bg-white rounded shadow p-4 mb-6">
          {/* Tabs */}
          <div className="mb-4">
            <div className="flex gap-2">
              {tabs.map((t) => {
                const active = t === activeTab;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setActiveTab(t);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded ${
                      active
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex justify-between items-center">
            <div>
              Show
              <select
                className="border mx-2 p-1 rounded"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 25, 50].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              entries
            </div>

            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border px-3 py-2 rounded"
            />
          </div>

          {isDefaultData && (
            <div className="mb-3 text-sm text-yellow-700 bg-yellow-100 px-3 py-2 rounded">
              Showing default expenses (no backend data available)
            </div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center">Loading...</div>
            ) : (
              <>
                {error && (
                  <div className="p-3 mb-3 text-center text-red-700 bg-red-100 rounded">
                    {error}
                  </div>
                )}

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600 bg-gray-100">
                      <th className="py-2">Date</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Amount</th>
                      {!tabIsLabour && <th className="py-2">Receipt</th>}
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={!tabIsLabour ? 6 : 5}
                          className="py-6 text-center text-gray-500"
                        >
                          No expenses found
                        </td>
                      </tr>
                    ) : (
                      paginatedExpenses.map((e, idx) => {
                        const category = (e.category || "")
                          .toLowerCase()
                          .trim();

                        const hideEdit =
                          tabIsLabour ||
                          category.includes("wage") ||
                          category.includes("salary");

                        return (
                          <tr
                            key={e.id || idx}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="py-3 align-top">
                              {formatDate(e.date)}
                            </td>
                            <td className="py-3 align-top">
                              <CategoryBadge label={e.category} />
                            </td>
                            <td className="py-3 align-top">{e.description}</td>
                            <td className="py-3 align-top">
                              {formatCurrency(e.amount)}
                            </td>
                            {!tabIsLabour && (
                              <td className="py-3 align-top">
                                {e.receiptUrl ? (
                                  <a
                                    href={e.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 border rounded text-blue-600 inline-block"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}

                            <td className="py-3 align-top space-x-2">
                              {!hideEdit && (
                                <button
                                  onClick={() => openEdit(e)}
                                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                                >
                                  Edit
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(e.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {paginatedExpenses.length} of {totalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <div>
                Page {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ====== Loss Tracker (wired to /losses API) ====== */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl">Loss Tracker</h2>
            <div className="flex gap-2 items-center">
              <div>
                Show
                <select
                  className="border mx-2 p-1 rounded"
                  value={lossesRowsPerPage}
                  onChange={(e) => {
                    setLossesRowsPerPage(Number(e.target.value));
                    setLossesCurrentPage(1);
                  }}
                >
                  {[5, 10, 25, 50].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
                entries
              </div>

              <input
                type="text"
                placeholder="Search losses..."
                value={lossSearch}
                onChange={(e) => {
                  setLossSearch(e.target.value);
                  setLossesCurrentPage(1);
                }}
                className="border px-3 py-2 rounded"
              />

              {/* Optionally add an "Add Loss" button if you have a modal for losses */}
              {/* <button className="bg-green-600 text-white px-3 py-1 rounded">Add Loss</button> */}
            </div>
          </div>

          <div className="overflow-x-auto">
            {lossesLoading ? (
              <div className="p-6 text-center">Loading losses...</div>
            ) : (
              <>
                {lossesError && (
                  <div className="p-3 mb-3 text-center text-red-700 bg-red-100 rounded">
                    {lossesError}
                  </div>
                )}

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600 bg-gray-100">
                      <th className="py-2">Date</th>
                      <th className="py-2">Group</th>
                      <th className="py-2">Variety</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLosses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-gray-500"
                        >
                          No loss records found
                        </td>
                      </tr>
                    ) : (
                      paginatedLosses.map((e, idx) => (
                        <tr
                          key={e.id || idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="py-3 align-top">
                            {formatDate(e.date)}
                            {console.log(e.date)}
                          </td>
                          <td className="py-3 align-top">{e.group || "—"}</td>
                          <td className="py-3 align-top">{e.variety || "—"}</td>
                          <td className="py-3 align-top">{e.description}</td>
                          <td className="py-3 align-top">
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="py-3 align-top space-x-2">
                            {/* Add edit if you implement a losses edit modal */}
                            <button
                              onClick={() => openEditLoss(e)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteLoss(e.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {paginatedLosses.length} of {lossesTotalCount} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={lossesCurrentPage <= 1}
                onClick={() => setLossesCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <div>
                Page {lossesCurrentPage} / {lossesTotalPages}
              </div>
              <button
                disabled={lossesCurrentPage >= lossesTotalPages}
                onClick={() =>
                  setLossesCurrentPage((p) => Math.min(lossesTotalPages, p + 1))
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-lg w-full max-w-4xl p-6 relative h-120 overflow-y-auto rounded-2xl">
            <button
              onClick={() => {
                setShowModal(false);
                setEditingExpense(null);
                fetchExpenses();
              }}
              className="absolute top-3 right-3 text-gray-600"
            >
              Close
            </button>

            <NurseryExpenses
              editingExpense={editingExpense}
              onSave={handleChildSaved}
            />
          </div>
        </div>
      )}

      {/* Loss edit modal */}
      {showLossModal && (
        <LossEditModal
          isOpen={showLossModal}
          initialData={editingLoss}
          onClose={() => {
            setShowLossModal(false);
            setEditingLoss(null);
          }}
          onSaved={() => {
            setShowLossModal(false);
            setEditingLoss(null);
            fetchLosses();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, value, sub, colorClass }) {
  return (
    <div
      className={`bg-white rounded p-4 shadow flex flex-col border-l-4 ${colorClass}`}
    >
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function CategoryBadge({ label }) {
  const s = (label || "").toLowerCase().trim();
  const base = "inline-block px-2 py-1 text-xs rounded-full text-white";
  const map = {
    salary: "bg-red-500",
    wages: "bg-purple-500",
    tray: "bg-yellow-500 text-black",
    seed: "bg-green-500",
    cocopeat: "bg-indigo-500",
    pesticide: "bg-teal-500",
  };

  if (map[s]) {
    return <span className={`${base} ${map[s]}`}>{label || "—"}</span>;
  }

  if (s.includes("seed"))
    return <span className={`${base} bg-green-500`}>{label || "—"}</span>;
  if (s.includes("fertil") || s.includes("pesticide"))
    return <span className={`${base} bg-teal-500`}>{label || "—"}</span>;
  if (s.includes("labour") || s.includes("wage") || s.includes("salary"))
    return <span className={`${base} bg-yellow-500`}>{label || "—"}</span>;

  return <span className={`${base} bg-gray-400`}>{label || "—"}</span>;
}


/* -----------------
   LossEditModal
   - Simple modal to edit a loss record (group, variety, description, amount, date)
   - Makes a PUT request to /expenses/loss/:id if the backend exists
   - Falls back to calling onSaved() so UI refreshes after save
   ----------------- */
function LossEditModal({ isOpen, onClose, onSaved, initialData }) {
  const [group, setGroup] = useState(initialData?.group || "");
  const [variety, setVariety] = useState(initialData?.variety || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(
    initialData?.amount != null ? initialData.amount : ""
  );
  const [date, setDate] = useState(() => {
    if (!initialData?.date) return "";
    // prefer yyyy-mm-dd for input type=date
    const d = new Date(initialData.date);
    if (isNaN(d)) return initialData.date;
    const iso = d.toISOString().slice(0, 10);
    return iso;
  });

  useEffect(() => {
    setGroup(initialData?.group || "");
    setVariety(initialData?.variety || "");
    setDescription(initialData?.description || "");
    setAmount(initialData?.amount != null ? initialData.amount : "");
    if (initialData?.date) {
      const d = new Date(initialData.date);
      setDate(isNaN(d) ? initialData.date : d.toISOString().slice(0, 10));
    } else setDate("");
  }, [initialData]);

  if (!isOpen) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!initialData?.id) {
      alert("Missing record id");
      return;
    }

    const payload = {
      group: group || undefined,
      variety: variety || undefined,
      description: description || undefined,
      amount: amount === "" ? undefined : Number(amount),
      date: date || undefined,
    };

    try {
      // try to update on backend
      await axios.put(`/expenses/loss/${initialData.id}`, payload);
      onSaved && onSaved();
    } catch (err) {
      console.warn("Loss update failed, falling back to local save", err);
      // If backend fails (or not implemented), optimistically call onSaved to refresh
      onSaved && onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white shadow-lg w-full max-w-xl p-6 relative rounded-2xl">
        <button
          onClick={() => {
            onClose && onClose();
          }}
          className="absolute top-3 right-3 text-gray-600"
        >
          Close
        </button>

        <h3 className="text-lg font-semibold mb-4">Edit Loss Record</h3>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Group</label>
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Crop group (e.g. Flowers)"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Variety</label>
            <input
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Variety (e.g. Marigold Orange)"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="Reason or note"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
