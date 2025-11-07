import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Correctly importing all necessary functions from your actual service file
import {
  getOverviewMetrics,
  getUpcomingSchedules,
  getRecentPayments,
  getMonthlyBookings,
  getTopCrops,
  getLowStockDetails,
  getAllUpcomingSchedules,
  getAllRecentPayments,
} from "../../services/staffDashboardService"; // Adjust the path if needed

export default function StaffDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topCrops, setTopCrops] = useState([]);

  // State for modal visibility
  const [modalView, setModalView] = useState(null); // 'lowStock', 'schedules', 'payments'

  // State for modal content and loading
  const [modalData, setModalData] = useState([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  useEffect(() => {
    // Initial data fetch for the main dashboard view
    Promise.all([
      getOverviewMetrics(),
      getUpcomingSchedules(),
      getRecentPayments(),
      getMonthlyBookings(),
      getTopCrops(),
    ])
      .then(
        ([
          { data: m },
          { data: sched },
          { data: pay },
          { data: monthly },
          { data: crops },
        ]) => {
          setMetrics(m);
          setSchedules(sched);
          setPayments(pay);
          setMonthlyData(monthly);
          setTopCrops(crops);
        }
      )
      .catch((err) => {
        console.error("❌ Dashboard load error:", err);
        // Set default empty states on error to prevent app crash
        setMetrics({
          totalBookings: 0,
          bookingsThisMonth: 0,
          activeFarmers: 0,
          newFarmers: 0,
          pendingTasks: 0,
          urgentTasks: 0,
          lowStock: 0,
        });
      });
  }, []);

  const openModal = async (type) => {
    setModalView(type);
    setIsLoadingModal(true);
    setModalData([]); // Clear previous data

    try {
      let response;
      if (type === "lowStock") response = await getLowStockDetails();
      else if (type === "schedules") response = await getAllUpcomingSchedules();
      else if (type === "payments") response = await getAllRecentPayments();

      if (response) setModalData(response.data);
    } catch (err) {
      console.error(`❌ Error loading details for ${type}:`, err);
    } finally {
      setIsLoadingModal(false);
    }
  };

  if (!metrics) {
    return <div className="p-6 text-center">Loading Dashboard...</div>;
  }

  const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#fb923c"];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings}
          note={`This month: ${metrics.bookingsThisMonth}`}
          color="bg-blue-500"
        />
        <MetricCard
          title="Active Farmers"
          value={metrics.activeFarmers}
          note={`New this month: ${metrics.newFarmers}`}
          color="bg-green-500"
        />
        <MetricCard
          title="Pending Tasks"
          value={metrics.pendingTasks}
          note={`Urgent: ${metrics.urgentTasks}`}
          color="bg-yellow-400"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStock}
          note="Click to view details"
          color="bg-red-500"
          onClick={() => openModal("lowStock")}
        />
      </div>

      {/* Upcoming & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Upcoming Schedules</h2>
            <button
              onClick={() => openModal("schedules")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <ul className="space-y-3">
            {schedules.map((s) => (
              <li
                key={s._id}
                className="border-l-4 pl-3 py-2"
                style={{ borderColor: s.urgent ? "#f87171" : "#34d399" }}
              >
                <p className="font-medium text-gray-700">{s.title}</p>
                <p className="text-sm text-gray-600">Farmer: {s.farmer}</p>
                <p className="text-xs text-gray-500">Due: {s.dueDate}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Recent Payments</h2>
            <button
              onClick={() => openModal("payments")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 font-normal">Date</th>
                <th className="font-normal">Farmer</th>
                <th className="font-normal">Amount</th>
                <th className="font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="py-2">{p.date}</td>
                  <td>{p.farmer}</td>
                  <td>₹{p.amount.toLocaleString("en-IN")}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : p.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium mb-2 text-gray-800">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={monthlyData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <ReTooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-medium mb-2 text-gray-800">Top Crops</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={topCrops}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label
              >
                {topCrops.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL SECTION */}
      {modalView && (
        <Modal
          title={
            modalView === "lowStock"
              ? "Low Stock Details"
              : modalView === "schedules"
              ? "All Upcoming Schedules"
              : "All Recent Payments"
          }
          onClose={() => setModalView(null)}
        >
          {isLoadingModal ? (
            <p>Loading...</p>
          ) : !modalData || modalData.length === 0 ? (
            <p className="text-gray-600">No data found.</p>
          ) : modalView === "lowStock" ? (
            <LowStockContent data={modalData} />
          ) : modalView === "schedules" ? (
            <SchedulesContent data={modalData} />
          ) : (
            <PaymentsContent data={modalData} />
          )}
        </Modal>
      )}
    </div>
  );
}

// --- Sub-components for Modal Content (for better organization) ---

function LowStockContent({ data }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-600 border-b">
          <th className="py-2 font-normal">Variety</th>
          <th className="font-normal">Quantity</th>
          <th className="font-normal">Lower Limit</th>
          <th className="font-normal">Unit</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item._id} className="border-b last:border-b-0">
            <td className="py-2">{item.variety?.name || "N/A"}</td>
            <td>{item.quantity}</td>
            <td>{item.lowerLimit}</td>
            <td>{item.unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SchedulesContent({ data }) {
  return (
    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {data.map((s) => (
        <li
          key={s._id}
          className="border-l-4 pl-3 py-2"
          style={{ borderColor: s.urgent ? "#f87171" : "#34d399" }}
        >
          <p className="font-medium text-gray-700">{s.title}</p>
          <p className="text-sm text-gray-600">Farmer: {s.farmer}</p>
          <p className="text-xs text-gray-500">Due: {s.dueDate}</p>
        </li>
      ))}
    </ul>
  );
}

function PaymentsContent({ data }) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 font-normal">Date</th>
            <th className="font-normal">Farmer</th>
            <th className="font-normal">Amount</th>
            <th className="font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p._id} className="border-t">
              <td className="py-2">{p.date}</td>
              <td>{p.farmer}</td>
              <td>₹{p.amount.toLocaleString("en-IN")}</td>
              <td>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "Paid"
                      ? "bg-green-100 text-green-700"
                      : p.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Reusable UI Components ---

function MetricCard({ title, value, note, color, onClick }) {
  return (
    <div
      className={`p-4 rounded-lg text-white shadow-md ${color} ${
        onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
      }`}
      onClick={onClick}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold my-2">{value}</p>
      <p className="text-xs opacity-90">{note}</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg animate-fade-in-up">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-2xl"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
