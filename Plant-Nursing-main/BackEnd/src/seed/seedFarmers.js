import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Farmer from '../models/Farmer.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedFarmers = async () => {
  try {
    await connectDB();

    await Farmer.deleteMany(); // Optional: Clear old data

    const farmers = [
      {
        fullName: 'Ramesh Patil',
        phone: '9876543210',
        address: 'Village A, Nashik',
        aadhaarNumber: '123412341234',
        vehicleNumber: 'MH15AB1234',
        driverName: 'Shivraj',
        pincode: '422001',
        status: 'new',
      },
      {
        fullName: 'Suresh Jadhav',
        phone: '9876543211',
        address: 'Village B, Pune',
        aadhaarNumber: '234523452345',
        vehicleNumber: 'MH12CD2345',
        driverName: 'Ramu',
        pincode: '411001',
        status: 'new',
      },
      {
        fullName: 'Ganesh Pawar',
        phone: '9876543212',
        address: 'Village C, Satara',
        aadhaarNumber: '345634563456',
        vehicleNumber: 'MH11EF3456',
        driverName: 'Keshav',
        pincode: '415001',
        status: 'new',
      },
      {
        fullName: 'Vijay Kale',
        phone: '9876543213',
        address: 'Village D, Sangli',
        aadhaarNumber: '456745674567',
        vehicleNumber: 'MH10GH4567',
        driverName: 'Naresh',
        pincode: '416416',
        status: 'new',
      },
      {
        fullName: 'Arun Deshmukh',
        phone: '9876543214',
        address: 'Village E, Kolhapur',
        aadhaarNumber: '567856785678',
        vehicleNumber: 'MH09IJ5678',
        driverName: 'Prakash',
        pincode: '416001',
        status: 'new',
      },
      {
        fullName: 'Sunil Sharma',
        phone: '9876543215',
        address: 'Village F, Aurangabad',
        aadhaarNumber: '678967896789',
        vehicleNumber: 'MH20KL6789',
        driverName: 'Anil',
        pincode: '431001',
        status: 'new',
      },
      {
        fullName: 'Mahesh More',
        phone: '9876543216',
        address: 'Village G, Solapur',
        aadhaarNumber: '789078907890',
        vehicleNumber: 'MH13MN7890',
        driverName: 'Deepak',
        pincode: '413001',
        status: 'new',
      },
      {
        fullName: 'Anand Kulkarni',
        phone: '9876543217',
        address: 'Village H, Nagpur',
        aadhaarNumber: '890189018901',
        vehicleNumber: 'MH31OP8901',
        driverName: 'Sanjay',
        pincode: '440001',
        status: 'new',
      },
      {
        fullName: 'Kishor Yadav',
        phone: '9876543218',
        address: 'Village I, Ahmednagar',
        aadhaarNumber: '901290129012',
        vehicleNumber: 'MH16QR9012',
        driverName: 'Vikas',
        pincode: '414001',
        status: 'new',
      },
      {
        fullName: 'Pravin Gaikwad',
        phone: '9876543219',
        address: 'Village J, Jalgaon',
        aadhaarNumber: '123512351235',
        vehicleNumber: 'MH19ST1235',
        driverName: 'Manoj',
        pincode: '425001',
        status: 'new',
      },
      {
        fullName: 'Sachin Bhosale',
        phone: '9876543220',
        address: 'Village K, Latur',
        aadhaarNumber: '234623462346',
        vehicleNumber: 'MH24UV2346',
        driverName: 'Rohit',
        pincode: '413512',
        status: 'new',
      },
      {
        fullName: 'Rahul Shinde',
        phone: '9876543221',
        address: 'Village L, Nanded',
        aadhaarNumber: '345734573457',
        vehicleNumber: 'MH26WX3457',
        driverName: 'Amit',
        pincode: '431601',
        status: 'new',
      },
      {
        fullName: 'Yogesh Chavan',
        phone: '9876543222',
        address: 'Village M, Amravati',
        aadhaarNumber: '456845684568',
        vehicleNumber: 'MH27YZ4568',
        driverName: 'Rajesh',
        pincode: '444601',
        status: 'new',
      },
      {
        fullName: 'Nitin Thakur',
        phone: '9876543223',
        address: 'Village N, Beed',
        aadhaarNumber: '567956795679',
        vehicleNumber: 'MH23AB5679',
        driverName: 'Girish',
        pincode: '431122',
        status: 'new',
      },
      {
        fullName: 'Sandeep Naik',
        phone: '9876543224',
        address: 'Village O, Osmanabad',
        aadhaarNumber: '678067806780',
        vehicleNumber: 'MH25CD6780',
        driverName: 'Harish',
        pincode: '413501',
        status: 'new',
      },
    ];

    await Farmer.insertMany(farmers);

    console.log('✅ 15 Farmer records seeded successfully! All statuses set to new.');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding farmer data:', error);
    process.exit(1);
  }
};

seedFarmers();