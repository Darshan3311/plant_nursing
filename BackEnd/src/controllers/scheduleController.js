// src/controllers/scheduleController.js
import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";
import CropGroup from "../models/CropGroup.js";
import CropVariety from "../models/CropVariety.js";
import Booking from "../models/Booking.js";
import Farmer from "../models/Farmer.js";

/** Helper: safe id -> string */
const idStr = (docOrId) => {
  if (!docOrId) return null;
  if (typeof docOrId === "string") return docOrId;
  if (docOrId._id) return String(docOrId._id);
  return String(docOrId);
};

/**
 * GET /api/schedules
 * Returns ongoing + upcoming schedules, grouped in 5-day slots
 */
export const getOngoingAndUpcomingSchedules = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ fetch schedules as mongoose docs (not lean)
    let schedules = await Schedule.find({
      endDate: { $gte: today },
    }).sort({ startDate: 1 });

    // ✅ if no schedules, create default ones
    if (schedules.length === 0) {
      const cropGroups = await CropGroup.find().select("name").lean();

      if (cropGroups.length > 0) {
        for (let i = 0; i < 4; i++) {
          const startDate = new Date(today);
          startDate.setDate(today.getDate() + i * 5);

          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 4);

          const schedule = new Schedule({
            name: `Schedule ${i + 1} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            startDate,
            endDate,
            status: i === 0 ? "ongoing" : "pending",
            groups: [],
          });

          for (const group of cropGroups) {
            const dbVarieties = await CropVariety.find({ group: group._id });
            schedule.groups.push({
              groupId: group._id,
              groupName: group.name,
              varieties: dbVarieties.map((v) => ({
                varietyId: v._id,
                varietyName: v.name,
                bookings: [],
                total: 0,
                completed: 0,
              })),
            });
          }

          await schedule.save();
        }

        schedules = await Schedule.find({
          endDate: { $gte: today },
        }).sort({ startDate: 1 });
      }
    }

    // ✅ ensure each schedule group has varieties saved in DB
    for (const s of schedules) {
      let changed = false;

      for (const g of s.groups) {
        if (!g.varieties || g.varieties.length === 0) {
          const dbVarieties = await CropVariety.find({ group: g.groupId });
          g.varieties = dbVarieties.map((cv) => ({
            varietyId: cv._id,
            varietyName: cv.name,
            bookings: [],
            total: 0,
            completed: 0,
          }));
          changed = true;
        }
      }

      if (changed) {
        await s.save(); // persist new varieties into DB
      }
    }

    // ✅ now populate with relations
    schedules = await Schedule.find({
      endDate: { $gte: today },
    })
      .sort({ startDate: 1 })
      .populate({ path: "groups.groupId", model: "CropGroup", select: "name" })
      .populate({
        path: "groups.varieties.varietyId",
        model: "CropVariety",
        select: "name group",
        populate: { path: "group", model: "CropGroup", select: "name" },
      })
      .populate({
        path: "groups.varieties.bookings.bookingId",
        model: "Booking",
        select: "farmer quantity varieties bookingDate sowingDate plotNumber",
      })
      .populate({
        path: "groups.varieties.bookings.farmerId",
        model: "Farmer",
        select: "fullName phone address",
      })
      .lean();

    // ✅ transform for frontend
    const transformed = schedules.map((s) => ({
      _id: idStr(s._id),
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      groups: (s.groups || []).map((g) => ({
        _id: idStr(g._id),   // 🔥 subdoc id for update
        groupId: idStr(g.groupId?._id ?? g.groupId),
        groupName: g.groupId?.name ?? g.groupName ?? "Unknown Group",
        varieties: (g.varieties || []).map((v) => ({
          _id: idStr(v._id),  // 🔥 subdoc id for update
          varietyId: idStr(v.varietyId?._id ?? v.varietyId),
          varietyName: v.varietyId?.name ?? v.varietyName ?? "Unknown Variety",
          total: typeof v.total === "number" ? v.total : 0,
          completed: typeof v.completed === "number" ? v.completed : 0,
          bookings: (v.bookings || []).map((b, i) => {
            const farmerObj =
              b.farmerId && typeof b.farmerId === "object" ? b.farmerId : null;
            return {
              bookingId: idStr(b.bookingId?._id ?? b.bookingId),
              farmerId: idStr(b.farmerId?._id ?? b.farmerId),
              farmerName: farmerObj?.fullName || `Farmer ${i + 1}`,
              quantity: b.quantity ?? 0,
            };
          }),
        })),
      })),
      
    }));

    return res.status(200).json(transformed);
  } catch (err) {
    console.error("getOngoingAndUpcomingSchedules error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching schedules",
      error: err.message,
    });
  }
};


/**
 * PATCH /api/schedules/update
 * Accepts { action: 'updateVarietyProgress', payload: { scheduleId, groupId, varietyId, completed } }
 */
export const updateSchedule = async (req, res) => {
  try {
    const { action, payload } = req.body;
    if (!action || !payload) {
      return res.status(400).json({ message: "Action and payload are required." });
    }

    if (action !== "updateVarietyProgress") {
      return res.status(400).json({ message: "Unsupported action." });
    }

    const { scheduleId, groupId, varietyId, completed } = payload;
    if (
      !scheduleId ||
      !mongoose.Types.ObjectId.isValid(scheduleId) ||
      !groupId ||
      !varietyId ||
      completed == null
    ) {
      return res
        .status(400)
        .json({ message: "scheduleId, groupId, varietyId, and completed are required." });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // FIX: Find group by groupId (CropGroup ID) instead of subdocument _id
    const group = schedule.groups.find(g => 
      g.groupId && g.groupId.toString() === groupId.toString()
    );
    
    if (!group) {
      return res.status(404).json({ message: "Group not found in schedule." });
    }

    // FIX: Find variety by varietyId (CropVariety ID) instead of subdocument _id
    const variety = group.varieties.find(v => 
      v.varietyId && v.varietyId.toString() === varietyId.toString()
    );
    
    if (!variety) {
      return res.status(404).json({ message: "Variety not found in group." });
    }

    if (completed > (variety.total || 0)) {
      return res.status(400).json({
        message: `Completed quantity cannot exceed total (${variety.total}).`,
      });
    }

    variety.completed = completed;
    await schedule.save();

    return res.status(200).json({
      message: "Variety progress updated successfully.",
      scheduleId,
      groupId,
      varietyId,
      completed: variety.completed,
    });
  } catch (err) {
    console.error("Failed to update schedule:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating schedule." });
  }
};