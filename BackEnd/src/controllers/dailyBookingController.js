import DailyBooking from "../models/DailyBooking.js";
import Income from "../models/Income.js";

// POST /daily-bookings
// Create a simple daily booking and record income
export const createDailyBooking = async (req, res) => {
  try {
    const { name, number, address, crop, variety, rate, quantity, total, date } = req.body || {};

    const parsedRate = Number(rate);
    const parsedQty = Number(quantity);
    const parsedTotal = Number(total);

    if (!name || !number || !address || !crop || !variety) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if ([parsedRate, parsedQty, parsedTotal].some((n) => isNaN(n) || n <= 0)) {
      return res.status(400).json({ message: "Invalid numeric values" });
    }

    const payload = {
      name,
      number,
      address,
      crop,
      variety,
      rate: parsedRate,
      quantity: parsedQty,
      total: parsedTotal,
    };
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) payload.date = d;
    }

    const booking = await DailyBooking.create(payload);

    return res.status(201).json({ message: "Daily booking created", data: booking });
  } catch (err) {
    console.error("createDailyBooking error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Helper: enforce 48h window
const isWithin48h = (date) => {
  const created = new Date(date).getTime();
  const now = Date.now();
  const diffMs = now - created;
  return diffMs <= 48 * 60 * 60 * 1000; // 48 hours
};

// PUT /daily-bookings/:id
export const updateDailyBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await DailyBooking.findById(id);
    if (!existing) return res.status(404).json({ message: "Daily booking not found" });

    if (!isWithin48h(existing.createdAt)) {
      return res.status(403).json({ message: "This booking is locked from edits after 48 hours" });
    }

    const { name, number, address, crop, variety, rate, quantity, total, date } = req.body || {};

    // Validate numeric fields if provided
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (number !== undefined) updates.number = number;
    if (address !== undefined) updates.address = address;
    if (crop !== undefined) updates.crop = crop;
    if (variety !== undefined) updates.variety = variety;
    if (rate !== undefined) {
      const r = Number(rate); if (isNaN(r) || r <= 0) return res.status(400).json({ message: "Invalid rate" });
      updates.rate = r;
    }
    if (quantity !== undefined) {
      const q = Number(quantity); if (isNaN(q) || q <= 0) return res.status(400).json({ message: "Invalid quantity" });
      updates.quantity = q;
    }
    if (total !== undefined) {
      const t = Number(total); if (isNaN(t) || t <= 0) return res.status(400).json({ message: "Invalid total" });
      updates.total = t;
    }
    if (date !== undefined) {
      const d = new Date(date); if (isNaN(d.getTime())) return res.status(400).json({ message: "Invalid date" });
      updates.date = d;
    }

    const updated = await DailyBooking.findByIdAndUpdate(id, { $set: updates }, { new: true });

    return res.json({ message: "Daily booking updated", data: updated });
  } catch (err) {
    console.error("updateDailyBooking error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /daily-bookings/:id
export const deleteDailyBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await DailyBooking.findById(id);
    if (!existing) return res.status(404).json({ message: "Daily booking not found" });

    if (!isWithin48h(existing.createdAt)) {
      return res.status(403).json({ message: "This booking is locked from deletion after 48 hours" });
    }

    await DailyBooking.findByIdAndDelete(id);

    return res.json({ message: "Daily booking deleted" });
  } catch (err) {
    console.error("deleteDailyBooking error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
