/*
File: src/pages/LaborPage.jsx
Description: Labor management page with tabbed filtering, search, pagination, attendance summary, and consistent theme.
- Updated to work with the new backend routes:
  - GET /attendance/attendance?month=YYYY-MM&type=all|wages|regular
  - POST /attendance/pay-salary  { laborId, month }
- Optimistic UI when paying: sets status to "completed" locally then refetches attendance to ensure canonical state.
- Normalizes status values from backend (handles pending/paid/completed, different casings).
*/

import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import LaborModal from "./LaborModel";
import LaborForm from "./LaborForm";
import AttendanceSection from "./AttendanceSection";

const defaultData = [
  {
    _id: "L001",
    fullName: "John Doe",
    type: "regular",
    contactNumber: "9876543210",
    address: "Pune",
    salary: 20000,
    status: "active",
    joiningDate: "2024-07-01",
  },
  {
    _id: "L002",
    fullName: "Jane Smith",
    type: "wages",
    contactNumber: "9123456789",
    address: "Mumbai",
    dailyWages: 500,
    status: "inactive",
    joiningDate: "2024-06-15",
  },
];

const defaultForm = {
  fullName: "",
  contactNumber: "",
  address: "",
  salary: "",
  dailyWages: "",
  status: "active",
  joiningDate: "",
};

// helper: last 12 months options
const getMonthOptions = (count = 12) => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = d.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    opts.push({ value, label });
  }
  return opts;
};

