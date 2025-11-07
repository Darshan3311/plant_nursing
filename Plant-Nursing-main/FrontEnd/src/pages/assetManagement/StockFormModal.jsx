import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios from "../../lib/axios";

export default function StockFormModal({ onClose, onSave, initialData }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      cropGroup: "",
      variety: "",
      quantity: "",
      lowerLimit: "",
    },
  });

  const [cropGroups, setCropGroups] = useState([]);
  const [varieties, setVarieties] = useState([]);

  const selectedCropGroup = watch("cropGroup");

  // Fetch crop groups on component mount
  useEffect(() => {
    axios
      .get("/assets/stock/crop-groups")
      .then((res) => setCropGroups(res.data));
  }, []);

  // Fetch varieties when a crop group is selected (for ADD mode)
  useEffect(() => {
    if (!selectedCropGroup || initialData) {
      setVarieties([]);
      return;
    }
    axios
      .get("/assets/stock/varieties", {
        params: { cropGroup: selectedCropGroup },
      })
      .then((res) => setVarieties(res.data));
  }, [selectedCropGroup, initialData]);

  // Main effect to handle pre-filling data for editing
  useEffect(() => {
    // THIS IS THE FIX: Only run when initialData AND cropGroups are ready.
    if (initialData && cropGroups.length > 0) {
      const groupId = initialData.variety?.group?._id;
      const varietyId = initialData.variety?._id;

      // 1. Pre-fill the form fields
      reset({
        cropGroup: groupId,
        variety: varietyId,
        quantity: initialData.quantity,
        lowerLimit: initialData.lowerLimit,
      });

      // 2. If a group ID exists, fetch its varieties so the dropdown
      //    can display the correct name even when disabled.
      if (groupId) {
        axios
          .get("/assets/stock/varieties", {
            params: { cropGroup: groupId },
          })
          .then((res) => {
            setVarieties(res.data);
            // After varieties are loaded, ensure the correct one is selected.
            setValue("variety", varietyId);
          });
      }
    } else if (!initialData) {
      // Clear form for "Add New" mode
      reset();
    }
  }, [initialData, cropGroups, reset, setValue]); // ADDED `cropGroups` to dependency array

  // Updated submit handler
  const onSubmit = async (data) => {
    const payload = {
      quantity: Number(data.quantity),
      lowerLimit: Number(data.lowerLimit),
    };

    if (!initialData) {
      // For new stock, send the varietyId
      payload.varietyId = data.variety;
      payload.unit = "seed"; // Or get from form if you have a unit field
    }

    await onSave(payload);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h5 className="text-lg font-semibold">
            {initialData ? "Edit Stock" : "Add New Stock"}
          </h5>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
            {/* Crop Group Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Crop Group
              </label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 disabled:bg-gray-100"
                {...register("cropGroup", {
                  required: "Please select a crop group",
                })}
                disabled={!!initialData}
              >
                <option value="">Select Crop Group</option>
                {cropGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.cropGroup && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cropGroup.message}
                </p>
              )}
            </div>

            {/* Variety Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Variety</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 disabled:bg-gray-100"
                {...register("variety", {
                  required: "Please select a variety",
                })}
                disabled={!!initialData}
              >
                <option value="">Select Variety</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.variety && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.variety.message}
                </p>
              )}
            </div>

            {/* Quantity and Lower Limit fields remain the same */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 0.01, message: "Must be greater than 0" },
                })}
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Lower Limit
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2"
                {...register("lowerLimit", {
                  required: "Lower limit is required",
                  min: { value: 0, message: "Must be 0 or greater" },
                })}
              />
              {errors.lowerLimit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lowerLimit.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
            >
              {initialData ? "Update Stock" : "Save Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
