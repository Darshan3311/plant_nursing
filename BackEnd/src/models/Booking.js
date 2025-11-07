import mongoose from "mongoose";

const varietySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  ratePerUnit: { type: Number, required: true },
  varietyRef: { type: mongoose.Schema.Types.ObjectId, ref: "CropVariety" }, // optional
});

const bookingSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
  cropGroup: { type: mongoose.Schema.Types.ObjectId, ref: "CropGroup", required: true },
  bookingDate: { type: Date, required: true },
  varieties: { type: [varietySchema], required: true },
  plotNumber: { type: String, required: true },
  lotNumber: { type: String, required: true },
  sowingDate: { type: Date , required: true},
  dispatchDate: { type: Date },
  vehicleNumber: { type: String },
  driverName: { type: String },
  startKm: { type: Number },
  endKm: { type: Number },
  ratePerKm: { type: Number },
  advancePayment: { type: Number, default: 0 },
  totalPayment: { type: Number, default: 0 },
  pendingPayment: { type: Number, default: 0 },
  finalTotalPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Booking", bookingSchema);
