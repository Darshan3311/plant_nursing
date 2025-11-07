import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Seed", "Cocopeat", "Tray (Monthly)", "Pesticide"]
    },
    shop: { type: String, required: true },
    invoice: { type: String },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    date: { type: Date },
    status: { type: String, enum: ["Pending", "Done"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
