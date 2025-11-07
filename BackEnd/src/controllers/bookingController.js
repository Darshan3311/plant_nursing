import Booking from "../models/Booking.js";
import Farmer from "../models/Farmer.js";
import CropVariety from "../models/CropVariety.js";
import Stock from "../models/Stock.js";
import TopCrop from "../models/TopCrop.js";
import Income from "../models/Income.js";
import mongoose from "mongoose";
import CropGroup from "../models/CropGroup.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Schedule from "../models/Schedule.js";

/**
 * Create Booking
 */
// export const createBooking = async (req, res) => {
//   try {
//     const {
//       farmerId,
//       cropGroup,
//       plotNumber,
//       bookingDate,
//       sowingDate,
//       varieties,
//       finalTotalPrice,
//       totalPayment,
//       advancePayment,
//       pendingPayment,
//       vehicleNumber,
//       driverName,
//       startKm,
//       endKm,
//       paymentMethod,
//       paymentNotes,
//     } = req.body;

//     // ✅ validation
//     if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId))
//       return res.status(400).json({ message: "Invalid farmerId" });
//     if (!plotNumber) return res.status(400).json({ message: "plotNumber is required" });
//     if (!cropGroup) return res.status(400).json({ message: "cropGroup is required" });
//     if (!varieties || varieties.length === 0)
//       return res.status(400).json({ message: "Varieties are required" });

//     const farmer = await Farmer.findById(farmerId);
//     if (!farmer) return res.status(404).json({ message: "Farmer not found" });

//     // ✅ cropGroup (id or create new)
//     let cropGroupId;
//     if (mongoose.Types.ObjectId.isValid(cropGroup)) {
//       cropGroupId = cropGroup;
//     } else {
//       let cg = await CropGroup.findOne({ name: cropGroup });
//       if (!cg) {
//         cg = new CropGroup({ name: cropGroup });
//         await cg.save();
//       }
//       cropGroupId = cg._id;
//     }

//     // ✅ price calculations
//     const calculatedTotal = varieties.reduce(
//       (sum, v) => sum + (v.quantity || 0) * (v.ratePerUnit || 0),
//       0
//     );
//     const finalAmount = finalTotalPrice || calculatedTotal;
//     const totalAmt = totalPayment || calculatedTotal;
//     const advanceAmt = advancePayment || 0;
//     const pendingAmt = pendingPayment ?? Math.max(finalAmount - advanceAmt, 0);

//     // ✅ new booking
//     const newBooking = new Booking({
//       farmer: farmer._id,
//       cropGroup: cropGroupId,
//       plotNumber,
//       bookingDate,
//       sowingDate,
//       varieties,
//       finalTotalPrice: finalAmount,
//       totalPayment: totalAmt,
//       advancePayment: advanceAmt,
//       pendingPayment: pendingAmt,
//       vehicleNumber,
//       driverName,
//       startKm,
//       endKm,
//       paymentMethod,
//       paymentNotes,
//     });

//     await newBooking.save();

//     // ✅ mark farmer pending
//     farmer.status = "pending";
//     await farmer.save();

//     // ✅ update schedule
//     try {
//       await upsertScheduleFromBooking(newBooking);
//     } catch (err) {
//       console.error("Schedule upsert failed:", err);
//     }

//     return res.status(201).json({
//       message: "Booking created successfully",
//       booking: newBooking,
//     });
//   } catch (error) {
//     console.error("Booking creation failed:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    let b = await Booking.findById(id).lean();
    if (!b) return res.status(404).json({ message: "Booking not found" });

    // Populate farmer
    if (b.farmer && mongoose.Types.ObjectId.isValid(b.farmer)) {
      const farmer = await Farmer.findById(b.farmer).lean();
      b.farmer = farmer
        ? { _id: farmer._id, fullName: farmer.fullName, status: farmer.status, phone: farmer.phone, email: farmer.email, address: farmer.address }
        : null;
    }

    // Populate cropGroup
    if (b.cropGroup && mongoose.Types.ObjectId.isValid(b.cropGroup)) {
      const cg = await CropGroup.findById(b.cropGroup).lean();
      b.cropGroup = cg ? { _id: cg._id, name: cg.name } : { name: b.cropGroup };
    }

    // Compute total quantity and amount
    b.quantity = b.varieties?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
    b.amount =
      b.varieties?.reduce(
        (sum, v) => sum + (v.quantity || 0) * (v.ratePerUnit || 0),
        0
      ) || b.finalTotalPrice || b.totalPayment || 0;

    return res.status(200).json({ message: "Booking fetched", data: b });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// --------- Pay Remaining for a Booking ---------
