// models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  laborId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Labor",
    required: true,
  },
  date: {
    type: Date, // format: 'YYYY-MM-DD'
    required: true,
  },
}, {
  timestamps: true,
});

attendanceSchema.index({ laborId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
