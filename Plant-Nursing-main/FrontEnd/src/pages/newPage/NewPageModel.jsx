import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "../../lib/axios";

const NewPageModel = ({ onClose, refreshData }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      cropGroup: "",
      variety: "",
      totalTrays: 0,
      totalPlants: 0,
      sowingDate: "",
      totalMans: 0,
    },
  });

  const [groups, setGroups] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingVarieties, setLoadingVarieties] = useState(false);

  const selectedGroup = watch("cropGroup");

  // fetch groups on mount
  useEffect(() => {
    setLoadingGroups(true);
    axios
      .get("/crops/groups")
      .then((res) => setGroups(res.data || []))
      .catch((err) => {
        console.warn("Error fetching groups", err);
        setGroups([]);
      })
      .finally(() => setLoadingGroups(false));
  }, []);

  // fetch varieties for the selected group
  useEffect(() => {
    if (!selectedGroup) {
      setVarieties([]);
      setValue("variety", "");
      return;
    }

    setLoadingVarieties(true);
    // endpoint expects groupId
    axios
      .get(`/crops/varieties/${selectedGroup}`)
      .then((res) => {
        setVarieties(res.data || []);
        // if only one variety you might auto-select it:
        // if (res.data && res.data.length === 1) setValue('variety', res.data[0]._id);
      })
      .catch((err) => {
        console.warn("Error fetching varieties for group", err);
        setVarieties([]);
        setValue("variety", "");
      })
      .finally(() => setLoadingVarieties(false));
  }, [selectedGroup, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    reset({
      date: new Date().toISOString().split("T")[0],
      cropGroup: "",
      variety: "",
      totalTrays: 0,
      totalPlants: 0,
      sowingDate: "",
      totalMans: 0,
    });
    setVarieties([]);
  }, [reset]);

  const onSubmit = async (formData) => {
    try {
      // send groupId and varietyId along with other fields
      const payload = {
        date: formData.date,
        groupId: formData.cropGroup,
        varietyId: formData.variety,
        totalTrays: Number(formData.totalTrays) || 0,
        totalPlants: Number(formData.totalPlants) || 0,
        sowingDate: formData.sowingDate || null,
        totalMans: Number(formData.totalMans) || 0,
      };

      await axios.post("/newEntry", payload);
      console.log(payload)
      alert("Crop record saved successfully!");

      if (refreshData) await refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving crop: " + (err?.response?.data?.message || err?.message || "Unknown error"));
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block mb-1 font-medium">Date</label>
              <input id="date" type="date" {...register("date", { required: "Date is required" })} className="border p-2 rounded w-full" />
              {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
            </div>

            {/* Crop Group */}
            <div>
              <label htmlFor="cropGroup" className="block mb-1 font-medium">Crop Group</label>
              <select id="cropGroup" {...register("cropGroup", { required: "Group is required" })} className="border p-2 rounded w-full" disabled={loadingGroups}>
                <option value="">-- Select Group --</option>
                {groups.map((g) => (
                  <option key={g._id || g.id || g.name} value={g._id || g.id || g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.cropGroup && <p className="text-red-500 text-sm">{errors.cropGroup.message}</p>}
            </div>

            {/* Variety (depends on selected group) */}
            <div>
              <label htmlFor="variety" className="block mb-1 font-medium">Variety</label>
              <select id="variety" {...register("variety", { required: "Variety is required" })} className="border p-2 rounded w-full" disabled={!selectedGroup || loadingVarieties}>
                <option value="">{selectedGroup ? "-- Select Variety --" : "Select group first"}</option>
                {varieties.map((v) => (
                  // value is the variety id (safer)
                  <option key={v._id || v.id || v.name} value={v._id || v.id || v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
              {errors.variety && <p className="text-red-500 text-sm">{errors.variety.message}</p>}
            </div>

            {/* Total Trays */}
            <div>
              <label htmlFor="totalTrays" className="block mb-1 font-medium">Total Trays</label>
              <input id="totalTrays" type="number" {...register("totalTrays", { required: "Total trays is required", min: 1 })} className="border p-2 rounded w-full" />
              {errors.totalTrays && <p className="text-red-500 text-sm">{errors.totalTrays.message}</p>}
            </div>

            {/* Total Plants */}
            <div>
              <label htmlFor="totalPlants" className="block mb-1 font-medium">Total Plants</label>
              <input id="totalPlants" type="number" {...register("totalPlants", { required: "Total plants is required", min: 1 })} className="border p-2 rounded w-full" />
              {errors.totalPlants && <p className="text-red-500 text-sm">{errors.totalPlants.message}</p>}
            </div>

            {/* Sowing Date */}
            <div>
              <label htmlFor="sowingDate" className="block mb-1 font-medium">Sowing Date</label>
              <input id="sowingDate" type="date" {...register("sowingDate", { required: "Sowing date is required" })} className="border p-2 rounded w-full" />
              {errors.sowingDate && <p className="text-red-500 text-sm">{errors.sowingDate.message}</p>}
            </div>

            {/* Total Man's */}
            <div>
              <label htmlFor="totalMans" className="block mb-1 font-medium">Total Man’s</label>
              <input id="totalMans" type="number" {...register("totalMans", { min: 0 })} className="border p-2 rounded w-full" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Crop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPageModel;
