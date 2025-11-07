import { Routes, Route } from "react-router";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../components/Layout/Layout";

import {
  StaffDashboardPage,
  LoginPage,
  FarmerManagement,
  BookingManagementPage,
  LaborManagementPage,
  StaffAddExpenses
} from "../pages/index.js";

import AdminExpencessPage from "../pages/expenceManagement/AdminExpencessPage.jsx";
import AdminDashboard from "../pages/adminDashboard/AdminDashboard.jsx";
import ProfilePage from "../pages/ProfilePage";
import Unauthorized from "../pages/Unauthorized"; 
import Notification from "../pages/NotificationPage";
import AttendancePage from "../pages/laborManagement/AttendancePage"; 
import AssetManagementPage from "../pages/assetManagement/AssetManagementPage.jsx";
import SowingSchedulePage from "../pages/scheduleManagement/SowingSchedulePage.jsx";
import NewPage from "../pages/newPage/NewPage.jsx"
import BookingDetailsPage from "../pages/bookingManagement/BookingDetailsPage.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes with Layout */}
      <Route element={<Layout />}>
        {/* Admin-only route */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/farmers" element={<FarmerManagement />} />
          <Route path="/admin/booking-management" element={<BookingManagementPage />} />
          <Route path="/admin/bookings/:id" element={<BookingDetailsPage />} />
          <Route path="/admin/labor" element={<LaborManagementPage />} />
          <Route path="/admin/attendance/:type" element={<AttendancePage />} />
          <Route path="/admin/expencess" element={<AdminExpencessPage />} />
          <Route path="/admin/assets" element={<AssetManagementPage />} />
          <Route path="/admin/notifications" element={<Notification />} />
          <Route path="/admin/schedule" element={<StaffDashboardPage />} />
          <Route path="/admin/newpage" element={<NewPage />} />

        </Route>
        {/* Staff-only route */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/farmers" element={<FarmerManagement />} />
          <Route path="/staff/booking-management" element={<BookingManagementPage />} />
          <Route path="/staff/bookings/:id" element={<BookingDetailsPage />} />
          <Route path="/staff/labor" element={<LaborManagementPage />} />
          <Route path="staff/attendance/:type" element={<AttendancePage />} />
          <Route path="/staff/expencess" element={<StaffAddExpenses />} />
          <Route path="/staff/assets" element={<AssetManagementPage />} />
          <Route path="/staff/notifications" element={<Notification />} />
          <Route path="/staff/schedule" element={<SowingSchedulePage />} />
          <Route path="/staff/newpage" element={<NewPage />} />
        </Route>
        {/* Shared route */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        {/* Optional Unauthorized route */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
