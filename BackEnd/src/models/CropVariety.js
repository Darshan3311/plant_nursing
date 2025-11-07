import mongoose from 'mongoose';

const cropVarietySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CropGroup',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    defaultUnit: {
      type: String,
      default: "seed",
    },
    sku: { type: String }, // optional
  },
  { timestamps: true }
);

const CropVariety = mongoose.model('CropVariety', cropVarietySchema);

export default CropVariety;
