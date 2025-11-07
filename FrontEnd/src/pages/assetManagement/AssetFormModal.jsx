import { useForm } from "react-hook-form";
import { useEffect } from "react"; // 1. IMPORT useEffect

// 2. ACCEPT the `initialData` prop to receive the item being edited
export default function AssetFormModal({ onClose, onSave, initialData }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    // It's good practice to keep defaultValues for clarity
    defaultValues: {
      name: "",
      type: "",
      purchaseDate: "",
      value: "",
      status: "available",
      description: "",
    },
  });

  // 3. ADD a useEffect to pre-fill the form when editing
  useEffect(() => {
    if (initialData) {
      // If we are editing, `initialData` will be the asset object
      // We format the date for the <input type="date"> element
      const formattedDate = initialData.purchaseDate
        ? new Date(initialData.purchaseDate).toISOString().split("T")[0]
        : "";
      
      // Use `reset` to populate the form with the existing asset's data
      reset({
        ...initialData,
        purchaseDate: formattedDate,
      });
    } else {
      // If we are adding, ensure the form is cleared to its default state
      reset();
    }
  }, [initialData, reset]); // This effect runs when the modal opens or data changes

  // 4. UPDATE the submit handler to distinguish between add and edit
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      value: Number(data.value),
    };

    // Only generate a new assetId if we are CREATING a new asset
    if (!initialData) {
      payload.assetId = `AS-${Math.floor(Math.random() * 900000) + 100000}`;
    }

    await onSave(payload);
    reset();
    onClose(); // close modal after saving
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          {/* 5. MAKE the title dynamic */}
          <h5 className="text-lg font-semibold">
            {initialData ? "Edit Asset" : "Add New Asset"}
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
            {/* Asset Name */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Asset Name</label>
              <input
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("name", { required: "Asset name is required" })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Asset Type */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Asset Type</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("type", { required: "Please select an asset type" })}
              >
                <option value="">Select Type</option>
                <option value="vehicle">Vehicle</option>
                <option value="equipment">Equipment</option>
                <option value="tool">Tool</option>
                <option value="container">Container</option>
                <option value="it">IT Equipment</option>
                <option value="building">Building</option>
                <option value="other">Other</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>

            {/* Purchase Date + Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  {...register("purchaseDate", {
                    required: "Purchase date is required",
                  })}
                />
                {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  {...register("value", {
                    required: "Value is required",
                    min: { value: 1, message: "Value must be greater than 0" },
                  })}
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
              </div>
            </div>

            {/* Status */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                {...register("status", { required: "Please select a status" })}
              >
                <option value="available">Available</option>
                <option value="inuse">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="disposed">Disposed</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
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
              className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
            >
              {/* 6. MAKE the button text dynamic */}
              {initialData ? "Update Asset" : "Save Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
