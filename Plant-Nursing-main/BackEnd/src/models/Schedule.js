// src/models/Schedule.js
import mongoose from "mongoose";

const scheduleVarietySchema = new mongoose.Schema({
  varietyId: { type: mongoose.Schema.Types.ObjectId, ref: "CropVariety", required: true },
  bookings: [
    {
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
      farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
      quantity: { type: Number, required: true },
    },
  ],
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
});

const scheduleGroupSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "CropGroup", required: true },
  varieties: [scheduleVarietySchema],
});

const scheduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    groups: [scheduleGroupSchema], // each schedule has groups → varieties
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
