import { useEffect, useState } from "react";
import axios from "../../lib/axios";
import FarmerForm from "./FarmerForm";

export default function FarmerManagement() {
  const [farmers, setFarmers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewFarmer, setViewFarmer] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch farmers from backend
  const fetchFarmers = async () => {
    try {
      const res = await axios.get("/farmers/all-farmers", { withCredentials: true });
      setFarmers(res.data.data);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  // View single farmer details
  const handleViewFarmer = async (id) => {
    setLoadingView(true);
    try {
      const res = await axios.get(`/farmers/${id}`, { withCredentials: true });
      setViewFarmer(res.data.data);
    } catch (error) {
      console.error("Error fetching farmer:", error);
    }
    setLoadingView(false);
  };

  const handleUpdateFarmer = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/farmers/${editFarmer._id}`, editFarmer, { withCredentials: true });
      setShowEditModal(false);
      fetchFarmers();
    } catch (error) {
      console.error("Error updating farmer:", error);
    }
  };

  // Delete farmer
  const handleDeleteFarmer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this farmer?")) return;
    try {
      await axios.delete(`/farmers/${id}`);
      setFarmers((prev) => prev.filter((farmer) => farmer._id !== id));
    } catch (error) {
      console.error("Error deleting farmer:", error);
      alert("Failed to delete farmer");
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  // Filter & paginate data
  const filteredFarmers = farmers.filter((f) =>
    f.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentFarmers = filteredFarmers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredFarmers.length / rowsPerPage);

  return (
    <div className="p-6 ">
      {/* Header */}
      <div className="flex  justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Farmer Management</h1>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => setShowForm(true)}
        >
          Add Farmer
        </button>
      </div>
<div className="bg-gray-50 p-4 rounded-lg shadow-xl">
      {/* Search & Row limiter */}
      <div className="flex justify-between items-center mb-3">
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
          placeholder="Search farmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      {/* Farmers Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 ">Name</th>
              <th className="p-3 ">Phone</th>
              <th className="p-3 ">Address</th>
              <th className="p-3 ">Vehicle No</th>
              <th className="p-3 ">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentFarmers.length > 0 ? (
              currentFarmers.map((farmer) => (
                <tr key={farmer._id} className="text-center">
                  <td className="p-3 ">{farmer.fullName}</td>
                  <td className="p-3 ">{farmer.phone}</td>
                  <td className="p-3 ">{farmer.address}</td>
                  <td className="p-3 ">{farmer.vehicleNumber || "N/A"}</td>
                  <td className="p-3 space-x-2">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleViewFarmer(farmer._id)}
                    >
                      👁
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={() => {
                        setEditFarmer(farmer);
                        setShowEditModal(true);
                      }}
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => handleDeleteFarmer(farmer._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-gray-500">
                  No farmers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-3">
        <p>
          Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredFarmers.length)} of {filteredFarmers.length} entries
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
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

     {/* Add Farmer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              &times;
            </button>
            <FarmerForm
              onSuccess={() => {
                fetchFarmers();
                setShowForm(false);
              }}
            />
          </div>
        </div>
      )}

      {/* View Farmer Modal */}
      {viewFarmer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={() => setViewFarmer(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            {loadingView ? (
              <p className="text-center">Loading...</p>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {viewFarmer.fullName}
                </h2>
                <p>
                  <strong>Phone:</strong> {viewFarmer.phone}
                </p>
                <p>
                  <strong>Address:</strong> {viewFarmer.address}
                </p>
                <p>
                  <strong>Aadhaar:</strong> {viewFarmer.aadhaarNumber || "N/A"}
                </p>
                <p>
                  <strong>Vehicle No:</strong>{" "}
                  {viewFarmer.vehicleNumber || "N/A"}
                </p>
                <p>
                  <strong>Driver Name:</strong> {viewFarmer.driverName || "N/A"}
                </p>
                <p>
                  <strong>Pincode:</strong> {viewFarmer.pincode || "N/A"}
                </p>
              </>
            )}
          </div>
        </div>
      )}
      {showEditModal && editFarmer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Update Farmer</h2>
            <form onSubmit={handleUpdateFarmer}>
              <input
                type="text"
                value={editFarmer.fullName}
                onChange={(e) =>
                  setEditFarmer({
                    ...editFarmer,
                    fullName: e.target.value,
                  })
                }
                className="border w-full p-2 rounded mb-3"
              />
              <input
                type="text"
                value={editFarmer.phone}
                onChange={(e) =>
                  setEditFarmer({ ...editFarmer, phone: e.target.value })
                }
                className="border w-full p-2 rounded mb-3"
              />
              {/* Add other fields here */}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-400 rounded text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 rounded text-white hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
