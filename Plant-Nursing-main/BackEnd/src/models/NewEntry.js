// models/CropEntry.js
import mongoose from "mongoose";

const newEntrySchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropGroup",
      required: true,
    },
    varietyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropVariety",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalTrays: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPlants: {
      type: Number,
      required: true,
      min: 0,
    },
    sowingDate: {
      type: Date,
      default: null,
    },
    totalMans: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const CropEntry = mongoose.model("NewEntry", newEntrySchema);
export default CropEntry;
