import mongoose from "mongoose";

const nutrientStockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    lowerLimit: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("NutrientStock", nutrientStockSchema);
