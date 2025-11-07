import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { InvoiceContent } from "../bookingManagement/InvoiceGenerator";
import axios from "../../lib/axios"; // your axios instance
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [incomeData, setIncomeData] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [nutrientStock, setNutrientStock] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  // New state for Nutrient Stock forms
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockCrop, setStockCrop] = useState("");
  const [stockVarieties, setStockVarieties] = useState("");
  const [stockTotal, setStockTotal] = useState("");

  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingCrop, setBookingCrop] = useState("");
  const [bookingVariety, setBookingVariety] = useState("");
  const [bookingRate, setBookingRate] = useState("");
  const [bookingQuantity, setBookingQuantity] = useState("");
  const [bookingTotal, setBookingTotal] = useState(0);

  // Dummy fallback data
  const dummyIncome = {
    daily: 8550,
    monthly: 120750,
    yearly: 1450000,
  };

  const dummyBookingStats = {
    daily: 32,
    monthly: 540,
    yearly: 6120,
    monthly_trend: [
      { month: "Jan", count: 420 },
      { month: "Feb", count: 380 },
      { month: "Mar", count: 510 },
      { month: "Apr", count: 550 },
      { month: "May", count: 600 },
      { month: "Jun", count: 540 },
    ],
  };

  const dummyNutrients = [
    { id: 1, name: "Nitrogen (N)", available: 45, lowerLimit: 15, status: "ok" },
    { id: 2, name: "Phosphorus (P)", available: 18, lowerLimit: 22, status: "low" },
    { id: 3, name: "Potassium (K)", available: 60, lowerLimit: 10, status: "ok" },
    { id: 4, name: "Organic Compost", available: 85, lowerLimit: 35, status: "ok" },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const [incomeRes, bookingRes, nutrientRes] = await Promise.all([
          axios.get("/admin/income"),
          axios.get("/admin/bookings"),
          axios.get("/nutrient-stock"),
        ]);

        setIncomeData(incomeRes.data.data || dummyIncome);
        setBookingStats(bookingRes.data || dummyBookingStats);
        setNutrientStock(nutrientRes.data?.data || nutrientRes.data || dummyNutrients);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setIncomeData(dummyIncome);
        setBookingStats(dummyBookingStats);
        setNutrientStock(dummyNutrients);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const rate = parseFloat(bookingRate);
    const quantity = parseFloat(bookingQuantity);
    if (!isNaN(rate) && !isNaN(quantity)) {
      setBookingTotal(rate * quantity);
    } else {
      setBookingTotal(0);
    }
  }, [bookingRate, bookingQuantity]);

  const handleAddExpense = async () => {
    try {
      if (!expenseAmount || isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
        alert("Please enter a valid expense amount.");
        return;
      }

      const expensePayload = {
        amount: parseFloat(expenseAmount),
        description: expenseDescription,
      };

      // Call backend to record the daily expense
      await axios.post("/expenses/daily", expensePayload);

      // Refresh income data so daily income reflects deduction
      try {
        const incomeRes = await axios.get("/admin/income");
        setIncomeData(incomeRes.data.data || dummyIncome);
      } catch (e) {
        console.warn("Failed to refresh income data after expense; using previous data.", e);
      }

      setExpenseAmount("");
      setExpenseDescription("");
      setShowExpenseModal(false);
      alert("Expense recorded!");
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to add expense. Please try again.");
    }
  };

  const handleAddStockManually = async () => {
    try {
      if (!stockCrop || !stockVarieties || !stockTotal || isNaN(stockTotal) || parseFloat(stockTotal) <= 0) {
        alert("Please fill all stock fields with valid data.");
        return;
      }

      const stockPayload = {
        name: stockVarieties || stockCrop,
        amount: parseFloat(stockTotal),
        lowerLimit: 0,
      };

      await axios.post("/nutrient-stock", stockPayload);

      // Refresh nutrient stock list
      try {
        const nutrientRes = await axios.get("/nutrient-stock");
        setNutrientStock(nutrientRes.data?.data || nutrientRes.data || dummyNutrients);
      } catch (e) {
        console.warn("Failed to refresh nutrient stock; keeping previous list.", e);
      }

      setStockCrop("");
      setStockVarieties("");
      setStockTotal("");
      setShowAddStockModal(false);
      alert("Stock saved!");
    } catch (err) {
      console.error("Error adding stock:", err);
      alert("Failed to add stock. Please try again.");
    }
  };

  const handleAddBooking = async () => {
    try {
      if (
        !bookingName ||
        !bookingNumber ||
        !bookingAddress ||
        !bookingCrop ||
        !bookingVariety ||
        isNaN(bookingRate) ||
        parseFloat(bookingRate) <= 0 ||
        isNaN(bookingQuantity) ||
        parseFloat(bookingQuantity) <= 0
      ) {
        alert("Please fill all booking fields correctly.");
        return;
      }

      if (bookingTotal > 50000) {
        alert("Booking total exceeds ₹50,000. Income will not be stored.");
        setShowAddBookingModal(false);
        setBookingName("");
        setBookingNumber("");
        setBookingAddress("");
        setBookingCrop("");
        setBookingVariety("");
        setBookingRate("");
        setBookingQuantity("");
        setBookingTotal(0);
        return;
      }

      const bookingPayload = {
        name: bookingName,
        number: bookingNumber,
        address: bookingAddress,
        crop: bookingCrop,
        variety: bookingVariety,
        rate: parseFloat(bookingRate),
        quantity: parseFloat(bookingQuantity),
        total: bookingTotal,
      };

      // Save booking and record income
      const resp = await axios.post("/daily-bookings", bookingPayload);
      const created = resp?.data?.data || resp?.data || {};

      // Refresh income
      try {
        const incomeRes = await axios.get("/admin/income");
        setIncomeData(incomeRes.data.data || dummyIncome);
      } catch (e) {
        console.warn("Failed to refresh income after booking; keeping previous value.", e);
      }
      setBookingName("");
      setBookingNumber("");
      setBookingAddress("");
      setBookingCrop("");
      setBookingVariety("");
      setBookingRate("");
      setBookingQuantity("");
      setBookingTotal(0);
      setShowAddBookingModal(false);
      alert("Booking saved!");

      // After user confirms the alert, generate and download invoice PDF
      try {
        const bookingForInvoice = {
          _id: created._id || created.bookingId || `BKG-${Date.now()}`,
          bookingId: created.bookingId,
          bookingDate: created.bookingDate || new Date().toISOString(),
          farmer:
            created.farmer || {
              fullName: bookingName,
              phone: bookingNumber,
              address: bookingAddress,
            },
          cropGroup: created.cropGroup || bookingCrop,
          variety: created.variety || bookingVariety,
          varieties: Array.isArray(created.varieties) && created.varieties.length > 0
            ? created.varieties
            : [{ name: bookingVariety, quantity: Number(bookingQuantity) }],
          amount:
            created.amount ??
            created.finalTotalPrice ??
            created.totalPayment ??
            Number(bookingTotal),
          advancePayment: Number(created.advancePayment ?? created.advance ?? 0),
          finalPayment: Number(created.finalPayment ?? created.paidAmount ?? 0),
          pendingPayment: Number(created.pendingPayment ?? 0),
          notes: created.notes,
          company: created.company,
        };

        await generateAndDownloadInvoicePDF(bookingForInvoice);
      } catch (e) {
        console.warn("Failed to auto-generate invoice:", e);
      }
    } catch (err) {
      console.error("Error adding booking:", err);
      alert("Failed to add booking. Please try again.");
    }
  };

  // Helper: render invoice offscreen and download as PDF
  async function generateAndDownloadInvoicePDF(bookingData) {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Create hidden container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-10000px";
    container.style.left = "-10000px";
    container.style.zIndex = "-9999";
    container.style.background = "#fff";
    document.body.appendChild(container);

    // Render invoice content
    const root = createRoot(container);
    await new Promise((resolve) => {
      root.render(
        <div>
          <InvoiceContent booking={bookingData} />
        </div>
      );
      // Give React a tick to paint
      setTimeout(resolve, 100);
    });

    // Capture as image
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");

    // Cleanup React root
    try { root.unmount(); } catch {}
    document.body.removeChild(container);

    // Create PDF
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);

    const filename = `invoice-${(bookingData._id || Date.now()).toString().slice(-6)}-${new Date()
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-")}.pdf`;
    pdf.save(filename);
  }

  const incomeChartData = incomeData
    ? [
        { label: "Daily", value: incomeData?.daily ?? 0 },
        { label: "Monthly", value: incomeData?.monthly ?? 0 },
        { label: "Yearly", value: incomeData?.yearly ?? 0 },
      ]
    : [];

  return (
    <div className="font-inter p-5 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-green-800">Admin Panel</h1>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          ➖ Add Expense
        </button>
      </div>

      {/* Income Summary */}
      <Section title="Income Summary">
        <div className="flex flex-wrap gap-5 mt-4">
          <Card title="📅 Daily Income" value={`₹${incomeData?.daily}`} />
          <Card title="📆 Monthly Income" value={`₹${incomeData?.monthly}`} />
          <Card title="📈 Yearly Income" value={`₹${incomeData?.yearly}`} />
        </div>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4caf50" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Booking Stats */}
      <Section title="Booking Stats">
        <div className="flex flex-wrap gap-5 mt-4">
          <Card title="📅 Daily Bookings" value={bookingStats?.daily} />
          <Card title="📆 Monthly Bookings" value={bookingStats?.monthly} />
          <Card title="📈 Yearly Bookings" value={bookingStats?.yearly} />
        </div>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bookingStats?.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#388e3c" fill="#388e3c" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Nutrient Stock */}
      <Section title="Nutrient Stock">
        {/* New buttons for Nutrient Stock placed here */}
        <div className="flex justify-start gap-4 mb-5">
          <button
            onClick={() => setShowAddStockModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            + Add Available Stock Manually
          </button>
          <button
            onClick={() => setShowAddBookingModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            + Add New Booking
          </button>
        </div>
        <table className="w-full border-collapse mt-5 text-center text-base">
          <thead>
            <tr className="bg-green-200 text-green-900 font-bold">
              <th className="p-3 border">#</th>
              <th className="p-3 border">Nutrient</th>
              <th className="p-3 border">Available (kg)</th>
              <th className="p-3 border">Lower Limit (kg)</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {nutrientStock.map((nutrient, index) => (
              <tr
                key={nutrient.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 border">{index + 1}</td>
                <td className="p-3 border">{nutrient.name}</td>
                <td className="p-3 border">{nutrient.available}</td>
                <td className="p-3 border">{nutrient.lowerLimit}</td>
                <td
                  className={`p-3 border font-bold ${
                    nutrient.status === "low" ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {nutrient.status === "low" ? "⚠️ Low Stock" : "✅ OK"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div style={{ background: "rgba(0, 0, 0, 0.5)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="amount">
                Expense Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 19000"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                rows="3"
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Expense for new equipment"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Manually Modal */}
      {showAddStockModal && (
        <div style={{ background: "rgba(0, 0, 0, 0.5)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Add Available Stock Manually</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="stockCrop">Crop</label>
              <input
                type="text"
                id="stockCrop"
                value={stockCrop}
                onChange={(e) => setStockCrop(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Wheat"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="stockVarieties">Varieties</label>
              <input
                type="text"
                id="stockVarieties"
                value={stockVarieties}
                onChange={(e) => setStockVarieties(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Lokwan"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="stockTotal">Total (Units/Kg)</label>
              <input
                type="number"
                id="stockTotal"
                value={stockTotal}
                onChange={(e) => setStockTotal(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddStockModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStockManually}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddBookingModal && (
        <div style={{ background: "rgba(0, 0, 0, 0.5)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/2 max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add New Booking</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingName">Name</label>
                <input
                  type="text"
                  id="bookingName"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Customer Name"
                />
              </div>
              {/* Number */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingNumber">Number</label>
                <input
                  type="text"
                  id="bookingNumber"
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Customer Phone"
                />
              </div>
              {/* Address */}
              <div className="mb-2 col-span-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingAddress">Address</label>
                <input
                  type="text"
                  id="bookingAddress"
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Customer Address"
                />
              </div>
              {/* Crop */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingCrop">Crop</label>
                <input
                  type="text"
                  id="bookingCrop"
                  value={bookingCrop}
                  onChange={(e) => setBookingCrop(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Crop Name"
                />
              </div>
              {/* Variety */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingVariety">Variety</label>
                <input
                  type="text"
                  id="bookingVariety"
                  value={bookingVariety}
                  onChange={(e) => setBookingVariety(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Crop Variety"
                />
              </div>
              {/* Rate */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingRate">Rate (₹)</label>
                <input
                  type="number"
                  id="bookingRate"
                  value={bookingRate}
                  onChange={(e) => setBookingRate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Price per unit/kg"
                />
              </div>
              {/* Quantity */}
              <div className="mb-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="bookingQuantity">Quantity</label>
                <input
                  type="number"
                  id="bookingQuantity"
                  value={bookingQuantity}
                  onChange={(e) => setBookingQuantity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Number of units/kg"
                />
              </div>
              {/* Total (Calculated) */}
              <div className="mb-2 col-span-2">
                <label className="block text-gray-700 font-semibold mb-1">Total (₹)</label>
                <input
                  type="text"
                  value={`₹${bookingTotal.toFixed(2)}`}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddBookingModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBooking}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Add Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Section Component
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md my-5">
      <h2 className="text-xl font-semibold border-b pb-2 mb-4">{title}</h2>
      {children}
    </div>
  );
}

// Card Component
function Card({ title, value }) {
  return (
    <div className="flex-1 min-w-[250px] bg-green-50 p-5 rounded-lg font-bold border-l-4 border-green-500 shadow-sm">
      {title}: <span className="font-normal text-green-900">{value}</span>
    </div>
  );
}