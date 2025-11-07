// File: src/pages/AttendancePage.jsx
/*
Description:
Attendance marking page with consistent LaborPage theme,
including search, pagination, loading state, and empty state styling.
*/

import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { useParams } from "react-router";

export default function AttendancePage() {
  const { type } = useParams(); // 'regular' or 'wages'

  const [labors, setLabors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAvailableLabors();
  }, [type]);

  const fetchAvailableLabors = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await axios.get(
        `/attendance/available-labors?type=${type}&date=${today}`
      );
      setLabors(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch available labors", err);
      setLabors([]);
    }
    setLoading(false);
    setCurrentPage(1);
  };

  const markPresent = async (id) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await axios.post(`/attendance/mark`, {
        laborId: id,
        date: today,
      });

      setLabors((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error("Error marking attendance", err);
    }
  };

  // Search filter
  const filteredLabors = labors.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.fullName.toLowerCase().includes(q) ||
      l.contactNumber.toLowerCase().includes(q)
    );
  });

  // Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentLabors = filteredLabors.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredLabors.length / rowsPerPage);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Mark Attendance: {type === "regular" ? "Regular" : "Wages-Based"}
      </h1>

      <div className="bg-white shadow rounded-lg p-6">
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
          <table className="min-w-full bg-white shadow rounded-lg text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Joining Date</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentLabors.length > 0 ? (
                currentLabors.map((l) => (
                  <tr key={l._id}>
                    <td className="p-2">{l.fullName}</td>
                    <td className="p-2">{l.contactNumber}</td>
                    <td className="p-2">
                      {new Date(l.joiningDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => markPresent(l._id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Mark Present
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="p-4 text-center text-gray-500"
                  >
                    All labor attendance marked for today.
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
      </div>
    </div>
  );
}
