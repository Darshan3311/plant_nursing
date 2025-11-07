// src/models/Stock.js
import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  variety: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CropVariety",
    required: true,
    unique: true, 
  },
  quantity: { type: Number, default: 0 },
  lowerLimit: { type: Number, default: 0 },
  unit: { type: String, default: "kg" }, // optional
  lastUpdated: { type: Date, default: Date.now },
  // optional: who updated, notes, batch
  notes: { type: String },
}, { timestamps: true });

const Stock = mongoose.model("Stock", stockSchema);
export default Stock;
