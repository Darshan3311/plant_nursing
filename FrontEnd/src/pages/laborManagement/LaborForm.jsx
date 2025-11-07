import React from "react";

const LaborForm = ({ formData, formType, onChange, onSubmit, onCancel, isEditing }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input
      type="text"
      name="fullName"
      value={formData.fullName}
      onChange={onChange}
      placeholder="Full Name"
      className="w-full border p-2 rounded"
      required
    />
    <input
      type="text"
      name="contactNumber"
      value={formData.contactNumber}
      onChange={onChange}
      placeholder="Contact Number"
      className="w-full border p-2 rounded"
      required
    />
    <input
      type="text"
      name="address"
      value={formData.address}
      onChange={onChange}
      placeholder="Address"
      className="w-full border p-2 rounded"
      required
    />

    {formType === "regular" ? (
      <input
        type="number"
        name="salary"
        value={formData.salary}
        onChange={onChange}
        placeholder="Salary"
        className="w-full border p-2 rounded"
        required
      />
    ) : (
      <>
        <input
          type="number"
          name="dailyWages"
          value={formData.dailyWages}
          onChange={onChange}
          placeholder="Daily Wages"
          className="w-full border p-2 rounded"
          required
        />
        <select
          name="status"
          value={formData.status}
          onChange={onChange}
          className="w-full border p-2 rounded"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on leave">On Leave</option>
        </select>
      </>
    )}

    <input
      type="date"
      name="joiningDate"
      value={formData.joiningDate}
      onChange={onChange}
      className="w-full border p-2 rounded"
      required
    />

    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 bg-gray-300 text-black py-2 rounded"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="flex-1 bg-blue-600 text-white py-2 rounded"
      >
        {isEditing ? "Update" : "Submit"}
      </button>
    </div>
  </form>
);

export default LaborForm;