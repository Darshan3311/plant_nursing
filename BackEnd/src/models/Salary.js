import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  labor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labor",
    required: true, // Link to the Labor table
  },
  month: {
    type: String, // e.g. "2025-08"
    required: true,
  },
  totalPresentDays: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0, // total salary/wages calculated
  },
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  paymentDate: {
    type: Date,
  }
}, { timestamps: true });

// Ensure a labor can't have duplicate salary record for same month
salarySchema.index({ labor: 1, month: 1 }, { unique: true });

const Salary = mongoose.models.Salary || mongoose.model("Salary", salarySchema);
export default Salary;
