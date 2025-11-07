import mongoose from "mongoose";

const varietySubSchema = new mongoose.Schema({
  variety: {
    type: String,
    required: true,
  },
});

const newEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  cropGroup: {
    type: String,
    required: true,
  },
  varieties: {
    type: [varietySubSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  }
}, { timestamps: true });

const NewEntry = mongoose.models.NewEntry || mongoose.model("NewEntry", newEntrySchema);
export default NewEntry;
