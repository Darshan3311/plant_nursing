import axios from "../lib/axios";

// placeholder endpoints—replace with your real routes
export const getOverviewMetrics = () => 
  axios.get("/dashboard/overview");
export const getUpcomingSchedules = () => 
  axios.get("/dashboard/schedules");
export const getRecentPayments = () => 
  axios.get("/dashboard/payments");
export const getMonthlyBookings = () =>
  axios.get("/dashboard/monthly-bookings");
export const getTopCrops = () => 
  axios.get("/dashboard/top-crops");
export const getLowStockDetails = () => 
  axios.get("/dashboard/low-stock");
export const getAllUpcomingSchedules = () =>
  axios.get("/dashboard/schedules/all");
export const getAllRecentPayments = () => 
  axios.get("/dashboard/payments/all");
