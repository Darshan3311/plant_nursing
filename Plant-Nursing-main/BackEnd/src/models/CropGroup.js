import mongoose from 'mongoose';

const cropGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const CropGroup = mongoose.model('CropGroup', cropGroupSchema);

export default CropGroup;
