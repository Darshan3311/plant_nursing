import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

const BookingFormModal = ({ onClose, refreshData }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      bookingDate: new Date().toISOString().split("T")[0],
      quantity: 0,
      ratePerUnit: 0,
      advancePayment: 0,
      totalPayment: 0,
      pendingPayment: 0,
      finalTotalPrice: 0,
      vehicleNumber: "",
      driverName: "",
      startKm: 0,
      endKm: 0,
    },
  });

  const [farmers, setFarmers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const advance = watch("advancePayment");
  const total = watch("totalPayment");
  const selectedGroup = watch("cropGroup");
  const quantity = watch("quantity");
  const ratePerUnit = watch("ratePerUnit");

  // Pending calculation
  useEffect(() => {
    const pending = (Number(total) || 0) - (Number(advance) || 0);
    setValue("pendingPayment", pending >= 0 ? pending : 0);
  }, [advance, total, setValue]);

  // Auto-calc total payment
  useEffect(() => {
    const t = (Number(quantity) || 0) * (Number(ratePerUnit) || 0);
    setValue("totalPayment", t);
  }, [quantity, ratePerUnit, setValue]);

  // Fetch farmers & groups on mount
  useEffect(() => {
    axios
      .get("/farmers")
      .then((res) => setFarmers(res.data || []))
      .catch(() => alert("Error fetching farmers"))
      .finally(() => setLoadingFarmers(false));

    axios
      .get("/crops/groups")
      .then((res) => setGroups(res.data || []))
      .catch(() => alert("Error fetching crop groups"))
      .finally(() => setLoadingGroups(false));
  }, []);

  // Fetch varieties when group changes
  useEffect(() => {
    if (selectedGroup) {
      axios
        .get(`/crops/varieties/${selectedGroup}`)
        .then((res) => setVarieties(res.data || []))
        .catch(() => {
          setVarieties([]);
        });
    } else {
      setVarieties([]);
    }
  }, [selectedGroup]);

  const onFarmerChange = (id) => {
    const farmer = farmers.find((f) => f._id === id);
    setSelectedFarmer(farmer || null);
  };

  // Reset form for creation (always create mode)
  useEffect(() => {
    reset({
      bookingDate: new Date().toISOString().split("T")[0],
      quantity: "",
      ratePerUnit: "",
      advancePayment: 0,
      totalPayment: 0,
      pendingPayment: 0,
      finalTotalPrice: 0,
      cropGroup: "",
      variety: "",
      plotNumber: "",
      sowingDate: "",
      dispatchDate: "",
      farmerId: "",
      // vehicle fields defaults
      vehicleNumber: "",
      driverName: "",
      startKm: 0,
      endKm: 0,
    });
    setSelectedFarmer(null);
    setVarieties([]);
  }, [reset]);

  const onSubmit = async (formData) => {
    try {
      // Create new booking
      await axios.post("/bookings/create", formData);
      alert("Booking saved successfully!");

      // refresh parent page data and close modal
      if (refreshData) await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving booking: " + (err?.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Farmer Selection (always shown for create) */}
          <div>
            <label htmlFor="farmerId" className="block mb-1 font-medium">
              Select Farmer
            </label>
            <select
              id="farmerId"
              {...register("farmerId", { required: "Farmer is required" })}
              onChange={(e) => {
                setValue("farmerId", e.target.value);
                onFarmerChange(e.target.value);
              }}
              className="w-full border p-2 rounded"
              disabled={loadingFarmers}
            >
              <option value="">-- Select --</option>
              {farmers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.fullName}
                </option>
              ))}
            </select>
            {errors.farmerId && (
              <p className="text-red-500 text-sm">{errors.farmerId.message}</p>
            )}

            {selectedFarmer && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block mb-1 font-medium">Farmer Name</label>
                  <input
                    readOnly
                    value={selectedFarmer.fullName}
                    className="border p-2 rounded bg-gray-100 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Phone</label>
                  <input
                    readOnly
                    value={selectedFarmer.phone}
                    className="border p-2 rounded bg-gray-100 w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Crop Booking Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bookingDate" className="block mb-1 font-medium">
                Booking Date
              </label>
              <input
                id="bookingDate"
                type="date"
                {...register("bookingDate")}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label htmlFor="cropGroup" className="block mb-1 font-medium">
                Crop Group
              </label>
              <select
                id="cropGroup"
                {...register("cropGroup", {
                  required: "Crop group is required",
                })}
                className="border p-2 rounded w-full"
                disabled={loadingGroups}
              >
                <option value="">-- Select Group --</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.cropGroup && (
                <p className="text-red-500 text-sm">
                  {errors.cropGroup.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="variety" className="block mb-1 font-medium">
                Variety
              </label>
              <select
                id="variety"
                {...register("variety", { required: "Variety is required" })}
                className="border p-2 rounded w-full"
              >
                <option value="">-- Select Variety --</option>
                {varieties.map((v) => (
                  <option key={v._id || v.name} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.variety && (
                <p className="text-red-500 text-sm">{errors.variety.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block mb-1 font-medium">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: 1,
                })}
                className="border p-2 rounded w-full"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ratePerUnit" className="block mb-1 font-medium">
                Rate Per Unit
              </label>
              <input
                id="ratePerUnit"
                type="number"
                {...register("ratePerUnit", {
                  required: "Rate per unit is required",
                  min: 1,
                })}
                className="border p-2 rounded w-full"
              />
              {errors.ratePerUnit && (
                <p className="text-red-500 text-sm">
                  {errors.ratePerUnit.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="plotNumber" className="block mb-1 font-medium">
                Plot Number
              </label>
              <input
                id="plotNumber"
                {...register("plotNumber")}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label htmlFor="sowingDate" className="block mb-1 font-medium">
                Sowing Date
              </label>
              <input
                id="sowingDate"
                type="date"
                {...register("sowingDate")}
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label htmlFor="dispatchDate" className="block mb-1 font-medium">
                Dispatch Date
              </label>
              <input
                id="dispatchDate"
                type="date"
                {...register("dispatchDate")}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>

          {/* Vehicle Details (optional) */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Vehicle Details (optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="vehicleNumber"
                  className="block mb-1 font-medium"
                >
                  Vehicle Number
                </label>
                <input
                  id="vehicleNumber"
                  {...register("vehicleNumber")}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label htmlFor="driverName" className="block mb-1 font-medium">
                  Driver Name
                </label>
                <input
                  id="driverName"
                  type="text"
                  {...register("driverName")}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label htmlFor="startKm" className="block mb-1 font-medium">
                  Start KM
                </label>
                <input
                  id="startKm"
                  type="number"
                  {...register("startKm", { min: 0 })}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label htmlFor="endKm" className="block mb-1 font-medium">
                  End KM
                </label>
                <input
                  id="endKm"
                  type="number"
                  {...register("endKm", { min: 0 })}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="advancePayment"
                  className="block mb-1 font-medium"
                >
                  Advance Payment
                </label>
                <input
                  id="advancePayment"
                  type="number"
                  {...register("advancePayment")}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="totalPayment"
                  className="block mb-1 font-medium"
                >
                  Total Payment
                </label>
                <input
                  id="totalPayment"
                  type="number"
                  {...register("totalPayment")}
                  readOnly
                  className="border p-2 rounded w-full bg-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="pendingPayment"
                  className="block mb-1 font-medium"
                >
                  Pending Payment
                </label>
                <input
                  id="pendingPayment"
                  type="number"
                  {...register("pendingPayment")}
                  readOnly
                  className="border p-2 rounded w-full bg-gray-100"
                />
              </div>
              {/* Final Total Price */}
              <div>
                <label
                  htmlFor="finalTotalPrice"
                  className="block mb-1 font-medium"
                >
                  Final Total Price
                </label>
                <input
                  id="finalTotalPrice"
                  type="number"
                  step="0.01" // ✅ allow decimal here too
                  {...register("finalTotalPrice", {
                    required: "Final total price is required", // ✅ not empty
                    min: {
                      value: 0.01,
                      message: "Final total must be greater than 0",
                    },
                  })}
                  className="border p-2 rounded w-full"
                />
                {errors.finalTotalPrice && (
                  <p className="text-red-500 text-sm">
                    {errors.finalTotalPrice.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
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
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