export const payBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const booking = await Booking.findById(id).populate("farmer");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const pending = Number(booking.pendingPayment || 0);
    const advance = Number(booking.advancePayment || 0);

    const applied = Math.min(payAmt, pending);
    booking.advancePayment = advance + applied;
    booking.pendingPayment = Math.max(0, pending - applied);

    // Optionally you can store a payment record elsewhere. For now, annotate notes
    if (notes) booking.paymentNotes = [booking.paymentNotes, notes].filter(Boolean).join(" | ");
    if (method) booking.paymentMethod = method;

    await booking.save();

    // If fully paid now, create an Income entry and optionally set farmer status to completed
    let incomeCreated = null;
    if (booking.pendingPayment === 0) {
      const income = new Income({
        date: new Date(),
        amount: booking.finalTotalPrice || booking.totalPayment || 0,
        booking: booking._id,
        farmer: booking.farmer?._id || booking.farmer,
      });
      await income.save();
      incomeCreated = income._id;

      if (booking.farmer && booking.farmer.status && booking.farmer.status !== "completed") {
        booking.farmer.status = "completed";
        await booking.farmer.save();
      }
    }

    return res.status(200).json({
      message: "Payment applied",
      data: {
        bookingId: booking._id,
        advancePayment: booking.advancePayment,
        pendingPayment: booking.pendingPayment,
        incomeId: incomeCreated,
      },
    });
  } catch (error) {
    console.error("payBooking error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/**
 * Create Booking
 */
export const createBooking = async (req, res) => {
  try {
    const {
      farmerId,
      cropGroup,
      plotNumber,
      lotNumber,
      bookingDate,
      sowingDate,
      varieties,
      finalTotalPrice,
      totalPayment,
      advancePayment,
      pendingPayment,
      vehicleNumber,
      driverName,
      startKm,
      endKm,
      paymentMethod,
      paymentNotes,
    } = req.body;

    // ✅ validation
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId))
      return res.status(400).json({ message: "Invalid farmerId" });
    if (!plotNumber) return res.status(400).json({ message: "plotNumber is required" });
    if (!lotNumber) return res.status(400).json({ message: "lotNumber is required" });
    if (!cropGroup) return res.status(400).json({ message: "cropGroup is required" });
    if (!varieties || varieties.length === 0)
      return res.status(400).json({ message: "Varieties are required" });

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    // ✅ cropGroup (id or create new)
    let cropGroupId;
    if (mongoose.Types.ObjectId.isValid(cropGroup)) {
      cropGroupId = cropGroup;
    } else {
      let cg = await CropGroup.findOne({ name: cropGroup });
      if (!cg) {
        cg = new CropGroup({ name: cropGroup });
        await cg.save();
      }
      cropGroupId = cg._id;
    }

    // ✅ price calculations
    const calculatedTotal = varieties.reduce(
      (sum, v) => sum + (v.quantity || 0) * (v.ratePerUnit || 0),
      0
    );
    const finalAmount = finalTotalPrice || calculatedTotal;
    const totalAmt = totalPayment || calculatedTotal;
    const advanceAmt = advancePayment || 0;
    const pendingAmt = pendingPayment ?? Math.max(finalAmount - advanceAmt, 0);

    // ✅ new booking
    const newBooking = new Booking({
      farmer: farmer._id,
      cropGroup: cropGroupId,
      plotNumber,
      lotNumber,
      bookingDate,
      sowingDate,
      varieties,
      finalTotalPrice: finalAmount,
      totalPayment: totalAmt,
      advancePayment: advanceAmt,
      pendingPayment: pendingAmt,
      vehicleNumber,
      driverName,
      startKm,
      endKm,
      paymentMethod,
      paymentNotes,
    });

    await newBooking.save();

    // ✅ mark farmer pending
    farmer.status = "pending";
    await farmer.save();

    // ✅ insert booking into schedules
    try {
      await upsertScheduleFromBooking(newBooking);
    } catch (err) {
      console.error("Schedule upsert failed:", err);
    }

    return res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Booking creation failed:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Insert booking into its schedule
 */
// async function upsertScheduleFromBooking(booking) {
//   if (!booking) return;

//   const baseDate = booking.sowingDate || booking.bookingDate;
//   if (!baseDate) return;

//   const date = new Date(baseDate);
//   if (isNaN(date.getTime())) return;

//   // ✅ compute 5-day slot
//   const year = date.getFullYear();
//   const month = date.getMonth();
//   const day = date.getDate();
//   const slotStartDay = Math.floor((day - 1) / 5) * 5 + 1;
//   const startDate = new Date(year, month, slotStartDay, 0, 0, 0, 0);
//   const endDate = new Date(year, month, slotStartDay + 4, 23, 59, 59, 999);

//   // ✅ find or create schedule
//   let schedule = await Schedule.findOne({ startDate, endDate });
//   if (!schedule) {
//     schedule = new Schedule({
//       name: `Schedule (${startDate.toLocaleDateString("en-GB", {
//         day: "numeric",
//         month: "short",
//       })} - ${endDate.toLocaleDateString("en-GB", {
//         day: "numeric",
//         month: "short",
//       })})`,
//       startDate,
//       endDate,
//       status: "pending",
//       groups: [],
//     });
//   }

//   // ✅ find or create group
//   const gIdStr = String(booking.cropGroup);
//   let group = schedule.groups.find((g) => String(g.groupId) === gIdStr);

//   let groupName = null;
//   const cg = await CropGroup.findById(booking.cropGroup).lean();
//   if (cg) groupName = cg.name;

//   if (!group) {
//     group = {
//       groupId: booking.cropGroup,
//       groupName: groupName || "Unknown Group",
//       varieties: [],
//     };
//     schedule.groups.push(group);
//   }

//   // ✅ add each variety into schedule
//   for (const v of booking.varieties) {
//     const vName = v.name || v.variety || "Unknown Variety";
//     const qty = Number(v.quantity || 0);

//     // ensure variety exists in DB
//     let cv = await CropVariety.findOne({ name: vName, group: booking.cropGroup });
//     if (!cv) {
//       cv = new CropVariety({
//         group: booking.cropGroup,
//         name: vName,
//       });
//       await cv.save();
//     }

//     // find or create variety in schedule
//     let variety = group.varieties.find(
//       (vv) => String(vv.varietyId) === String(cv._id)
//     );
//     if (!variety) {
//       variety = {
//         varietyId: cv._id,
//         varietyName: cv.name,
//         bookings: [],
//         total: 0,
//         completed: 0,
//       };
//       group.varieties.push(variety);
//     }

//     // push booking reference
//     variety.bookings.push({
//       bookingId: booking._id,
//       farmerId: booking.farmer,
//       quantity: qty,
//     });

//     // increment planned qty
//     variety.total = (variety.total || 0) + qty;
//   }

//   await schedule.save();
// }

/**
 * Helper: slot a booking into 5-day schedule
 */
async function upsertScheduleFromBooking(booking) {
  if (!booking) return;

  // pick sowingDate > bookingDate
  const baseDate = booking.sowingDate || booking.bookingDate;
  if (!baseDate) return;

  const date = new Date(baseDate);
  if (isNaN(date.getTime())) return;

  // ✅ compute 5-day slot
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const slotStartDay = Math.floor((day - 1) / 5) * 5 + 1;
  const startDate = new Date(year, month, slotStartDay, 0, 0, 0, 0);
  const endDate = new Date(year, month, slotStartDay + 4, 23, 59, 59, 999);

  // ✅ find or create schedule
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

  // ✅ find or create group
  const gIdStr = String(booking.cropGroup);
  let group = schedule.groups.find((g) => String(g.groupId) === gIdStr);

  let groupName = "Unknown Group";
  if (mongoose.Types.ObjectId.isValid(gIdStr)) {
    const cg = await CropGroup.findById(booking.cropGroup).lean();
    if (cg) groupName = cg.name;
  }

  if (!group) {
    group = {
      groupId: booking.cropGroup,
      groupName,
      varieties: [],
    };
    schedule.groups.push(group);
  }

  // ✅ loop through *all* booking.varieties
  for (const v of booking.varieties) {
    const vName = v.name || "Unknown Variety";
    const qty = Number(v.quantity || 0);

    // ensure variety exists in DB
    let cv = await CropVariety.findOne({ name: vName });
    if (!cv) {
      cv = new CropVariety({ group: booking.cropGroup, name: vName });
      await cv.save();
    }

    // check if variety already exists in schedule group
    let variety = group.varieties.find(
      (vv) => String(vv.varietyId) === String(cv._id)
    );
    if (!variety) {
      variety = {
        varietyId: cv._id,
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

    // increment planned qty
    variety.total = (variety.total || 0) + qty;
  }

  schedule.markModified("groups");
  await schedule.save();
}


// ---------- Promote Booking Status ----------
export const promoteBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid booking id" });

    const booking = await Booking.findById(id).populate("farmer");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.farmer) return res.status(404).json({ message: "Farmer not found" });

    const currentStatus = booking.farmer.status.toLowerCase();
    let newStatus;
    if (currentStatus === "pending") newStatus = "sowing";
    else if (currentStatus === "sowing") newStatus = "completed";
    else return res.status(400).json({ message: "Cannot promote this status" });

    booking.farmer.status = newStatus;

    // If completed, set pendingPayment = 0 & create Income
    if (newStatus === "completed") {
      booking.pendingPayment = 0;
      await booking.save();

      const income = new Income({
        date: new Date(),
        amount: booking.finalTotalPrice,
        booking: booking._id,
        farmer: booking.farmer._id,
      });
      await income.save();
    }

    await booking.farmer.save();

    return res.status(200).json(new ApiResponse(200, { bookingId: booking._id, newStatus }, `Booking promoted to ${newStatus}`));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiResponse(500, {}, "Internal Server Error"));
  }
};


