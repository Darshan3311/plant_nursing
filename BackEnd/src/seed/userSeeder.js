import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();
await connectDB();

const seedUsers = async () => {
  try {
    await User.deleteMany(); // optional: clear existing users

    const users = [
      {
        staffId: 'admin001',
        password: 'adminpass',
        role: 'admin',
      },
      {
        staffId: 'staff001',
        password: 'staffpass',
        role: 'staff',
      },
    ];

    await User.insertMany(users);
    console.log('Users seeded successfully');
    process.exit();
  } catch (error) {
    console.error('User seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
