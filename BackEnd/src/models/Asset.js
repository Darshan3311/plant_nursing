// src/models/Asset.js
import mongoose from "mongoose";

const allowedTypes = [
  "vehicle",
  "equipment",
  "tool",
  "container",
  "it",
  "building",
  "other",
];

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      lowercase: true,
      enum: {
        values: allowedTypes,
        message: "Invalid asset type",
      },
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: [1, "Value must be greater than 0"],
    },
    status: {
      type: String,
      enum: ["available", "inuse", "maintenance", "disposed"],
      default: "available",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Asset", assetSchema);
