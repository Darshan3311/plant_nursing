// src/controllers/scheduleController.js
import Schedule from "../models/Schedule.js";


/**
 * Helper: safe id -> string
 */
const idStr = (docOrId) => {
  if (!docOrId) return null;
  if (typeof docOrId === "string") return docOrId;
  if (docOrId._id) return String(docOrId._id);
  return String(docOrId);
};

// new one
export const getOngoingAndUpcomingSchedules = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await Schedule.find({
      $or: [
        { startDate: { $lte: today }, endDate: { $gte: today } }, // ongoing
        { startDate: { $gte: today } }, // upcoming
      ],
    })
      .sort({ startDate: 1 })
      .limit(5)
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
        select:
          "farmer quantity variety bookingDate ratePerUnit plotNumber sowingDate dispatchDate",
      })
      .populate({
        path: "groups.varieties.bookings.farmerId",
        model: "Farmer",
        select: "fullName phone address",
      })
      .exec();

    const transformed = schedules.map((s) => ({
      _id: idStr(s._id),
      name: s.name,
      groups: (s.groups || []).map((g) => ({
        groupId: idStr(g.groupId?._id ?? g.groupId),
        groupName: g.groupId?.name ?? undefined,
        varieties: (g.varieties || []).map((v) => ({
          varietyId: idStr(v.varietyId?._id ?? v.varietyId),
          varietyName: v.varietyId?.name ?? undefined,
          bookings: (v.bookings || []).map((b) => {
            const bookingObj =
              b.bookingId && typeof b.bookingId === "object" ? b.bookingId : null;
            const farmerObj =
              b.farmerId && typeof b.farmerId === "object" ? b.farmerId : null;
            const quantity =
              typeof b.quantity === "number"
                ? b.quantity
                : bookingObj?.quantity ?? 0;

            return {
              bookingId: idStr(b.bookingId?._id ?? b.bookingId),
              farmerId: idStr(b.farmerId?._id ?? b.farmerId),
              farmerName: farmerObj?.fullName ?? undefined,
              quantity,
              bookingInfo: bookingObj
                ? {
                    quantity: bookingObj.quantity,
                    variety: bookingObj.variety,
                    bookingDate: bookingObj.bookingDate,
                    plotNumber: bookingObj.plotNumber,
                  }
                : undefined,
            };
          }),
          total: typeof v.total === "number" ? v.total : 0,
          completed: typeof v.completed === "number" ? v.completed : 0,
        })),
      })),
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      __v: s.__v ?? 0,
    }));

    // 🔎 Debug log (formatted JSON)
    console.log("Ongoing + Upcoming schedules:", JSON.stringify(transformed, null, 2));

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

export const updateSchedule = async (req, res) => {
  const { action, payload } = req.body;

  if (!action || !payload) {
    return res.status(400).json({ message: "Action and payload are required." });
  }

  if (action !== "updateVarietyProgress") {
    return res.status(400).json({ message: "Unsupported action." });
  }

  const { scheduleId, groupId, varietyId, completed } = payload;

  if (!scheduleId || !groupId || !varietyId || completed == null) {
    return res
      .status(400)
      .json({ message: "scheduleId, groupId, varietyId, and completed are required." });
  }

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const group = schedule.groups.find((g) => g.groupId.toString() === groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found in schedule." });
    }

    const variety = group.varieties.find((v) => v.varietyId.toString() === varietyId);
    if (!variety) {
      return res.status(404).json({ message: "Variety not found in group." });
    }

    // Ensure completed does not exceed total
    if (completed > (variety.total || 0)) {
      return res.status(400).json({
        message: `Completed quantity cannot exceed total (${variety.total}).`,
      });
    }

    variety.completed = completed; // update completed

    await schedule.save();

    return res.status(200).json({
      message: "Variety progress updated successfully.",
      data: schedule, // send updated schedule
    });
  } catch (err) {
    console.error("Failed to update schedule:", err);
    return res.status(500).json({ message: "Server error while updating schedule." });
  }
};

