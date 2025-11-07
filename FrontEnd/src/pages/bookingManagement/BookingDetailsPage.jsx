import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import axios from "../../lib/axios";
import InvoiceDownloadButton from "./InvoiceGenerator";

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [allIds, setAllIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(`/bookings/${id}`);
      const data = resp?.data?.data ?? resp?.data;
      setBooking(data);
      setAmount(Number(data?.pendingPayment || 0));
    } catch (err) {
      console.error("Failed to fetch booking:", err);
      setError("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  // Fetch all bookings (ids + dates) to enable Prev/Next navigation
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resp = await axios.get("/bookings");
        const list = Array.isArray(resp?.data?.bookings) ? resp.data.bookings : [];
        // sort by bookingDate desc (newest first)
        const sorted = [...list].sort((a, b) => new Date(b.bookingDate || 0) - new Date(a.bookingDate || 0));
        const ids = sorted.map(b => b._id || b.bookingId).filter(Boolean);
        setAllIds(ids);
        const idx = ids.findIndex(x => String(x) === String(id));
        setCurrentIndex(idx);
      } catch (e) {
        // ignore
      }
    };
    fetchAll();
  }, [id]);

  const submitPayment = async () => {
    try {
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) return alert("Enter a valid amount");
      await axios.post(`/bookings/${id}/pay`, { amount: amt, method, notes });
      await fetchBooking();
      alert("Payment applied");
    } catch (err) {
      console.error("Payment failed:", err);
      alert("Payment failed");
    }
  };

  const goNeighbor = (dir) => {
    if (currentIndex < 0 || allIds.length === 0) return;
    const nextIdx = currentIndex + (dir === "next" ? 1 : -1);
    if (nextIdx < 0 || nextIdx >= allIds.length) return;
    const base = location.pathname.split("/bookings/")[0];
    navigate(`${base}/bookings/${allIds[nextIdx]}`);
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!booking) return <div className="p-4">Not found</div>;

  const adv = Number(booking.advancePayment || 0);
  const pen = Number(booking.pendingPayment || 0);
  const gross = Number(
    booking.finalTotalPrice ?? booking.totalPayment ?? booking.amount ?? 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
        <div className="bg-green-700 text-white p-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Booking Details</h1>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30"
            >
              Back
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => goNeighbor("prev")}
              disabled={currentIndex <= 0}
              className={`px-3 py-1 rounded-lg ${currentIndex <= 0 ? "bg-white/10 cursor-not-allowed" : "bg-white/20 hover:bg-white/30"}`}
            >
              ◀ Prev
            </button>
            <button
              onClick={() => goNeighbor("next")}
              disabled={currentIndex < 0 || currentIndex >= allIds.length - 1}
              className={`px-3 py-1 rounded-lg ${currentIndex < 0 || currentIndex >= allIds.length - 1 ? "bg-white/10 cursor-not-allowed" : "bg-white/20 hover:bg-white/30"}`}
            >
              Next ▶
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h2 className="font-semibold mb-2">Customer</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">Name:</span> {booking.farmer?.fullName || "—"}</div>
                <div><span className="text-gray-500">Phone:</span> {booking.farmer?.phone || "—"}</div>
                <div><span className="text-gray-500">Email:</span> {booking.farmer?.email || "—"}</div>
                <div><span className="text-gray-500">Address:</span> {booking.farmer?.address || "—"}</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h2 className="font-semibold mb-2">Booking</h2>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">ID:</span> {booking._id}</div>
                <div><span className="text-gray-500">Group:</span> {booking.cropGroup?.name || "—"}</div>
                <div><span className="text-gray-500">Plot:</span> {booking.plotNumber || "—"}</div>
                <div><span className="text-gray-500">Date:</span> {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : "—"}</div>
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-green-50">
              <div className="text-sm text-gray-500">Advance</div>
              <div className="text-xl font-bold">₹{adv.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg border bg-yellow-50">
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-xl font-bold">₹{pen.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-xl font-bold">₹{gross.toLocaleString()}</div>
            </div>
          </div>

          {/* Payment form */}
          <div className="p-4 rounded-lg border">
            <h2 className="font-semibold mb-3">Apply Payment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Method</label>
                <select
                  className="w-full border p-2 rounded-lg"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border p-2 rounded-lg"
                  placeholder="Payment reference, remarks"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={submitPayment} className="px-4 py-2 rounded-lg bg-green-600 text-white">Apply Payment</button>
              <button onClick={() => fetchBooking()} className="px-4 py-2 rounded-lg border">Refresh</button>
            </div>
          </div>

          {/* Invoice */}
          <div className="p-4 rounded-lg border flex items-center justify-between">
            <div className="text-gray-700">Invoice</div>
            {pen === 0 ? (
              <InvoiceDownloadButton bookingId={booking._id} />
            ) : (
              <div className="text-sm text-gray-500">Invoice will be available after full payment.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
