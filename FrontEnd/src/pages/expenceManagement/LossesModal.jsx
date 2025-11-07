import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

export default function LossesModal({
  isOpen,
  onClose,
  onSave,
  defaultValues = {},
}) {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      group: defaultValues.group || "",
      variety: defaultValues.variety || "",
      date: defaultValues.date || "",
      value: defaultValues.value || 0,
      description: defaultValues.description || "",
    },
  });

  const [options1, setOptions1] = useState([]); // crop groups
  const [options2, setOptions2] = useState([]); // crop varieties

  const selectedGroup = watch("group");

  // ✅ Fetch crop groups when modal opens
  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await axios.get("/crops/groups");
        setOptions1(res.data || []);
      } catch (err) {
        console.error("Error fetching crop groups:", err);
      }
    }
    if (isOpen) fetchGroups();
  }, [isOpen]);

  // ✅ Fetch varieties whenever group changes
  useEffect(() => {
    async function fetchVarieties(groupId) {
      if (!groupId) {
        setOptions2([]);
        return;
      }
      try {
        const res = await axios.get(`/crops/varieties/${groupId}`);
        setOptions2(res.data || []);
      } catch (err) {
        console.error("Error fetching varieties:", err);
      }
    }
    fetchVarieties(selectedGroup);
  }, [selectedGroup]);

  // ✅ Reset form only when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        group: defaultValues.group || "",
        variety: defaultValues.variety || "",
        date: defaultValues.date || "",
        value: defaultValues.value || 0,
        description: defaultValues.description || "",
      });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const submit = (data) => {
    const out = {
      ...data,
      status: data.status ? "Done" : "Pending",
    };
    onSave && onSave(out);
    onClose && onClose();
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Loss</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 rounded p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit(submit)}>
          <div className="grid gap-3">
            {/* Group dropdown */}
            <div>
              <label className="block text-sm mb-1">Crop Group</label>
              <select
                {...register("group")}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">-- Select Group --</option>
                {options1.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Varieties dropdown */}
            <div>
              <label className="block text-sm mb-1">Variety</label>
              <select
                {...register("variety")}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">-- Select Variety --</option>
                {options2.map((opt) => (
                  <option key={opt._id} value={opt._id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input
                type="date"
                {...register("date")}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            {/* value */}
            <div>
              <label className="block text-sm mb-1">Value</label>
              <input
                type="number"
                {...register("value")}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            {/* description */}
            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                {...register("description")}
                className="w-full border rounded px-2 py-1"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Save Loss
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
