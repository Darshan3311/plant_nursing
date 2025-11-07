import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import AssetFormModal from "./AssetFormModal";
import NutrientFormModal from "./NutrientFormModal";
import StockFormModal from "./StockFormModal";
import CropFormModal from "./CropFromModel";

export default function AssetManagementPage() {
  const [activeTab, setActiveTab] = useState("equipment");
  const [loading, setLoading] = useState(true);

  const [equipment, setEquipment] = useState([]);
  const [nutrients, setNutrients] = useState([]);
  const [otherAssets, setOtherAssets] = useState([]);
  const [stock, setStock] = useState([]);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showNutrientModal, setShowNutrientModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false); 

  // Editing state
  const [editingItem, setEditingItem] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);

  // Search/filter
  const [search, setSearch] = useState("");
  const [nutrientSearch, setNutrientSearch] = useState("");
  const [otherSearch, setOtherSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");

  // Row limiter & Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eqRes, nuRes, otherRes, stRes] = await Promise.all([
        axios.get("assets/assets?category=equipment"),
        axios.get("assets/nutrients"),
        axios.get("assets/assets?category=other"),
        axios.get("assets/stock"),
      ]);
      const norm = (r) => (r?.data && Array.isArray(r.data) ? r.data : []);
      setEquipment(norm(eqRes));
      setNutrients(norm(nuRes));
      setOtherAssets(norm(otherRes));
      setStock(norm(stRes));
    } catch (err) {
      console.warn(
        "Failed to fetch one or more endpoints:",
        err?.message || err
      );
      setEquipment([]);
      setNutrients([]);
      setOtherAssets([]);
      setStock([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- CRUD HANDLERS ---

  // ASSET HANDLERS
  const handleAddAsset = async (asset) => {
    try {
      const res = await axios.post("/assets/asset", asset);
      setEquipment((prev) => [res.data, ...prev]);
      setShowAssetModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAsset = async (asset) => {
    try {
      const res = await axios.put(`/assets/asset/${editingItem._id}`, asset);
      setEquipment((prev) =>
        prev.map((item) => (item._id === editingItem._id ? res.data : item))
      );
      setShowAssetModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        await axios.delete(`/assets/asset/${id}`);
        setEquipment((prev) => prev.filter((item) => item._id !== id));
        setOtherAssets((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error("Failed to delete asset", err);
      }
    }
  };

  // NUTRIENT HANDLERS
  const handleAddNutrient = async (nutrient) => {
    try {
      const res = await axios.post("/assets/nutrient", nutrient);
      setNutrients((prev) => [res.data, ...prev]);
      setShowNutrientModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNutrient = async (nutrient) => {
    try {
      const res = await axios.put(
        `/assets/nutrient/${editingItem._id}`,
        nutrient
      );
      setNutrients((prev) =>
        prev.map((item) => (item._id === editingItem._id ? res.data : item))
      );
      setShowNutrientModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNutrient = async (id) => {
    if (window.confirm("Are you sure you want to delete this nutrient?")) {
      try {
        await axios.delete(`/assets/nutrient/${id}`);
        setNutrients((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error("Failed to delete nutrient", err);
      }
    }
  };

  // STOCK HANDLERS
  const handleAddStock = async (st) => {
    try {
      await axios.post("/assets/stock", st);
      fetchAll();
      setShowStockModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (st) => {
    try {
      const res = await axios.put(`/assets/stock/${editingItem._id}`, st);
      setStock((prev) =>
        prev.map((item) => (item._id === editingItem._id ? res.data : item))
      );
      setShowStockModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStock = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock item?")) {
      try {
        await axios.delete(`/assets/stock/${id}`);
        setStock((prev) => prev.filter((item) => item._id !== id));
      } catch (err) {
        console.error("Failed to delete stock item", err);
      }
    }
  };
    // --- Crop handlers ---
  const handleAddCrop = async (payload) => {
    // payload shape expected from CropFormModal:
    // { mode: 'group' | 'variety' | 'both', groupName?, groupId?, varietyName?, defaultUnit?, sku? }
    try {
      if (payload.mode === "group") {
        // add group
        const res = await axios.post("/crops/addgroups", { name: payload.groupName });
        // optionally notify / update UI
        console.log("Group created:", res.data);
      } else if (payload.mode === "variety") {
        // add variety to existing group
        const res = await axios.post("/crops/addvarieties", {
          groupId: payload.groupId,
          name: payload.varietyName,
          defaultUnit: payload.defaultUnit || "seed",
          sku: payload.sku || undefined,
        });
        console.log("Variety created:", res.data);
      } else if (payload.mode === "both") {
        // create group, then variety
        const gRes = await axios.post("/crops/addgroups", { name: payload.groupName });
        const groupId = gRes.data._id || gRes.data.id;
        const vRes = await axios.post("/crops/addvarieties", {
          group: groupId,
          name: payload.varietyName,
          defaultUnit: payload.defaultUnit || "seed",
          sku: payload.sku || undefined,
        });
        console.log("Group + Variety created:", gRes.data, vRes.data);
      }
      // after success, refresh lists that might depend on crops (stock tab uses variety/group)
      fetchAll();
      setShowCropModal(false);
      setEditingCrop(null);
    } catch (err) {
      console.error("Failed to add crop/group/variety", err?.response?.data || err.message || err);
      // user feedback
      alert("Failed to save. See console for details.");
    }
  };

  const handleUpdateCrop = async (payload) => {
    // placeholder if you later support edit of crop group/variety
    // you can implement PUT /api/crop-groups/:id or /api/crop-varieties/:id
    console.log("handleUpdateCrop not implemented yet", payload);
  };

  const handleDeleteCrop = async (id, type = "group") => {
    if (!window.confirm("Delete this item?")) return;
    try {
      if (type === "group") {
        await axios.delete(`/api/crop-groups/${id}`);
      } else {
        await axios.delete(`/api/crop-varieties/${id}`);
      }
      fetchAll();
    } catch (err) {
      console.error("Failed to delete crop item", err);
    }
  };

  // Helper functions
  const formatDate = (d) => {
    if (!d) return "—";
    try {
      const date = new Date(d);
      return isNaN(date) ? d : date.toLocaleDateString();
    } catch {
      return d;
    }
  };

  const renderStatus = (st) => {
    const s = (st || "").toLowerCase();
    const map = {
      available: "bg-green-600 text-white",
      inuse: "bg-blue-600 text-white",
      maintenance: "bg-yellow-600 text-white",
      disposed: "bg-red-600 text-white",
    };
    const cls = map[s] || "bg-gray-300 text-gray-800";
    const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
    return (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-medium ${cls}`}
      >
        {label}
      </span>
    );
  };

  // --- Filtering and Pagination Logic ---
  const getPaginatedData = (data) => {
    const indexOfLast = currentPage * rowsPerPage;
    const indexOfFirst = indexOfLast - rowsPerPage;
    const currentItems = data.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(data.length / rowsPerPage);
    return { currentItems, totalPages, indexOfFirst, indexOfLast };
  };

  const filteredEquipment = equipment.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return ["name", "assetId", "type"].some((prop) =>
      (e[prop] || "").toLowerCase().includes(q)
    );
  });
  const equipmentPagination = getPaginatedData(filteredEquipment);

  const filteredNutrients = nutrients.filter((n) =>
    (n.name || "").toLowerCase().includes(nutrientSearch.trim().toLowerCase())
  );
  const nutrientPagination = getPaginatedData(filteredNutrients);

  const filteredOther = otherAssets.filter((e) => {
    const q = otherSearch.trim().toLowerCase();
    if (!q) return true;
    return ["name", "assetId", "type"].some((prop) =>
      (e[prop] || "").toLowerCase().includes(q)
    );
  });
  const otherAssetsPagination = getPaginatedData(filteredOther);

  const filteredStock = stock.filter((s) => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.variety?.group?.name || "").toLowerCase().includes(q) ||
      (s.variety?.name || "").toLowerCase().includes(q)
    );
  });
  const stockPagination = getPaginatedData(filteredStock);

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  const PaginationControls = ({ data, pagination }) => (
    <div className="flex justify-between items-center mt-4">
      <p className="text-sm text-gray-700">
        Showing {data.length === 0 ? 0 : pagination.indexOfFirst + 1} to{" "}
        {Math.min(pagination.indexOfLast, data.length)} of {data.length} entries
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
          disabled={
            currentPage === pagination.totalPages || pagination.totalPages === 0
          }
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Asset Management</h1>
        <div className="flex gap-3">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => {
              setEditingItem(null);
              setShowAssetModal(true);
            }}
          >
            + Add Asset
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => {
              setEditingItem(null);
              setShowNutrientModal(true);
            }}
          >
            + Add Nutrient
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => {
              setEditingItem(null);
              setShowStockModal(true);
            }}
          >
            + Add Stock
          </button>
           <button
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg shadow"
            onClick={() => {
              setEditingCrop(null);
              setShowCropModal(true);
            }}
          >
            + Add Crop
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-2xl">
        {/* Tabs */}
        <div className="mb-5 flex gap-3">
          {["equipment", "nutrients", "other", "stock"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1); // Reset page on tab change
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Common Controls: Row Limiter */}
        <div className="mb-4">
          <label className="text-sm text-gray-700">
            Show
            <select
              className="border mx-2 p-1 rounded"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
            >
              {[5, 10, 25, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            entries
          </label>
        </div>

        {/* Equipment Tab */}
        {activeTab === "equipment" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Equipment Inventory</h3>
              <input
                type="text"
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3">Asset ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentPagination.currentItems.length > 0 ? (
                    equipmentPagination.currentItems.map((e) => (
                      <tr key={e._id} className="hover:bg-gray-50">
                        <td className="p-3 align-top">{e.assetId || "—"}</td>
                        <td className="p-3 align-top">{e.name || "—"}</td>
                        <td className="p-3 align-top">{e.type || "—"}</td>
                        <td className="p-3 align-top">
                          {formatDate(e.purchaseDate)}
                        </td>
                        <td className="p-3 align-top">₹{e.value ?? "—"}</td>
                        <td className="p-3 align-top">
                          {renderStatus(e.status)}
                        </td>
                        <td className="p-3 align-top flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(e);
                              setShowAssetModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(e._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No equipment found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              data={filteredEquipment}
              pagination={equipmentPagination}
            />
          </div>
        )}

        {/* Nutrients Tab */}
        {activeTab === "nutrients" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nutrient Details</h3>
              <input
                type="text"
                placeholder="Search nutrients..."
                value={nutrientSearch}
                onChange={(e) => {
                  setNutrientSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3">Nutrient</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Threshold</th>
                    <th className="p-3">Last Used</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nutrientPagination.currentItems.length > 0 ? (
                    nutrientPagination.currentItems.map((n) => (
                      <tr key={n._id} className="hover:bg-gray-50">
                        <td className="p-3 align-top">{n.name}</td>
                        <td className="p-3 align-top">
                          {n.currentStock} {n.unit}
                        </td>
                        <td className="p-3 align-top">
                          {n.threshold} {n.unit}
                        </td>
                        <td className="p-3 align-top">
                          {formatDate(n.lastUsed)}
                        </td>
                        <td className="p-3 align-top">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              n.currentStock <= n.threshold
                                ? "bg-yellow-500 text-white"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {n.currentStock <= n.threshold ? "Low" : "In Stock"}
                          </span>
                        </td>
                        <td className="p-3 align-top flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(n);
                              setShowNutrientModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteNutrient(n._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No nutrients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              data={filteredNutrients}
              pagination={nutrientPagination}
            />
          </div>
        )}

        {/* Other Assets Tab */}
        {activeTab === "other" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Other Assets</h3>
              <input
                type="text"
                placeholder="Search other assets..."
                value={otherSearch}
                onChange={(e) => {
                  setOtherSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3">Asset ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otherAssetsPagination.currentItems.length > 0 ? (
                    otherAssetsPagination.currentItems.map((e) => (
                      <tr key={e._id} className="hover:bg-gray-50">
                        <td className="p-3 align-top">{e.assetId || "—"}</td>
                        <td className="p-3 align-top">{e.name || "—"}</td>
                        <td className="p-3 align-top">{e.type || "—"}</td>
                        <td className="p-3 align-top">
                          {formatDate(e.purchaseDate)}
                        </td>
                        <td className="p-3 align-top">₹{e.value ?? "—"}</td>
                        <td className="p-3 align-top">
                          {renderStatus(e.status)}
                        </td>
                        <td className="p-3 align-top flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(e);
                              setShowAssetModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(e._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No other assets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              data={filteredOther}
              pagination={otherAssetsPagination}
            />
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === "stock" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Stock Inventory</h3>
              <input
                type="text"
                placeholder="Search stock..."
                value={stockSearch}
                onChange={(e) => {
                  setStockSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3">Crop Group</th>
                    <th className="p-3">Variety</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Added On</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPagination.currentItems.length > 0 ? (
                    stockPagination.currentItems.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="p-3">{s.variety?.group?.name || "—"}</td>
                        <td className="p-3">{s.variety?.name || "—"}</td>
                        <td className="p-3">{s.quantity ?? "—"}</td>
                        <td className="p-3">
                          {s.unit || s.variety?.defaultUnit || "kg"}
                        </td>
                        <td className="p-3">
                          {formatDate(s.createdAt || s.addedOn)}
                        </td>
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(s);
                              setShowStockModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStock(s._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No stock found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              data={filteredStock}
              pagination={stockPagination}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssetModal && (
        <AssetFormModal
          initialData={editingItem}
          onClose={() => {
            setShowAssetModal(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateAsset : handleAddAsset}
        />
      )}
      {showNutrientModal && (
        <NutrientFormModal
          initialData={editingItem}
          onClose={() => {
            setShowNutrientModal(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateNutrient : handleAddNutrient}
        />
      )}
      {showStockModal && (
        <StockFormModal
          initialData={editingItem}
          onClose={() => {
            setShowStockModal(false);
            setEditingItem(null);
          }}
          onSave={editingItem ? handleUpdateStock : handleAddStock}
        />
      )}
      {showCropModal && (
        <CropFormModal
          initialData={editingCrop}
          onClose={() => {
            setShowCropModal(false);
            setEditingCrop(null);
          }}
          onSave={editingCrop ? handleUpdateCrop : handleAddCrop}
        />
      )}
    </div>
  );
}