// Update Farmer Status
export const updateFarmerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["new", "pending", "sowing", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const farmer = await Farmer.findById(id);
    if (!farmer) return res.status(404).json({ message: "Farmer not found" });

    farmer.status = status;
    await farmer.save();

    // If completed, update bookings pendingPayment
    if (status === "completed") {
      const result = await Booking.updateMany(
        { farmer: id, pendingPayment: { $gt: 0 } },
        { $set: { pendingPayment: 0 } }
      );
      console.log(`${result.modifiedCount} bookings updated to 0 pendingPayment`);
    }

    return res.status(200).json({ message: "Farmer status updated", data: farmer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getBookings = async (req, res) => {
  try {
    let bookings = await Booking.find({}).lean();

    for (let b of bookings) {
      // Populate farmer
      if (b.farmer && mongoose.Types.ObjectId.isValid(b.farmer)) {
        const farmer = await Farmer.findById(b.farmer).lean();
        b.farmer = farmer
          ? { _id: farmer._id, fullName: farmer.fullName, status: farmer.status }
          : null;
      }

      // Populate cropGroup
      if (b.cropGroup && mongoose.Types.ObjectId.isValid(b.cropGroup)) {
        const cg = await CropGroup.findById(b.cropGroup).lean();
        b.cropGroup = cg ? { _id: cg._id, name: cg.name } : { name: b.cropGroup };
      }

      // Compute total quantity
      const totalQty = b.varieties?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
      b.quantity = totalQty;

      // Compute total amount
      const totalAmount =
        b.varieties?.reduce(
          (sum, v) => sum + (v.quantity || 0) * (v.ratePerUnit || 0),
          0
        ) || b.finalTotalPrice || b.totalPayment || 0;
      b.amount = totalAmount;
    }

    res.status(200).json({ message: "Bookings fetched", bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// DELETE booking by ID
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate booking ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch farmer to check status
    const farmer = await Farmer.findById(booking.farmer);
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const qty = Number(booking.quantity) || 0;
    let varietyRef = null;

    if (mongoose.Types.ObjectId.isValid(String(booking.variety))) {
      varietyRef = booking.variety;
    }

    // Only adjust Stock and TopCrop if farmer status is "pending"
    if (farmer.status === "pending") {
      // ---------- Restore Stock ----------
      if (!varietyRef) {
        const cv = await CropVariety.findOne({ name: booking.variety });
        if (cv) varietyRef = cv._id;
      }

      if (varietyRef) {
        const stockDoc = await Stock.findOne({ variety: varietyRef });
        if (stockDoc) {
          stockDoc.quantity += qty;
          stockDoc.lastUpdated = new Date();
          await stockDoc.save();
        }
      }

      // ---------- Adjust TopCrop ----------
      const topCropFilter = varietyRef
        ? { varietyRef }
        : { varietyName: booking.variety };
      const topCropDoc = await TopCrop.findOne(topCropFilter);
      if (topCropDoc) {
        topCropDoc.bookedQuantity = Math.max(
          topCropDoc.bookedQuantity - qty,
          0
        );
        topCropDoc.lastBookedAt = new Date();
        await topCropDoc.save();
      }
    }

    // ---------- Delete booking ----------
    await booking.deleteOne();

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({ message: "Server error" });
  }
};