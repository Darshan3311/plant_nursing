// src/scripts/backfillSchedules.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";

import Booking from "../models/Booking.js";
import Schedule from "../models/Schedule.js";
import CropGroup from "../models/CropGroup.js";
import CropVariety from "../models/CropVariety.js";

dotenv.config();

await connectDB();
console.log("✅ Connected to DB");

async function upsertScheduleFromBooking(booking) {
  if (!booking) return;

  // pick sowingDate > bookingDate
  const baseDate = booking.sowingDate || booking.bookingDate;
  if (!baseDate) return;

  const date = new Date(baseDate);
  if (isNaN(date.getTime())) return;

  // compute 5-day slot
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const slotStartDay = Math.floor((day - 1) / 5) * 5 + 1;
  const startDate = new Date(year, month, slotStartDay, 0, 0, 0, 0);
  const endDate = new Date(year, month, slotStartDay + 4, 23, 59, 59, 999);

  // find or create schedule
  let schedule = await Schedule.findOne({ startDate, endDate });
  if (!schedule) {
    schedule = new Schedule({
      name: `Schedule (${startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })} - ${endDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })})`,
      startDate,
      endDate,
      status: "pending",
      groups: [],
    });
  }

  /** ✅ Normalize cropGroup (can be ObjectId or plain string like "tomato") */
  let cropGroupId = booking.cropGroup;
  if (typeof cropGroupId === "string" && !mongoose.Types.ObjectId.isValid(cropGroupId)) {
    // It's a plain string (name)
    let cg = await CropGroup.findOne({ name: cropGroupId });
    if (!cg) {
      cg = new CropGroup({ name: cropGroupId });
      await cg.save();
    }
    cropGroupId = cg._id;
  } else if (typeof cropGroupId === "string" && mongoose.Types.ObjectId.isValid(cropGroupId)) {
    cropGroupId = new mongoose.Types.ObjectId(cropGroupId);
  }

  // find or create group inside schedule
  let group = schedule.groups.find((g) => String(g.groupId) === String(cropGroupId));
  if (!group) {
    const cg = await CropGroup.findById(cropGroupId).lean();
    group = {
      groupId: cropGroupId,
      groupName: cg?.name || "Unknown Group",
      varieties: [],
    };
    schedule.groups.push(group);
  }

  // loop through booking.varieties
  for (const v of booking.varieties) {
    const vName = v.name || v.variety || "Unknown Variety";
    const qty = Number(v.quantity || 0);

    // ensure variety exists in DB
    let varietyRef = null;
    let cv = await CropVariety.findOne({ name: vName }).lean();
    if (!cv) {
      const newVariety = new CropVariety({
        group: cropGroupId,
        name: vName,
      });
      await newVariety.save();
      varietyRef = newVariety._id;
    } else {
      varietyRef = cv._id;
    }

    // find or create variety in schedule
    let variety = group.varieties.find((vv) => String(vv.varietyId) === String(varietyRef));
    if (!variety) {
      variety = {
        varietyId: varietyRef,
        varietyName: vName,
        bookings: [],
        total: 0,
        completed: 0,
      };
      group.varieties.push(variety);
    }

    // push booking reference
    variety.bookings.push({
      bookingId: booking._id,
      farmerId: booking.farmer,
      quantity: qty,
    });

    variety.total = (variety.total || 0) + qty;
  }

  await schedule.save();
}

async function backfill() {
  try {
    const bookings = await Booking.find();
    console.log(`Found ${bookings.length} bookings`);

    for (const booking of bookings) {
      await upsertScheduleFromBooking(booking);
    }

    console.log("✅ Backfill completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  }
}

await backfill();
