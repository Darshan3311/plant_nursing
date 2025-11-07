// src/models/Nutrient.js
import mongoose from "mongoose";

const nutrientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "litre", "pcs", "g", "ml"], // Can expand as needed
    },
    currentStock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
    },
    threshold: {
      type: Number,
      required: true,
      min: [0, "Threshold cannot be negative"],
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Nutrient", nutrientSchema);
