import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  aadhaarNumber: String,
  vehicleNumber: String,
  driverName: String,
  pincode: String,
  status: {
    type: String,
    enum: ['new', 'pending', 'sowing', 'completed'],
    default: 'new',
  },
}, {
  timestamps: true,
});

const Farmer = mongoose.model('Farmer', farmerSchema);
export default Farmer;
