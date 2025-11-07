// src/models/Schedule.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const BookingRefSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    farmerId: { type: Schema.Types.ObjectId, ref: "Farmer" },
    quantity: { type: Number, default: 0 },
  },
  { _id: false }
);

const VarietySchema = new Schema(
  {
    varietyId: { type: Schema.Types.ObjectId, ref: "CropVariety", default: null },
    varietyName: { type: String, required: true },
    bookings: { type: [BookingRefSchema], default: [] },
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
  },
  { _id: true }
);

const GroupSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "CropGroup", default: null },
    groupName: { type: String, default: null },
    varieties: { type: [VarietySchema], default: [] },
  },
  { _id: true }
);

const ScheduleSchema = new Schema(
  {
    name: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "ongoing", "completed"], default: "pending" },
    groups: { type: [GroupSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", ScheduleSchema);
