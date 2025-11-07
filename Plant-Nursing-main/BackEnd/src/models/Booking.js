// src/models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true,
  },
  cropGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CropGroup",
  },

  // Section 1: Crop Booking
  bookingDate: { type: Date, required: true },
  variety: { type: String, required: true },
  quantity: { type: Number, required: true },
  ratePerUnit: { type: Number, required: true },
  plotNumber: { type: String, required: true },
  sowingDate: { type: Date },
  dispatchDate: { type: Date },

  // Section 2: Vehicle Info (Optional)
  vehicleNumber: { type: String },
  driverName: { type: String },
  startKm: { type: Number },
  endKm: { type: Number },
  ratePerKm: { type: Number },

  // Section 3: Payment
  advancePayment: { type: Number, default: 0 },
  totalPayment: { type: Number, default: 0 },
  pendingPayment: { type: Number, default: 0 },
  finalTotalPrice: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Booking", bookingSchema);
