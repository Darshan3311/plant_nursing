// src/models/TopCrop.js
import mongoose from 'mongoose';

const topCropSchema = new mongoose.Schema(
  {
    // optional reference to the CropVariety doc (if available)
    varietyRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropVariety',
    },

    // store the human-readable name so the model still works if varietyRef isn't available
    varietyName: {
      type: String,
      required: true,
      trim: true,
    },

    // optional ref to CropGroup (helps grouping/reporting)
    cropGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropGroup',
    },

    // cumulative booked quantity for this variety
    bookedQuantity: {
      type: Number,
      default: 0,
    },

    lastBookedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const TopCrop = mongoose.model('TopCrop', topCropSchema);
export default TopCrop;
