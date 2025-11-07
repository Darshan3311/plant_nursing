// src/models/Income.js
import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now, // default to current date if not provided
  },
  amount: {
    type: Number,
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true,
  }
}, {
  timestamps: true // createdAt & updatedAt fields
});

export default mongoose.model("Income", incomeSchema);
