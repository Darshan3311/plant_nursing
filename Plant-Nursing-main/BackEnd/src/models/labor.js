import mongoose from "mongoose";

const laborSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["regular", "wages"],
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  address: String,
  joiningDate: {
    type: Date,
    required: true,
  },
  // Regular employee
  salary: {
    type: Number,
    default: 0,
  },
  // Wages-based employee
  dailyWages: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
}, { timestamps: true });

const Labor = mongoose.models.Labor || mongoose.model("Labor", laborSchema);
export default Labor;
