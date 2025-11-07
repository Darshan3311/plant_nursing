import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import NewPageModel from "./NewPageModel";

export default function CropManagementPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Row limiter & Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal controls
  const [showModal, setShowModal] = useState(false);

  const defaultData = [
    {
      _id: "1",
      date: "2025-07-01",
      cropGroup: { name: "Vegetables" },
      variety: { name: "Tomato" },
      totalTrays: 20,
      totalPlants: 1960,
      sowingDate: "2025-07-03",
      totalMans: 5,
    },
    // ...
  ];

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

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const resp = await axios.get("/newEntry");
      const raw = resp?.data;
      let data = [];

      if (Array.isArray(raw)) data = raw;
      else if (Array.isArray(raw?.data)) data = raw.data;

      if (Array.isArray(data)) {
        setCrops(data);
      } else {
        setCrops(defaultData);
      }
    } catch (err) {
      console.warn("Failed to fetch crops:", err.message);
      setCrops(defaultData);
    }
    setLoading(false);
    setCurrentPage(1);
  };

  const handleDeleteCrop = async (id) => {
    if (!id) {
      alert("Cannot delete: no crop id available.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this crop entry?"))
      return;

    try {
      await axios.delete(`/newEntry/${id}`);
      setCrops((prev) => prev.filter((c) => c._id !== id));
      alert("Crop deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete crop");
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  // Search filtering (handle nested objects & plain fields)
  const filteredCrops = crops.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const varietyName =
      (c.variety && (c.variety.name || c.variety)) || c.varietyName || "";
    const groupName =
      (c.cropGroup && (c.cropGroup.name || c.cropGroup)) || c.groupName || "";

    return (
      varietyName.toString().toLowerCase().includes(q) ||
      groupName.toString().toLowerCase().includes(q) ||
      (c._id || "").toString().toLowerCase().includes(q)
    );
  });

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentCrops = filteredCrops.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCrops.length / rowsPerPage);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Crop Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + New Crop Entry
        </button>
      </div>

      <div className="p-4 shadow rounded-2xl">
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
            placeholder="Search crops..."
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
                <th className="p-2">Date</th>
                <th className="p-2">Group</th>
                <th className="p-2">Variety</th>
                <th className="p-2">Total Trays</th>
                <th className="p-2">Total Plants</th>
                <th className="p-2">Sowing Date</th>
                <th className="p-2">Total Man’s</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCrops.length > 0 ? (
                currentCrops.map((crop) => {
                  const groupName =
                    (crop.groupId && (crop.groupId.name || crop.groupId)) ||
                    crop.groupName ||
                    "—";

                  const varietyName =
                    (crop.varietyId &&
                      (crop.varietyId.name || crop.varietyId)) ||
                    crop.varietyName ||
                    "—";
                  return (
                    <tr key={crop._id}>
                      <td className="p-2">{formatDate(crop.date)}</td>
                      <td className="p-2">{groupName}</td>
                      <td className="p-2">{varietyName}</td>
                      <td className="p-2">{crop.totalTrays}</td>
                      <td className="p-2">{crop.totalPlants}</td>
                      <td className="p-2">{formatDate(crop.sowingDate)}</td>
                      <td className="p-2">{crop.totalMans}</td>
                      <td className="p-2">
                        <button
                          onClick={() => handleDeleteCrop(crop._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No crops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3">
          <p>
            Showing {filteredCrops.length === 0 ? 0 : indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filteredCrops.length)} of{" "}
            {filteredCrops.length} entries
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
          <NewPageModel
            onClose={() => setShowModal(false)}
            refreshData={fetchCrops}
          />
        )}
      </div>
    </div>
  );
}
