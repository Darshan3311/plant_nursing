import React, { useEffect, useState } from "react";
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
        axios.get("/admin/nutrients")
      ]);

      setIncomeData(incomeRes.data.data || dummyIncome);
      setBookingStats(bookingRes.data || dummyBookingStats);
      setNutrientStock(nutrientRes.data || dummyNutrients);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setIncomeData(dummyIncome);
      setBookingStats(dummyBookingStats);
      setNutrientStock(dummyNutrients);
    }
  }
  fetchData();
}, []);


  // Transform income data for bar chart
  const incomeChartData = incomeData
    ? [
        { label: "Daily", value: incomeData.daily },
        { label: "Monthly", value: incomeData.monthly },
        { label: "Yearly", value: incomeData.yearly },
      ]
    : [];

  return (
    <div className="font-inter p-5 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-green-800">
          Admin Panel 
        </h1>
        
      </div>

      {/* Income Summary */}
      <Section title=" Income Summary">
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
      <Section title=" Booking Stats">
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#388e3c"
                fill="#388e3c"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Nutrient Stock */}
      <Section title=" Nutrient Stock">
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
