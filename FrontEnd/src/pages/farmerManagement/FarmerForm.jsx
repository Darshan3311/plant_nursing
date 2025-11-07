import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

export default function FarmerForm({ onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post("/farmers", data, {
        withCredentials: true,
      });
      alert("Farmer saved successfully");
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving farmer:", error.response?.data || error);
      alert("Failed to save farmer");
    }
  };

  return (
    <div className="w-full bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">Add New Farmer</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Full Name *</label>
            <input
              type="text"
              {...register("fullName", { required: "Full name is required" })}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm">{errors.fullName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Phone *</label>
            <input
              type="tel"
              {...register("phone", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Enter a valid 10-digit phone number",
                },
              })}
              className="w-full border px-3 py-2 rounded"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div>
          <label className="block text-sm font-medium">
            Aadhaar Number (Optional)
          </label>
          <input
            type="text"
            {...register("aadhaar")}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Row 3 */}
        <div>
          <label className="block text-sm font-medium">Address *</label>
          <textarea
            {...register("address", { required: "Address is required" })}
            className="w-full border px-3 py-2 rounded"
          />
          {errors.address && (
            <p className="text-red-600 text-sm">{errors.address.message}</p>
          )}
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Pincode</label>
            <input
              type="text"
              {...register("pincode")}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vehicle Number</label>
            <input
              type="text"
              {...register("vehicleNumber")}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Driver Name</label>
            <input
            type="text"
            {...register("driverName")}
            className="w-full border px-3 py-2 rounded"
          />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {isSubmitting ? "Saving..." : "Save Farmer"}
          </button>
        </div>
      </form>
    </div>
  );
}
