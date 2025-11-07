// src/seed/cropSeed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CropGroup from '../models/CropGroup.js';
import CropVariety from '../models/CropVariety.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await CropGroup.deleteMany();
    await CropVariety.deleteMany();

    const groups = await CropGroup.insertMany([
      { name: 'Vegetables' },
      { name: 'Fruits' },
      { name: 'Flowers' },
      { name: 'Herbs' },
    ]);

    const groupMap = {};
    groups.forEach((g) => (groupMap[g.name] = g._id));

    await CropVariety.insertMany([
      { name: 'Tomato Hybrid', group: groupMap['Vegetables'] },
      { name: 'Cabbage Green', group: groupMap['Vegetables'] },
      { name: 'Carrot Red', group: groupMap['Vegetables'] },

      { name: 'Banana Rasthali', group: groupMap['Fruits'] },
      { name: 'Mango Alphonso', group: groupMap['Fruits'] },

      { name: 'Rose Red', group: groupMap['Flowers'] },
      { name: 'Marigold Orange', group: groupMap['Flowers'] },

      { name: 'Tulsi', group: groupMap['Herbs'] },
      { name: 'Mint', group: groupMap['Herbs'] },
    ]);

    console.log('✅ Crop data seeded!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
