import React, { useEffect, useState } from "react";
import axios from "../../lib/axios";
import { useForm, useFieldArray } from "react-hook-form";
import LossesModal from "./LossesModal"; // 👈 import your modal

const purchaseTypes = ["Seed", "Cocopeat", "Tray (Monthly)", "Pesticide"];

export default function NurseryExpenses({ editingExpense, onSave }) {
  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: { purchaseType: purchaseTypes[0], rows: [] },
  });

  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: "rows",
  });

  const selectedType = watch("purchaseType");
  const [isLossModalOpen, setLossModalOpen] = useState(false); // 👈 modal state

  // Load editing data OR from localStorage
  useEffect(() => {
    if (editingExpense) {
      const prefillRow = {
        shop: editingExpense.shop || "Shop A",
        invoice: editingExpense.invoice || "",
        total: editingExpense.total || editingExpense.amount || 0,
        paid: editingExpense.paid || 0,
        remaining:
          editingExpense.remaining ||
          (
            (editingExpense.total || editingExpense.amount || 0) -
            (editingExpense.paid || 0)
          ).toFixed(2),
        date: editingExpense.date
          ? new Date(editingExpense.date).toISOString().split("T")[0]
          : "",
        status: editingExpense.status?.toLowerCase() === "done" ? true : false,
      };

      replace([prefillRow]);
      reset({
        purchaseType: editingExpense.category || purchaseTypes[0],
        rows: [prefillRow],
      });
    } else {
      const raw = localStorage.getItem(
        "expense_" + (selectedType || purchaseTypes[0])
      );
      const saved = raw ? JSON.parse(raw) : [];
      replace(
        saved.map((item) => ({
          ...item,
          remaining: ((item.total || 0) - (item.paid || 0)).toFixed(2),
        }))
      );
    }
  }, [editingExpense, replace, reset, selectedType]);

  const addRow = () => {
    append({
      shop: "Shop A",
      invoice: "",
      total: 0,
      paid: 0,
      remaining: 0,
      date: "",
      status: false,
    });
  };

  const onSubmit = async (data) => {
    const payload = data.rows.map((r) => ({
      ...r,
      remaining: (parseFloat(r.total) - parseFloat(r.paid)).toFixed(2),
      status: r.status ? "Done" : "Pending",
    }));

    try {
      if (editingExpense?.id) {
        await axios.put(`/expenses/${editingExpense.id}`, payload[0]);
        alert("Expense updated successfully!");
      } else {
        await axios.post(`/expenses`, {
          type: selectedType,
          expenses: payload,
        });
        alert(`Saved and sent ${payload.length} rows for ${selectedType}`);
        localStorage.setItem(
          "expense_" + selectedType,
          JSON.stringify(payload)
        );
      }

      if (onSave) onSave();
    } catch (err) {
      console.error(err);
      alert(`Error sending data: ${err.message}`);
    }
  };
  const handleLossSubmit = async (lossData) => {
    // console.log("Loss data to save:", lossData);
    try {
      const payload = {
        group: lossData.group,
        variety: lossData.variety,
        date: lossData.date,
        description: lossData.description,
        value:lossData.value,
        status: lossData.status || "Pending",
      };

      await axios.post("/expenses/loss", payload);

      alert("Loss recorded successfully!");
      if (onSave) onSave(); // refresh parent if needed
      setLossModalOpen(false);
    } catch (err) {
      console.error("Error saving loss:", err);
      alert("Failed to save loss: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* ## Header Section ## */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {editingExpense ? "Edit Expense" : "Nursery Purchases"}
        </h1>
        {!editingExpense && (
          <button
            type="button"
            onClick={() => setLossModalOpen(true)} // 👈 open modal
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Add Losses
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Purchase type */}
        <div className="mb-4 max-w-md">
          <label htmlFor="purchaseType" className="block mb-1 text-gray-700">
            What did you purchase?
          </label>
          <select
            id="purchaseType"
            {...register("purchaseType")}
            disabled={!!editingExpense}
            className="w-full border px-3 py-2 rounded"
          >
            {purchaseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="bg-blue-500 text-white text-sm">
                <th className="p-2">Shop Name</th>
                <th className="p-2">Invoice No</th>
                <th className="p-2">Total (₹)</th>
                <th className="p-2">Paid (₹)</th>
                <th className="p-2">Remaining (₹)</th>
                <th className="p-2">Date</th>
                <th className="p-2">Done</th>
                {!editingExpense && <th className="p-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="text-center border-t text-sm">
                  <td className="p-2">
                    <select
                      {...register(`rows.${index}.shop`)}
                      className="border px-2 py-1 rounded w-full"
                    >
                      <option>Shop A</option>
                      <option>Shop B</option>
                      <option>Shop C</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      {...register(`rows.${index}.invoice`)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      {...register(`rows.${index}.total`, { valueAsNumber: true })}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      {...register(`rows.${index}.paid`, { valueAsNumber: true })}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      readOnly
                      className="border px-2 py-1 rounded w-full bg-gray-100"
                      value={(
                        (watch(`rows.${index}.total`) || 0) -
                        (watch(`rows.${index}.paid`) || 0)
                      ).toFixed(2)}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      {...register(`rows.${index}.date`)}
                      className="border px-2 py-1 rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      {...register(`rows.${index}.status`)}
                      className="w-5 h-5"
                    />
                  </td>
                  {!editingExpense && (
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          {!editingExpense && (
            <button
              type="button"
              onClick={addRow}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              + Add Row
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            💾 {editingExpense ? "Update" : "Save & Send"}
          </button>
        </div>
      </form>

      {/* Loss Modal */}
      <LossesModal
        isOpen={isLossModalOpen}
        onClose={() => setLossModalOpen(false)}
        onSave={handleLossSubmit}
      />
    </div>
  );
}
