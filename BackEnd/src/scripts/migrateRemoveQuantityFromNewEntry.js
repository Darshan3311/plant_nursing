import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import NewEntry from '../models/NewEntry.js';

async function run() {
  try {
    dotenv.config();
    await connectDB();

    // Remove the `quantity` field from all variety subdocuments in NewEntry
    const res = await NewEntry.updateMany(
      {},
      { $unset: { 'varieties.$[].quantity': '' } }
    );

    console.log(`Migration complete. Matched: ${res.matchedCount ?? res.n} | Modified: ${res.modifiedCount ?? res.nModified}`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

run();
