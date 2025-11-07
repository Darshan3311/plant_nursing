// src/models/Expense.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const dailyexpenseSchema = new Schema({
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  // optionally who created it, category etc.
}, { timestamps: true });

export default mongoose.model('DailyExpense', dailyexpenseSchema);
