// src/utils/scheduleUtils.js
import CropVariety from "../models/CropVariety.js";
import CropGroup from "../models/CropGroup.js";
import Schedule from "../models/Schedule.js";

/**
 * After a booking is created:
 * - ensure CropVariety exists (from ObjectId or name)
 * - find its CropGroup
 * - place booking into correct 5-day Schedule block
 * - inside that Schedule → group → variety → add booking + update totals
 */
export const afterBookingCreated = async (booking) => {
  try {
    console.log("📢 Booking Created:");
    console.log("Farmer ID:", booking.farmer.toString());
    console.log("Booking ID:", booking._id.toString());

    // 1) Resolve CropVariety (handle both ObjectId and name string)
    let varietyDoc;

    if (typeof booking.variety === "string") {
      // booking.variety is just the variety NAME
      varietyDoc = await CropVariety.findOne({ name: booking.variety }).populate("group");

      if (!varietyDoc) {
        // Fallback: ensure a default group exists
        let defaultGroup = await CropGroup.findOne({ name: "Default" });
        if (!defaultGroup) {
          defaultGroup = await CropGroup.create({ name: "Default" });
        }

        varietyDoc = await CropVariety.create({
          name: booking.variety,
          group: defaultGroup._id,
        });

        varietyDoc = await CropVariety.findById(varietyDoc._id).populate("group");
      }
    } else {
      // booking.variety is an ObjectId
      varietyDoc = await CropVariety.findById(booking.variety).populate("group");
    }

    if (!varietyDoc || !varietyDoc.group) {
      console.warn("❌ afterBookingCreated: Could not resolve variety or group", booking._id);
      return;
    }

    const groupId = varietyDoc.group._id;

    // 2) Determine the schedule 5-day block for booking.sowingDate
    const sowingDate = new Date(booking.sowingDate);
    if (isNaN(sowingDate.getTime())) {
      console.warn("❌ afterBookingCreated: invalid sowingDate on booking:", booking._id);
      return;
    }

    const day = sowingDate.getDate();
    const blockStartDay = Math.floor((day - 1) / 5) * 5 + 1;
    let blockEndDay = blockStartDay + 4;

    const year = sowingDate.getFullYear();
    const month = sowingDate.getMonth(); // 0-indexed
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    if (blockEndDay > lastDayOfMonth) blockEndDay = lastDayOfMonth;

    const startDate = new Date(year, month, blockStartDay, 0, 0, 0, 0);
    const endDate = new Date(year, month, blockEndDay, 23, 59, 59, 999);

    // 3) Find or create schedule
    let schedule = await Schedule.findOne({ startDate, endDate });

    if (!schedule) {
      schedule = new Schedule({
        name: `Schedule-${startDate.getDate()}-${endDate.getDate()}-${month + 1}-${year}`,
        startDate,
        endDate,
        groups: [],
        status: "pending",
      });
    }

    // 4) Find or create group inside the schedule
    let gIdx = schedule.groups.findIndex((g) => g.groupId.equals(groupId));
    if (gIdx === -1) {
      schedule.groups.push({ groupId, varieties: [] });
      gIdx = schedule.groups.length - 1;
    }

    // 5) Find or create variety inside the group
    const qty = Number(booking.quantity) || 0;
    let vIdx = schedule.groups[gIdx].varieties.findIndex((v) =>
      v.varietyId.equals(varietyDoc._id)
    );

    if (vIdx === -1) {
      schedule.groups[gIdx].varieties.push({
        varietyId: varietyDoc._id,
        bookings: [
          {
            bookingId: booking._id,
            farmerId: booking.farmer,
            quantity: qty,
          },
        ],
        total: qty,
        completed: 0,
      });
    } else {
      schedule.groups[gIdx].varieties[vIdx].bookings.push({
        bookingId: booking._id,
        farmerId: booking.farmer,
        quantity: qty,
      });
      schedule.groups[gIdx].varieties[vIdx].total += qty;
    }

    // 6) Save updated schedule
    await schedule.save();

    console.log(
      "✅ Schedule updated for block:",
      startDate.toISOString(),
      "->",
      endDate.toISOString()
    );
  } catch (err) {
    console.error("❌ afterBookingCreated failed:", err);
  }
};
