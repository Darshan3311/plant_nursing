import { useForm } from "react-hook-form";
import { useEffect } from "react"; // 1. IMPORT useEffect

// 2. ACCEPT the `initialData` prop
export default function NutrientFormModal({ onClose, onSave, initialData }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      currentStock: "",
      unit: "kg",
      threshold: "",
      description: "",
    },
  });

  // 3. ADD useEffect to pre-fill the form when editing
  useEffect(() => {
    if (initialData) {
      // If editing, populate the form with the nutrient's data
      reset(initialData);
    } else {
      // If adding, ensure the form is clear
      reset();
    }
  }, [initialData, reset]);

  // 4. UPDATE the submit handler
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      currentStock: Number(data.currentStock),
      threshold: Number(data.threshold),
    };

    // Only set a new `lastUsed` date if it's a new nutrient entry
    if (!initialData) {
      payload.lastUsed = new Date().toISOString();
    }

    await onSave(payload);
    reset(); // Clear form after save
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          {/* 5. MAKE the title dynamic */}
          <h5 className="text-lg font-semibold">
            {initialData ? "Edit Nutrient" : "Add New Nutrient"}
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
            {/* Name */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Nutrient Name</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("name", { required: "Nutrient name is required" })}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Stock + Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  {...register("currentStock", {
                    required: "Current stock is required",
                  })}
                />
                {errors.currentStock && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.currentStock.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  {...register("unit", { required: true })}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  {/* <option value="l">Liters (l)</option> */}
                  <option value="ml">Milliliters (ml)</option>
                </select>
              </div>
            </div>

            {/* Threshold */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("threshold", {
                  required: "Low stock threshold is required",
                })}
              />
              {errors.threshold && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.threshold.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                rows={2}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("description")}
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
            >
              {/* 6. MAKE the button text dynamic */}
              {initialData ? "Update Nutrient" : "Save Nutrient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
