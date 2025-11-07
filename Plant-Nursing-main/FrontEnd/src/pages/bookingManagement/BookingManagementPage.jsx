import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import BookingFormModal from "./BookingFormModal";
import InvoiceDownloadButton from "./InvoiceGenerator";

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Row limiter & Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal controls
  const [showModal, setShowModal] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("All Bookings");

  const defaultData = [
    {
      bookingId: "#1001",
      farmer: "Soham Patil",
      crop: "Tomato",
      quantity: "1000 seedlings",
      bookingDate: "Jul 1, 2025",
      status: "Sown",
      amount: 2000,
    },
    {
      bookingId: "#1002",
      farmer: "Soham Sonawane",
      crop: "Chilli",
      quantity: "500 seedlings",
      bookingDate: "Jun 28, 2025",
      status: "Pending",
      amount: 1000,
    },
    {
      bookingId: "#1003",
      farmer: "Soham Shinde",
      crop: "Bhendi",
      quantity: "750 seedlings",
      bookingDate: "Jun 25, 2025",
      status: "Completed",
      amount: 1500,
    },
  ];

  const mapTabToParam = (tab) => {
    const normalized = (tab || "").toLowerCase();
    if (normalized === "all bookings") return "";
    if (normalized === "pending") return "pending";
    if (normalized === "sowing") return "sowing";
    if (normalized === "completed") return "completed";
    return "";
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      const date = new Date(d);
      if (isNaN(date)) return d.toString();
      return date.toLocaleDateString();
    } catch {
      return d.toString();
    }
  };

  const getStatusClass = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "pending") return "bg-yellow-500";
    if (s === "sowing" || s === "sown") return "bg-blue-500";
    if (s === "completed") return "bg-green-500";
    return "bg-gray-400";
  };

  const fetchBookingsForTab = async () => {
    setLoading(true);
    const statusParam = mapTabToParam(activeTab);
    const tryEndpoints = [];

    if (statusParam) tryEndpoints.push(`/bookings?status=${statusParam}`);
    tryEndpoints.push(`/bookings`);

    let gotData = null;

    for (const ep of tryEndpoints) {
      try {
        const resp = await axios.get(ep);
        const raw = resp?.data;
        let data = [];

        if (Array.isArray(raw)) data = raw;
        else if (Array.isArray(raw?.data)) data = raw.data;

        if (Array.isArray(data)) {
          gotData = data;
          break;
        }
      } catch (err) {
        console.warn(`Failed to fetch ${ep}:`, err.message);
      }
    }

    if (gotData === null) {
      const filteredDefaults =
        activeTab === "All Bookings"
          ? defaultData
          : defaultData.filter(
              (d) => d.status.toLowerCase() === mapTabToParam(activeTab)
            );
      setBookings(filteredDefaults);
    } else {
      if (activeTab === "All Bookings") {
        setBookings(gotData);
      } else {
        setBookings(
          gotData.filter((b) => {
            const bookingStatus = (
              b.status ||
              b.farmer?.status ||
              ""
            ).toLowerCase();
            return (
              bookingStatus === statusParam ||
              bookingStatus.includes(statusParam)
            );
          })
        );
      }
    }

    setLoading(false);
    setCurrentPage(1);
  };

  const handleDeleteBooking = async (id) => {
    console.log("handleDeleteBooking called with id:", id);

    if (!id) {
      alert("Cannot delete: no booking id available.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;

    try {
      // axios baseURL likely points to /api, so endpoint becomes /api/bookings/:id
      await axios.delete(`/bookings/${id}`);
      // remove it from UI (or call fetchBookingsForTab() to refresh)
      setBookings((prev) => prev.filter((b) => b._id !== id));
      alert("Booking deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete booking");
    }
  };

  const handlePromoteBooking = async (id, newStatus) => {
    try {
      const res = await axios.patch(`/bookings/${id}/promote`, {
        status: newStatus,
      });

      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error(err);
      alert("Error updating booking status");
    }
  };

  useEffect(() => {
    fetchBookingsForTab();
  }, [activeTab]);

  // Search filtering
  const filteredBookings = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const farmerName = (b.farmer?.fullName || b.farmer || "").toLowerCase();
    const crop = (b.variety || b.cropGroup?.name || b.crop || "").toLowerCase();
    const bookingId = (b.bookingId || b._id || "").toLowerCase();
    return farmerName.includes(q) || crop.includes(q) || bookingId.includes(q);
  });

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Booking Management</h1>
        <button
          onClick={() => {
            setShowModal(true);
          }}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + New Booking
        </button>
      </div>

      <div className="p-4 shadow-2xl rounded-2xl">
        {/* Tabs */}
        <div className="mb-4 flex gap-3">
          {["All Bookings", "Pending", "Sowing", "Completed"].map((tab) => (
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
            placeholder="Search bookings..."
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
          <table className="min-w-full bg-white shadow rounded-lg text-center">
            <thead className="border-collapse">
              <tr className="rounded-2xl bg-gray-100">
                <th className="p-2">Booking ID</th>
                <th className="p-2">Farmer</th>
                <th className="p-2">Crop</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Booking Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.length > 0 ? (
                
                currentBookings.map((booking) => (
                  <tr key={(booking._id || booking.bookingId).toString()}>
                    <td className="p-2">{booking.bookingId || booking._id}</td>
                    <td className="p-2">
                      {booking.farmer?.fullName || booking.farmer || "—"}
                    </td>
                    <td className="p-2">
                      {booking.variety || booking.cropGroup?.name || "—"}
                    </td>
                    <td className="p-2">{booking.quantity}</td>
                    <td className="p-2">{formatDate(booking.bookingDate)}</td>
                    <td className="p-2">
                      {(() => {
                        const st = (
                          booking.status ||
                          booking.farmer?.status ||
                          ""
                        ).toLowerCase();
                        const label = st
                          ? st.charAt(0).toUpperCase() + st.slice(1)
                          : "Unknown";
                        const cls = getStatusClass(st);
                        return (
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${cls}`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-2">
                      ₹
                      {booking.amount ??
                        booking.finalTotalPrice ??
                        booking.totalPayment ??
                        "—"}
                    </td>
                    <td className="p-2 flex gap-2 justify-center">
                      {booking._id ? (
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          className="bg-gray-300 text-white px-2 py-1 rounded cursor-not-allowed"
                          disabled
                        >
                          Delete
                        </button>
                      )}
                      {/* Promote Button */}
                      {(() => {
                        const st = (
                          booking.status ||
                          booking.farmer?.status ||
                          ""
                        ).toLowerCase();
                        let nextStatus = null;
                        let buttonLabel = "";

                        if (st === "pending") {
                          nextStatus = "sowing";
                          buttonLabel = "Promote to Sowing";
                        } else if (st === "sowing" || st === "sown") {
                          nextStatus = "completed";
                          buttonLabel = "Promote to Completed";
                        }

                        if (nextStatus) {
                          return (
                            <button
                              onClick={() =>
                                handlePromoteBooking(booking._id, nextStatus)
                              }
                              className={`${
                                nextStatus === "sowing"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              } text-white px-2 py-1 rounded`}
                            >
                              {buttonLabel}
                            </button>
                          );
                        }
                        return null;
                      })()}
                      {["pending", "completed"].includes(
                        (booking.status || "").toLowerCase()
                      ) && <InvoiceDownloadButton bookingId={booking._id || booking.bookingId} />}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3">
          <p>
            Showing {filteredBookings.length === 0 ? 0 : indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredBookings.length)} of{" "}
            {filteredBookings.length} entries
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
          <BookingFormModal
            onClose={() => {
              setShowModal(false);
            }}
            refreshData={fetchBookingsForTab}
          />
        )}
      </div>
    </div>
  );
}
