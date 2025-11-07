// File: src/components/common/AttendanceSection.jsx
import React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext"; // import your auth hook

const AttendanceSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // get logged-in user info

  // Determine base path based on role
  const basePath =
    user?.role === "admin" ? "/admin/attendance" : "/staff/attendance";

  return (
    <div className="mt-4 mb-4 shadow required-lg p-4 bg-white rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
      <div className="flex justify-around">
        <div className="flex justify-center gap-10 border rounded-2xl p-4 shadow-lg">
          <button
            onClick={() => navigate(`${basePath}/regular`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl h-16 w-40"
          >
            Regular Employees
          </button>
          <button
            onClick={() => navigate(`${basePath}/wages`)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl h-16 w-40"
          >
            Wages-Based Employees
          </button>
        </div>
        <div className="h-24 w-40 rounded-2xl flex justify-center items-center shadow-lg border">
          <h3>Send Notification</h3>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSection;
