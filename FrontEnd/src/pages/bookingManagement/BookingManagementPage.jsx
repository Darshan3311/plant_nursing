import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "../../lib/axios";
import BookingFormModal from "./BookingFormModal";
import InvoiceDownloadButton from "./InvoiceGenerator";
import { COMPANY_INFO } from "../../config/company";

export default function BookingManagementPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Row limiter & Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal controls
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");
  const [payNotes, setPayNotes] = useState("");
  const [payBookingId, setPayBookingId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("All Bookings");

  const mapTabToParam = (tab) => {
    const normalized = (tab || "").toLowerCase();
    if (normalized === "all bookings") return "";
    if (normalized === "pending") return "pending";
    if (normalized === "sowing") return "sowing";
    if (normalized === "completed") return "completed";
    return "";
  };

  // Open Pay Remaining modal
  const openPayModal = (booking) => {
    const adv = Number(booking?.advancePayment ?? booking?.advance ?? 0);
    const gross = Number(
      booking?.finalTotalPrice ?? booking?.totalPayment ?? booking?.amount ?? 0
    );
    const computedRemaining = Math.max(0, gross - adv);
    const pending = Number(((booking?.pendingPayment ?? computedRemaining) ?? 0));
    setPayAmount(pending);
    setPayMethod("Cash");
    setPayNotes("");
    setPayBookingId(booking?._id || booking?.bookingId);
    setShowPayModal(true);
  };

  const submitPayment = async () => {
    try {
      if (!payBookingId) return alert("No booking selected");
      const amt = Number(payAmount);
      if (isNaN(amt) || amt <= 0) return alert("Enter a valid amount");

      // Prevent paying more than remaining
      const target = bookings.find(
        (b) => (b._id || b.bookingId)?.toString() === payBookingId?.toString()
      );
      if (target) {
        const adv = Number(target.advancePayment ?? target.advance ?? 0);
        const gross = Number(
          target.finalTotalPrice ?? target.totalPayment ?? target.amount ?? 0
        );
        const remaining = Math.max(0, gross - adv);
        if (amt > remaining) {
          return alert(`Amount exceeds remaining (${remaining.toLocaleString()}).`);
        }
      }

      await axios.post(`/bookings/${payBookingId}/pay`, {
        amount: amt,
        method: payMethod,
        notes: payNotes,
      });

      setShowPayModal(false);
      await fetchBookingsForTab();
      alert("Payment applied successfully");
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Payment failed");
    }
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
  
    try {
      // Fetch bookings from backend
      const resp = await axios.get("/bookings"); // make sure axios baseURL is correct
      const bookingsData = Array.isArray(resp.data?.bookings)
        ? resp.data.bookings
        : [];
  
      // Filter by status if not "All Bookings"
      const filteredBookings =
        statusParam === ""
          ? bookingsData
          : bookingsData.filter((b) => {
              const st = (b.status || b.farmer?.status || "").toLowerCase();
              return st === statusParam || st.includes(statusParam);
            });
      setBookings(filteredBookings);
  
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      setBookings([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 text-white p-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30"
               style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2332a852' fill-opacity='0.2'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
          </div>
          <div className="flex justify-between items-center mb-4 relative">
            <h1 className="text-2xl font-bold">
              <i className="fas fa-seedling mr-2"></i> Booking Management
            </h1>
            {user?.role === 'staff' && (
              <button
                onClick={() => {
                  setShowModal(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> New Booking
              </button>
            )}
          </div>
          <p className="opacity-90">Manage and track all your crop bookings</p>
        </div>

        <div className="p-4 md:p-6">
          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
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
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2">Show</span>
              <select
                className="border mx-2 p-2 rounded-lg"
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
              <span>entries</span>
            </div>

            <div className="relative w-full md:w-auto">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border px-10 py-2 rounded-lg w-full"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white text-center">
              <thead>
                <tr className="bg-green-100 text-green-800">
                  <th className="p-3">S.No</th>
                  <th className="p-3">Farmer</th>
                  <th className="p-3">Crop</th>
                  <th className="p-3">Crop(Quantity)</th>
                  <th className="p-3">Booking Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Advance Amount</th>
                  <th className="p-3">Remaining Amount</th>
                  <th className="p-3">Raw Bill</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Final Bill</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.length > 0 ? (
                  
                  currentBookings.map((booking, index) => {
                    const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
                    return (
                      <tr key={(booking._id || booking.bookingId).toString()} className="border-b hover:bg-green-50">
                        <td className="p-3">{serialNumber.toString().padStart(8, '0')}</td>
                        <td className="p-3">
                          {booking.farmer?.fullName || booking.farmer || "—"}
                        </td>
                        <td className="p-3">
                          {booking.varieties?.map(v => v.name).join(", ")}
                        </td>
                        <td className="p-3">{booking.varieties?.map(v => v.quantity).join(", ")}</td>
                        <td className="p-3">{formatDate(booking.bookingDate)}</td>
                        <td className="p-3">
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
                                className={`px-3 py-1 rounded-full text-white text-xs ${cls}`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        {/* Advance Amount */}
                        <td className="p-3">
                          ₹
                          {(() => {
                            const adv =
                              booking.advancePayment ??
                              booking.advance ??
                              0;
                            return Number(adv).toLocaleString();
                          })()}
                        </td>
                        {/* Remaining Amount */}
                        <td className="p-3">
                          ₹
                          {(() => {
                            const adv = booking.advancePayment ?? booking.advance ?? 0;
                            const gross =
                              booking.finalTotalPrice ??
                              booking.totalPayment ??
                              booking.amount ??
                              0;
                            const rem = Math.max(0, Number(gross) - Number(adv));
                            return rem.toLocaleString();
                          })()}
                        </td>
                        {/* Raw Bill: show only if advance is paid */}
                        <td className="p-3">
                          {(() => {
                            const adv = Number(
                              booking.advancePayment ?? booking.advance ?? 0
                            );
                            if (adv > 0) {
                              return (
                                <InvoiceDownloadButton
                                  bookingId={booking._id || booking.bookingId}
                                  type="raw" // <-- Only raw bill, no sowing/dispatch dates
                                />
                              );
                            }
                            return "";
                          })()}
                        </td>
                        <td className="p-3">
                          ₹
                          {booking.amount ??
                            booking.finalTotalPrice ??
                            booking.totalPayment ??
                            "—"}
                        </td>
                        {/* Final Bill: show only if advance is paid */}
                        <td className="p-3">
                          {(() => {
                            const adv = Number(
                              booking.advancePayment ?? booking.advance ?? 0
                            );
                            if (adv > 0) {
                              return (
                                <InvoiceDownloadButton
                                  bookingId={booking._id || booking.bookingId}
                                  type="final" // <-- Final bill, show sowing/dispatch dates
                                />
                              );
                            }
                            return "";
                          })()}
                        </td>
                        {/* Actions */}
                        <td className="p-3 flex gap-2 justify-center flex-wrap">
                          {booking._id ? (
                            <button
                              onClick={() => handleDeleteBooking(booking._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg flex items-center"
                            >
                              <i className="fas fa-trash mr-1"></i> Delete
                            </button>
                          ) : (
                            <button
                              className="bg-gray-300 text-white px-3 py-1 rounded-lg cursor-not-allowed"
                              disabled
                            >
                              Delete
                            </button>
                          )}
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
                              buttonLabel = "To Sowing";
                            } else if (st === "sowing" || st === "sown") {
                              nextStatus = "completed";
                              buttonLabel = "To Completed";
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
                                  } text-white px-3 py-1 rounded-lg flex items-center`}
                                >
                                  <i className="fas fa-arrow-right mr-1"></i> {buttonLabel}
                                </button>
                              );
                            }
                            return null;
                          })()}
                          {/* Pay Remaining */}
                          {(() => {
                            const adv = Number(booking.advancePayment ?? booking.advance ?? 0);
                            const gross = Number(
                              booking.finalTotalPrice ?? booking.totalPayment ?? booking.amount ?? 0
                            );
                            const rem = Math.max(0, gross - adv);
                            return rem > 0;
                          })() && (
                            <button
                              onClick={() => openPayModal(booking)}
                              className="bg-amber-500 text-white px-3 py-1 rounded-lg flex items-center"
                            >
                              <i className="fas fa-indian-rupee-sign mr-1"></i> Pay Remaining
                            </button>
                          )}
                          {/* Invoice download moved to Raw Bill column */}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="p-6 text-center text-gray-500">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-gray-600">
              Showing {filteredBookings.length === 0 ? 0 : indexOfFirst + 1} to{" "}
              {Math.min(indexOfLast, filteredBookings.length)} of{" "}
              {filteredBookings.length} entries
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <i className="fas fa-chevron-left mr-1"></i> Previous
              </button>
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>

          {/* Modals */}
          {showModal && (
            <BookingFormModal
              onClose={() => setShowModal(false)}
              refreshData={fetchBookingsForTab}
            />
          )}
          {showPayModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-4">Pay Remaining</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg p-2"
                      value={payAmount}
                      min={1}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Method</label>
                    <select
                      className="w-full border rounded-lg p-2"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      className="w-full border rounded-lg p-2"
                      rows={3}
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border"
                    onClick={() => setShowPayModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-green-600 text-white"
                    onClick={submitPayment}
                  >
                    Pay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}