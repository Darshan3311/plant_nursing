import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

const BookingFormModal = ({ onClose, refreshData }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      bookingDate: new Date().toISOString().split("T")[0],
      advancePayment: 0,
      totalPayment: 0,
      pendingPayment: 0,
      finalTotalPrice: 0,
      vehicleNumber: "",
      driverName: "",
      startKm: 0,
      endKm: 0,
      farmerId: "",
      plotNumber: "",
      lotNumber: "",
      sowingDate: "",
      dispatchDate: "",
    },
  });

  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);

  const [activeTab, setActiveTab] = useState("crop-booking");
  const [selectedServices, setSelectedServices] = useState([]);
  const [currentCropGroup, setCurrentCropGroup] = useState("");

  const advance = watch("advancePayment");

  useEffect(() => {
    const total = selectedServices.reduce((sum, s) => sum + s.total, 0);
    setValue("totalPayment", total.toFixed(2));
    setValue("finalTotalPrice", total.toFixed(2));
    const adv = parseFloat(advance) || 0;
    const pending = Math.max(total - adv, 0);
    setValue("pendingPayment", pending.toFixed(2));
  }, [selectedServices, advance, setValue]);

  // fetch farmers on mount
  useEffect(() => {
    axios
      .get("/farmers")
      .then((res) => {
        setFarmers(res.data || []);
      })
      .catch((err) => {
        console.error("Error fetching farmers:", err);
      })
      .finally(() => {
        setLoadingFarmers(false);
      });
  }, []);

  // fetch crops on mount
  useEffect(() => {
    axios
      .get("/newEntry")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCrops(data);
          // If no crop group selected yet, choose the first
          if (!currentCropGroup) {
            setCurrentCropGroup(data[0].cropGroup);
          }
        } else {
          setCrops([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching crops:", err);
      })
      .finally(() => {
        setLoadingCrops(false);
      });
  }, []);

  // group the varieties by cropGroup
  const groupedVarieties = crops.reduce((acc, entry) => {
    const cg = entry.cropGroup;
    if (!cg) return acc;
    if (!acc[cg]) acc[cg] = [];
    (entry.varieties || []).forEach((v, idx) => {
      acc[cg].push({
        id: v._id || `${cg}-${v.variety}-${idx}`,
        name: v.variety,
        availableQty: v.quantity,
        defaultRate: 100,
      });
    });
    return acc;
  }, {});

  const onFarmerChange = (farmerId) => {
    const f = farmers.find((f) => f._id === farmerId);
    setSelectedFarmer(f || null);
  };

  const addToCart = (varietyId, varietyName, quantity, ratePerUnit) => {
    if (!quantity || quantity <= 0) {
      alert("Enter valid quantity");
      return;
    }
    if (!ratePerUnit || ratePerUnit <= 0) {
      alert("Enter valid rate");
      return;
    }
    const total = quantity * ratePerUnit;
    const existingIndex = selectedServices.findIndex((s) => s.id === varietyId);
    if (existingIndex === -1) {
      setSelectedServices((prev) => [
        ...prev,
        { id: varietyId, name: varietyName, quantity, ratePerUnit, total },
      ]);
    } else {
      setSelectedServices((prev) =>
        prev.map((s) =>
          s.id === varietyId ? { ...s, quantity, ratePerUnit, total } : s
        )
      );
    }
  };

  const removeFromCart = (varietyId) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== varietyId));
  };

  const onSubmit = async (formData) => {
    try {
      if (selectedServices.length === 0) {
        alert("Add at least one variety");
        return;
      }
      const total = selectedServices.reduce((sum, s) => sum + s.total, 0);
      const advancePay = parseFloat(formData.advancePayment) || 0;
      const pending = Math.max(total - advancePay, 0);

      const bookingData = {
        farmerId: formData.farmerId,
        plotNumber: formData.plotNumber,
        lotNumber: formData.lotNumber,
        bookingDate: formData.bookingDate,
        sowingDate: formData.sowingDate,
        cropGroup: currentCropGroup,
        varieties: selectedServices.map((s) => ({
          name: s.name,
          quantity: s.quantity,
          ratePerUnit: s.ratePerUnit,
          total: s.total,
        })),
        finalTotalPrice: total,
        totalPayment: total,
        advancePayment: advancePay,
        pendingPayment: pending,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        startKm: formData.startKm,
        endKm: formData.endKm,
      };

      await axios.post("/bookings/create", bookingData);
      alert("Booking saved successfully!");
      if (refreshData) await refreshData();
      onClose();
    } catch (err) {
      console.error("Error saving booking:", err);
      alert("Error saving booking: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 text-white p-5 text-center relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">
              <i className="fas fa-seedling mr-2"></i> Create New Booking
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              &times;
            </button>
          </div>
          <p className="opacity-90">Fill in the details for the new booking</p>
        </div>

        <div className="flex h-[70vh]">
          {/* Crop Groups Sidebar */}
          <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto border-r">
            <h2 className="text-lg font-semibold mb-4 text-green-700">
              Crop Groups
            </h2>
            {loadingCrops ? (
              <p>Loading crop groups...</p>
            ) : Object.keys(groupedVarieties).length > 0 ? (
              Object.keys(groupedVarieties).map((cg) => (
                <div
                  key={cg}
                  className={`p-3 mb-2 rounded-lg cursor-pointer flex items-center ${
                    currentCropGroup === cg
                      ? "bg-green-100 border-l-4 border-green-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentCropGroup(cg)}
                >
                  <span className="mr-2">{cg}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No crop groups available</p>
            )}
          </div>

          {/* Varieties Section */}
          <div className="w-1/3 p-4 overflow-y-auto border-r">
            <h2 className="text-lg font-semibold mb-4 text-green-700">
              Available Varieties
            </h2>
            {loadingCrops ? (
              <p>Loading crops...</p>
            ) : (groupedVarieties[currentCropGroup] || []).length > 0 ? (
              groupedVarieties[currentCropGroup].map((v) => (
                <div
                  key={v.id}
                  className="bg-white p-4 rounded-lg shadow-sm border my-2"
                >
                  <div className="font-medium text-green-700 mb-2">
                    {v.name}
                  </div>
                  <div className="flex items-center mb-2">
                    <label className="mr-2 text-sm">Quantity:</label>
                    <input
                      id={`${v.id}-qty`}
                      type="number"
                      placeholder="Qty"
                      className="w-20 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center mb-3">
                    <label className="mr-2 text-sm">Rate (₹):</label>
                    <input
                      id={`${v.id}-rate`}
                      type="number"
                      defaultValue={v.defaultRate}
                      className="w-24 p-1 border rounded text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700"
                    onClick={() => {
                      const qty = parseInt(
                        document.getElementById(`${v.id}-qty`).value
                      );
                      const rate = parseFloat(
                        document.getElementById(`${v.id}-rate`).value
                      );
                      addToCart(v.id, v.name, qty, rate);
                    }}
                  >
                    Add to Order
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                No varieties found for {currentCropGroup}
              </p>
            )}
          </div>

          {/* **Complete Form Section** */}
          <div className="w-2/5 p-4 overflow-y-auto">
            <div className="flex border-b mb-4">
              {["Crop Booking", "Delivery Info", "Payment"].map((tab) => {
                const tabId = tab.toLowerCase().replace(" ", "-");
                return (
                  <div
                    key={tabId}
                    className={`py-2 px-4 cursor-pointer ${
                      activeTab === tabId
                        ? "border-b-2 border-green-700 text-green-700 font-semibold"
                        : "text-gray-600 hover:text-green-700"
                    }`}
                    onClick={() => setActiveTab(tabId)}
                  >
                    {tab}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Crop Booking Tab */}
              {activeTab === "crop-booking" && (
                <>
                  <div>
                    <label
                      htmlFor="farmerId"
                      className="block mb-2 font-medium text-gray-700"
                    >
                      Select Farmer
                    </label>
                    <select
                      id="farmerId"
                      {...register("farmerId", {
                        required: "Farmer is required",
                      })}
                      onChange={(e) => onFarmerChange(e.target.value)}
                      className="w-full border p-3 rounded-lg"
                      disabled={loadingFarmers || farmers.length === 0}
                    >
                      <option value="">-- Select Farmer --</option>
                      {farmers.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.fullName} ({f.phone || "N/A"})
                        </option>
                      ))}
                    </select>
                    {selectedFarmer && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block mb-2 font-medium text-gray-700">
                            Farmer Name
                          </label>
                          <input
                            readOnly
                            value={selectedFarmer.fullName}
                            className="border p-3 rounded-lg bg-gray-100 w-full"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            readOnly
                            value={selectedFarmer.phone}
                            className="border p-3 rounded-lg bg-gray-100 w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor="bookingDate"
                        className="block mb-2 font-medium text-gray-700"
                      >
                        Booking Date
                      </label>
                      <input
                        id="bookingDate"
                        type="date"
                        {...register("bookingDate", {
                          required: "Booking date required",
                        })}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="plotNumber"
                        className="block mb-2 font-medium text-gray-700"
                      >
                        Plot Number
                      </label>
                      <input
                        id="plotNumber"
                        {...register("plotNumber", {
                          required: "Plot number required",
                        })}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lotNumber"
                        className="block mb-2 font-medium text-gray-700"
                      >
                        Lot Number
                      </label>
                      <input
                        id="lotNumber"
                        {...register("lotNumber", {
                          required: "lot number required",
                        })}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="sowingDate"
                        className="block mb-2 font-medium text-gray-700"
                      >
                        Sowing Date
                      </label>
                      <input
                        id="sowingDate"
                        type="date"
                        {...register("sowingDate")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="dispatchDate"
                        className="block mb-2 font-medium text-gray-700"
                      >
                        Dispatch Date
                      </label>
                      <input
                        id="dispatchDate"
                        type="date"
                        {...register("dispatchDate")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold mt-6 mb-3 text-green-700">
                    Selected Varieties
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                    {selectedServices.length === 0 ? (
                      <p className="text-gray-500 text-center">
                        No varieties selected yet
                      </p>
                    ) : (
                      selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center py-2 border-b"
                        >
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm">
                              Qty: {service.quantity} | Rate: ₹
                              {service.ratePerUnit} | Total: ₹
                              {service.total.toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeFromCart(service.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between py-1">
                      <span>Total Amount:</span>
                      <span>
                        ₹
                        {selectedServices
                          .reduce((sum, service) => sum + service.total, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Advance Payment:</span>
                      <span>₹{(advance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-semibold border-t mt-1 pt-2">
                      <span>Pending Payment:</span>
                      <span>
                        ₹
                        {(
                          selectedServices.reduce(
                            (sum, service) => sum + service.total,
                            0
                          ) -
                          (advance || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Delivery Info Tab */}
              {activeTab === "delivery-info" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 text-green-700">
                      Vehicle Details
                    </h3>
                    <div>
                      <label className="block mb-2">Driver Name</label>
                      <input
                        {...register("driverName")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                    <div className="block mb-2 mt-2">
                      <label className="block mb-2">Vehicle Number</label>
                      <input
                        {...register("vehicleNumber")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                   
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                      <label className="block mb-2">Start KM </label>
                        <input
                          type="number"
                          {...register("startKm")}
                          placeholder="Start KM"
                          className="border p-3 rounded-lg w-full"
                        />
                      </div>
                      <div>
                      <label className="block mb-2">End KM </label>
                        <input
                          type="number"
                          {...register("endKm")}
                          placeholder="End KM"
                          className="border p-3 rounded-lg w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === "payment" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 text-green-700">
                      Payment Details
                    </h3>

                    <div>
                      <label>Total Amount</label>
                      <input
                        {...register("totalPayment")}
                        readOnly
                        className="border p-3 rounded-lg w-full bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mt-2">Advance Payment</label>
                      <input
                        type="number"
                        {...register("advancePayment")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>

                    <div>
                      <label className="mt-2">Pending Payment</label>
                      <input
                        {...register("pendingPayment")}
                        readOnly
                        className="border p-3 rounded-lg w-full bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mt-2">Final Total Price</label>
                      <input
                        type="number"
                        {...register("finalTotalPrice")}
                        className="border p-3 rounded-lg w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                {activeTab !== "crop-booking" && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        activeTab === "payment" ? "delivery-info" : "crop-booking"
                      )
                    }
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Previous
                  </button>
                )}
                {activeTab !== "payment" && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        activeTab === "crop-booking" ? "delivery-info" : "payment"
                      )
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    Next <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                )}
              </div>

              {/* Submit */}
              {activeTab === "payment" && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Booking"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFormModal;
