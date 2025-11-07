// models/Loss.js
import mongoose from "mongoose";

const lossSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropGroup", // dropdown1
      required: true,
    },
    variety: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropVariety", // dropdown2
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: false,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Done"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Loss = mongoose.model("Loss", lossSchema);

export default Loss;
