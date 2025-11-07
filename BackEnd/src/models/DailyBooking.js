import mongoose from "mongoose";

const dailyBookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    address: { type: String, required: true },
    crop: { type: String, required: true },
    variety: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("DailyBooking", dailyBookingSchema);
