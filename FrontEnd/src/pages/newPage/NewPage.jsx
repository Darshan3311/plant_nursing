import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import NewPageModel from "./NewPageModel";

export default function CropManagementPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCropId, setEditCropId] = useState(null);
  const [editVarieties, setEditVarieties] = useState([]);
  const [newVarietyName, setNewVarietyName] = useState("");
  const [newVarietyQty, setNewVarietyQty] = useState("");

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

  const openEditModal = (crop) => {
    setEditCropId(crop?._id);
    setEditVarieties(Array.isArray(crop?.varieties) ? [...crop.varieties] : []);
    setNewVarietyName("");
    setNewVarietyQty("");
    setShowEditModal(true);
  };

  const addVarietyToEdit = () => {
    const name = newVarietyName.trim();
    if (!name) return;
    const qtyVal = newVarietyQty === "" ? undefined : Number(newVarietyQty);
    const entry = qtyVal !== undefined && !isNaN(qtyVal)
      ? { variety: name, quantity: qtyVal }
      : { variety: name };
    setEditVarieties((prev) => [...prev, entry]);
    setNewVarietyName("");
    setNewVarietyQty("");
  };

  const removeVarietyFromEdit = (index) => {
    setEditVarieties((prev) => prev.filter((_, i) => i !== index));
  };

  const saveEditedVarieties = async () => {
    if (!editCropId) return;
    try {
      await axios.patch(`/newEntry/${editCropId}`, { varieties: editVarieties });
      await fetchCrops();
      setShowEditModal(false);
      setEditCropId(null);
      setEditVarieties([]);
    } catch (err) {
      console.error("Failed to update varieties:", err);
      alert("Failed to update varieties");
    }
  };

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const resp = await axios.get("/newEntry");
      const data = resp?.data;
      if (Array.isArray(data)) {
        setCrops(data);
      } else {
        setCrops([]);
      }
    } catch (err) {
      console.error("Failed to fetch crops:", err.message);
      setCrops([]);
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

  const filteredCrops = crops.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const varietyNames = (c.varieties || [])
      .map((v) => v.variety || "")
      .join(" ");
    const groupName = c.cropGroup || "";

    return (
      varietyNames.toLowerCase().includes(q) ||
      groupName.toLowerCase().includes(q) ||
      (c._id || "").toString().toLowerCase().includes(q)
    );
  });

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentCrops = filteredCrops.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredCrops.length / rowsPerPage);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div>
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

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg text-center">
            <thead className="border-collapse">
              <tr className="rounded-2xl bg-gray-100">
                <th className="p-2">Date</th>
                <th className="p-2">Group</th>
                <th className="p-2">Varieties (qty)</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCrops.length > 0 ? (
                currentCrops.map((crop) => {
                  const groupName = crop.cropGroup || "—";
                  const varietiesDisplay =
                    (crop.varieties || [])
                      .map((v) => `${v.variety}`)
                      .join(", ") || "—";

                  return (
                    <tr key={crop._id}>
                      <td className="p-2">{formatDate(crop.date)}</td>
                      <td className="p-2">{groupName}</td>
                      <td className="p-2">{varietiesDisplay}</td>
                      <td className="p-2">
                        <button
                          onClick={() => openEditModal(crop)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                        >
                          Edit
                        </button>
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
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No crops found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {/* <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick(() => setCurrentPage((p) => Math.min(totalPages, p + 1)))}
            >
              Next
            </button> */}
          </div>
        </div>

        {showModal && (
          <NewPageModel onClose={() => setShowModal(false)} refreshData={fetchCrops} />
        )}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Varieties</h3>
                <button
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={() => setShowEditModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {editVarieties.length === 0 ? (
                  <div className="text-gray-500">No varieties yet.</div>
                ) : (
                  editVarieties.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-semibold">{v.variety || v.name || `Variety ${idx + 1}`}</div>
                        {v.quantity !== undefined && (
                          <div className="text-sm text-gray-600">Qty: {v.quantity}</div>
                        )}
                      </div>
                      <button
                        className="text-red-600 hover:text-red-700 font-semibold"
                        onClick={() => removeVarietyFromEdit(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Variety Name</label>
                  <input
                    type="text"
                    className="w-full border rounded p-2"
                    placeholder="e.g., Lokwan"
                    value={newVarietyName}
                    onChange={(e) => setNewVarietyName(e.target.value)}
                  />
                </div>
                <div>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={addVarietyToEdit}
                  >
                    + Add Variety
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button className="px-4 py-2 border rounded" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={saveEditedVarieties}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
