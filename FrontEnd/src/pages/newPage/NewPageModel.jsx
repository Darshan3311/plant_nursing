import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "../../lib/axios";

const NewPageModel = ({ onClose, refreshData }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      cropGroup: "",
      varieties: [{ variety: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "varieties",
  });

  // Reset form when modal opens
  useEffect(() => {
    reset({
      date: new Date().toISOString().split("T")[0],
      cropGroup: "",
      varieties: [{ variety: "" }],
    });
  }, [reset]);

  const onSubmit = async (formData) => {
    try {
      // validate at least one non-empty variety
      const validVarieties = (formData.varieties || []).filter(
        (v) => v && v.variety
      );
      if (!formData.cropGroup) {
        alert("Please enter a crop group.");
        return;
      }
      if (validVarieties.length === 0) {
        alert("Add at least one variety.");
        return;
      }

      const payload = {
        date: formData.date,
        cropGroup: formData.cropGroup,
        varieties: validVarieties.map((v) => ({
          variety: v.variety,
        })),
      };

      // ✅ Corrected API call (no duplicate /api)
      await axios.post("/newEntry", payload);

      alert("Crop record saved successfully!");
      if (refreshData) await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        "Error saving crop: " +
          (err?.response?.data?.message || err?.message || "Unknown error")
      );
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Crop Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block mb-1 font-medium">
                Date
              </label>
              <input
                id="date"
                type="date"
                {...register("date", { required: "Date is required" })}
                className="border p-2 rounded w-full"
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date.message}</p>
              )}
            </div>

            {/* Crop Group */}
            <div>
              <label htmlFor="cropGroup" className="block mb-1 font-medium">
                Crop Group
              </label>
              <input
                id="cropGroup"
                type="text"
                {...register("cropGroup", { required: "Group is required" })}
                placeholder="Enter crop group name"
                className="border p-2 rounded w-full"
              />
              {errors.cropGroup && (
                <p className="text-red-500 text-sm">
                  {errors.cropGroup.message}
                </p>
              )}
            </div>
          </div>

          {/* Varieties */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Varieties</h3>
              <div>
                <button
                  type="button"
                  onClick={() => append({ variety: "" })}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                >
                  + Add Variety
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-10">
                    <input
                      type="text"
                      {...register(`varieties.${index}.variety`, {
                        required: "Variety is required",
                      })}
                      placeholder="Variety name"
                      className="border p-2 rounded w-full"
                    />
                    {errors?.varieties?.[index]?.variety && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.varieties[index].variety.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
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
              {isSubmitting ? "Saving..." : "Save Crop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPageModel;

