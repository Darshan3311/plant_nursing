// src/pages/CropFormModal.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

export default function CropFormModal({ initialData = null, onClose, onSave }) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      mode: "variety", // 'group' | 'variety' | 'both'
      groupName: "",
      groupId: "",
      varietyName: "",
      defaultUnit: "seed",
      sku: "",
    },
  });

  const [groups, setGroups] = useState([]);
  const mode = watch("mode");

  useEffect(() => {
    fetchGroups();
    if (initialData) {
      // prefill if editing (not implemented fully)
      // setValue('groupId', initialData.group?._id)
      // setValue('varietyName', initialData.name)
    }
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get("/crops/groups");
      setGroups(res.data || []);
    } catch (err) {
      console.error("Failed to fetch crop groups", err);
      setGroups([]);
    }
  };

  const onSubmit = async (form) => {
    // Normalize payload for parent handler
    // form.mode determines what to create
    const payload = {
      mode: form.mode,
      groupName: form.groupName?.trim(),
      groupId: form.groupId,
      varietyName: form.varietyName?.trim(),
      defaultUnit: form.defaultUnit?.trim(),
      sku: form.sku?.trim(),
    };
    // Simple client validation
    if (payload.mode === "group" && !payload.groupName) {
      return alert("Please provide group name.");
    }
    if (payload.mode === "variety" && !payload.groupId) {
      return alert("Please select an existing group for the variety.");
    }
    if ((payload.mode === "variety" || payload.mode === "both") && !payload.varietyName) {
      return alert("Please provide variety name.");
    }

    try {
      await onSave(payload);
      reset();
    } catch (err) {
      // onSave will handle errors; still show fallback
      console.error("CropFormModal onSave error", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold mb-4">Add Crop / Variety</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              {...register("mode")}
              className="w-full border p-2 rounded"
              defaultValue="variety"
            >
              <option value="group">Add Group only</option>
              <option value="variety">Add Variety to existing Group</option>
              <option value="both">Create Group & Variety together</option>
            </select>
          </div>

          {mode === "group" && (
            <div>
              <label className="block text-sm font-medium mb-1">Group name</label>
              <input
                {...register("groupName")}
                placeholder="e.g. Fruits"
                className="w-full border p-2 rounded"
              />
            </div>
          )}

          {mode === "variety" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Select group</label>
                <select {...register("groupId")} className="w-full border p-2 rounded">
                  <option value="">-- choose group --</option>
                  {groups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Variety name</label>
                <input
                  {...register("varietyName")}
                  placeholder="e.g. Banana Rasthali"
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default unit</label>
                <input
                  {...register("defaultUnit")}
                  placeholder="seed / kg / packet"
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SKU (optional)</label>
                <input
                  {...register("sku")}
                  placeholder="optional SKU"
                  className="w-full border p-2 rounded"
                />
              </div>
            </>
          )}

          {mode === "both" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">New Group name</label>
                <input
                  {...register("groupName")}
                  placeholder="New group name (e.g. Fruits)"
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Variety name</label>
                <input
                  {...register("varietyName")}
                  placeholder="e.g. Banana Rasthali"
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default unit</label>
                <input
                  {...register("defaultUnit")}
                  placeholder="seed / kg / packet"
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SKU (optional)</label>
                <input
                  {...register("sku")}
                  placeholder="optional SKU"
                  className="w-full border p-2 rounded"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
