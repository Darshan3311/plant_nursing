import { NavLink, useNavigate } from "react-router";
import { FaHome, FaUser, FaBell, FaCog, FaBook } from "react-icons/fa";
import { CiWheat, CiLogout } from "react-icons/ci";
import { MdMan, MdInsertPageBreak, MdWebAsset } from "react-icons/md";
import { FaNewspaper } from "react-icons/fa6";
import { GrSchedule } from "react-icons/gr";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed

export default function Header() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const basePath = user?.role === "admin" ? "admin" : "staff";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen w-64 bg-white shadow-md flex flex-col px-4 py-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-8 capitalize">
        {user?.role} Dashboard
      </h1>
      <nav className="flex flex-col gap-2">
        <NavLink
          to={`/${basePath}/dashboard`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaHome /> Overview
        </NavLink>

        <NavLink
          to={`/${basePath}/farmers`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <CiWheat /> Farmers
        </NavLink>

        <NavLink
          to={`/${basePath}/booking-management`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaBook /> Booking Form
        </NavLink>
        <NavLink
          to={`/${basePath}/labor`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <MdMan /> Labour
        </NavLink>

        <NavLink
          to={`/${basePath}/expencess`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <MdInsertPageBreak /> Expenses
        </NavLink>

        <NavLink
          to={`/${basePath}/assets`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <MdWebAsset /> Assets
        </NavLink>
        <NavLink
          to={`/${basePath}/schedule`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <GrSchedule /> Schedule
        </NavLink>
        <NavLink
          to={`/${basePath}/newpage`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaNewspaper /> New Entry
        </NavLink>
        
        <NavLink
          to={`/${basePath}/notifications`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg ${
              isActive
                ? "bg-blue-100 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaBell /> Notifications
        </NavLink>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-red-100 hover:text-red-600 transition"
        >
          <CiLogout /> Logout
        </button>
      </nav>
    </div>
  );
}