export default function LaborPage() {
  const [labors, setLabors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal form
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [formType, setFormType] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Attendance section (added inline)
  const months = getMonthOptions(12);
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [payingId, setPayingId] = useState(null);

  // New: attendance tabs (All / Regular / Wages)
  const [attendanceTab, setAttendanceTab] = useState("All");

  useEffect(() => {
    fetchLabors();
  }, [activeTab]);

  useEffect(() => {
    // If user selected a specific attendance type but labors aren't loaded yet,
    // wait until labors are fetched to avoid wrong cross-reference filtering
    if (attendanceTab !== "All" && labors.length === 0) return;
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, attendanceTab, labors]);

  const fetchLabors = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/labors");
      let data = Array.isArray(res.data.data) ? res.data.data : [];

      if (activeTab !== "All") {
        data = data.filter((l) => l.type === activeTab.toLowerCase());
      }

      setLabors(data);
    } catch {
      const fallback =
        activeTab === "All"
          ? defaultData
          : defaultData.filter((l) => l.type === activeTab.toLowerCase());
      setLabors(fallback);
    }
    setLoading(false);
    setCurrentPage(1);
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const typeParam =
        attendanceTab !== "All" ? `&type=${attendanceTab.toLowerCase()}` : "";
      const res = await axios.get(
        `/attendance/attendance?month=${selectedMonth}${typeParam}`
      );

      // raw data from backend
      let data = Array.isArray(res.data.data) ? res.data.data : [];

      // 1) Normalize id field -> always use `labourId` (string)
      data = data.map((d) => {
        const id =
          d.labourId ||
          d.laborId ||
          d.labour ||
          d.labor ||
          (d.labor && String(d.labor));
        return { ...d, labourId: id ? String(id) : undefined };
      });

      // 2) If filtering by attendanceTab, either use type on record or cross-ref with labors
      if (attendanceTab !== "All") {
        const refLabors = labors && labors.length ? labors : defaultData;

        // if backend already returns `type` on each attendance row, filter by that
        if (
          data.length > 0 &&
          data.every((d) => typeof d.type !== "undefined")
        ) {
          data = data.filter(
            (d) => (d.type || "").toLowerCase() === attendanceTab.toLowerCase()
          );
        } else {
          // build map of id -> type from labors (make keys strings)
          const idToType = {};
          refLabors.forEach((l) => {
            const key = String(l._id || l.labourId || l.id);
            idToType[key] = (l.type || "").toLowerCase();
          });

          // filter attendance rows by looking up the labour's type from `idToType`
          data = data.filter(
            (d) => idToType[String(d.labourId)] === attendanceTab.toLowerCase()
          );
        }
      }

      // normalize status -> string
      const normalized = data.map((r) => ({
        ...r,
        status: String(r.status || "pending"),
      }));

      setAttendance(normalized);
    } catch (err) {
      console.error("fetchAttendance error:", err?.response || err);

      // temporary fallback
      const fallback = [
        {
          labourId: "L001",
          name: "John Doe",
          present: 18,
          absent: 0,
          totalDays: 20,
          paymentDue: 7000,
          status: "pending",
        },
        {
          labourId: "L002",
          name: "Jane Smith",
          present: 15,
          absent: 2,
          totalDays: 20,
          paymentDue: 6500,
          status: "paid",
        },
      ];

      if (attendanceTab !== "All") {
        const refLabors = labors && labors.length ? labors : defaultData;
        const idsOfType = new Set(
          refLabors
            .filter((l) => l.type === attendanceTab.toLowerCase())
            .map((l) => String(l._id))
        );
        setAttendance(
          fallback.filter((f) => idsOfType.has(String(f.labourId)))
        );
      } else {
        setAttendance(fallback);
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      await axios.delete(`/labors/${id}`);
      fetchLabors();
    }
  };

  const handleEdit = (labor) => {
    setFormData({
      fullName: labor.fullName,
      contactNumber: labor.contactNumber,
      address: labor.address,
      salary: labor.salary || "",
      dailyWages: labor.dailyWages || "",
      status: labor.status || "active",
      joiningDate: labor.joiningDate?.slice(0, 10),
    });
    setFormType(labor.type);
    setIsEditing(true);
    setEditingId(labor._id);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, type: formType };
    try {
      isEditing
        ? await axios.put(`/labors/${editingId}`, payload)
        : await axios.post("/labors", payload);
      fetchLabors();
      onCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const onCloseModal = () => {
    setShowModal(false);
    setFormData(defaultForm);
    setFormType(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const getStatusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "active") return "bg-green-500";
    if (s === "inactive") return "bg-red-500";
    return "bg-gray-400";
  };

  // Search filtering
  const filteredLabors = labors.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.contactNumber.toLowerCase().includes(q) ||
      (l.address || "").toLowerCase().includes(q)
    );
  });

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentLabors = filteredLabors.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredLabors.length / rowsPerPage);

  const handlePayNow = async (labourId) => {
    if (!window.confirm("Mark this payment as PAID?")) return;
    setPayingId(labourId);
    const prev = [...attendance];

    // optimistic UI: mark as 'paid' locally so user sees immediate change
    setAttendance((a) =>
      a.map((r) => (r.labourId === labourId ? { ...r, status: "paid" } : r))
    );

    try {
      // POST to new backend endpoint
      await axios.post(`/attendance/pay-salary`, {
        laborId: labourId,
        month: selectedMonth,
      });
      // After success, refetch to get canonical state (status = paid as per backend)
      await fetchAttendance();
    } catch (err) {
      console.error("pay error:", err?.response || err);
      setAttendance(prev);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not mark as paid. Try again.";
      alert(msg);
    } finally {
      setPayingId(null);
    }
  };

  const formatStatusForDisplay = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid" || s === "completed") return "Paid";
    return "Pending";
  };

  const isPaid = (status) => {
    const s = (status || "").toLowerCase();
    return s === "paid" || s === "completed";
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Labour Management</h1>

        <button
          onClick={() => {
            setShowModal(true);
            setFormType(null);
            setIsEditing(false);
            setFormData(defaultForm);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + Add Labour
        </button>
      </div>

      <AttendanceSection />

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4 flex gap-3 ">
          {["All", "Regular", "Wages"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
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
            placeholder="Search labors..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border px-3 py-2 rounded"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Address</th>
                <th className="p-2">Joining Date</th>
                <th className="p-2">Salary/Wages</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLabors.length > 0 ? (
                currentLabors.map((l) => (
                  <tr key={l._id}>
                    <td className="p-2">{l.fullName}</td>
                    <td className="p-2 capitalize">{l.type}</td>
                    <td className="p-2">{l.contactNumber}</td>
                    <td className="p-2">{l.address}</td>
                    <td className="p-2">
                      {new Date(l.joiningDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {l.type === "regular"
                        ? `₹${l.salary || "—"}`
                        : `₹${l.dailyWages || "—"}/day`}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${getStatusClass(
                          l.status
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-2 flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(l)}
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(l._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No labors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3">
          <p>
            Showing {filteredLabors.length === 0 ? 0 : indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredLabors.length)} of{" "}
            {filteredLabors.length} entries
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <LaborModal
            title={
              isEditing
                ? "Edit Labour"
                : formType
                ? "Add Labour"
                : "Select Labour Type"
            }
            onClose={onCloseModal}
          >
            {!formType ? (
              <div className="space-y-4">
                <button
                  onClick={() => setFormType("regular")}
                  className="w-full bg-green-600 text-white py-2 rounded"
                >
                  Regular Employee
                </button>
                <button
                  onClick={() => setFormType("wages")}
                  className="w-full bg-yellow-500 text-white py-2 rounded"
                >
                  Wages-Based Employee
                </button>
              </div>
            ) : (
              <LaborForm
                formData={formData}
                formType={formType}
                onChange={handleInputChange}
                onSubmit={handleFormSubmit}
                onCancel={onCloseModal}
                isEditing={isEditing}
              />
            )}
          </LaborModal>
        )}
      </div>

      {/* --- Monthly Attendance Summary (inserted below labour details) --- */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monthly Attendance Summary</h2>

          <div className="flex gap-3 items-center">
            {/* Attendance tabs */}
            <div className="flex gap-2">
              {["All", "Regular", "Wages"].map((t) => (
                <button
                  key={t}
                  onClick={() => setAttendanceTab(t)}
                  className={`px-3 py-1 rounded text-sm ${
                    attendanceTab === t
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Present</th>
                <th className="p-2">Absent</th>
                <th className="p-2">Total Days</th>
                <th className="p-2">Payment Due</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingAttendance ? (
                <tr>
                  <td colSpan="9" className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : attendance.length > 0 ? (
                attendance.map((a) => (
                  <tr key={a.labourId}>
                    <td className="p-2 ">{a.name}</td>
                    <td className="p-2">{a.present}</td>

                    <td className="p-2">{a.absent}</td>
                    <td className="p-2">{a.totalDays}</td>
                    <td className="p-2">
                      ₹{Number(a.paymentDue).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-3 py-1 rounded text-white ${
                          isPaid(a.status) ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      >
                        {formatStatusForDisplay(a.status)}
                      </span>
                    </td>
                    <td className="p-2">
                      {!isPaid(a.status) ? (
                        <button
                          onClick={() => handlePayNow(a.labourId)}
                          className="bg-green-500 text-white px-3 py-1 rounded"
                          disabled={payingId === a.labourId}
                        >
                          {payingId === a.labourId
                            ? "Processing..."
                            : "Pay Now"}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-600 px-3 py-1 rounded"
                        >
                          Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-4 text-center text-gray-500">
                    No attendance data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
