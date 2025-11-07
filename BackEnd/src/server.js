import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

// routes
import userRoutes from "./routes/userRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import laborRoutes from "./routes/laborRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import staffDashboardRoutes from "./routes/staffDashboardRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import newEntryRoutes from "./routes/newEntryRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import dailyBookingRoutes from "./routes/dailyBookingRoutes.js";
import nutrientStockRoutes from "./routes/nutrientStockRoutes.js";

dotenv.config();
connectDB();

const app = express();

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://plant-nursing-main-update-frontend.onrender.com",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

// ✅ API Routes
app.use("/api/user", userRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/labors", laborRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", staffDashboardRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/newEntry", newEntryRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/daily-bookings", dailyBookingRoutes);
app.use("/api/nutrient-stock", nutrientStockRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
