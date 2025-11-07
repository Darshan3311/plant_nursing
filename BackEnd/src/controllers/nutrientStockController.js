import NutrientStock from "../models/NutrientStock.js";

// POST /nutrient-stock
export const createNutrientStock = async (req, res) => {
  try {
    const { name, amount, lowerLimit, date, crop, varieties, total } = req.body || {};

    // Support both (name, amount) and (crop/varieties, total)
    const resolvedName = name || varieties || crop;
    const resolvedAmount = Number(amount ?? total);
    const resolvedLower = Number(lowerLimit ?? 0);

    if (!resolvedName) return res.status(400).json({ message: "Nutrient name is required" });
    if (isNaN(resolvedAmount) || resolvedAmount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (isNaN(resolvedLower) || resolvedLower < 0) return res.status(400).json({ message: "Invalid lowerLimit" });

    const payload = {
      name: resolvedName,
      amount: resolvedAmount,
      lowerLimit: resolvedLower,
    };

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) payload.date = d;
    }

    const created = await NutrientStock.create(payload);
    return res.status(201).json({ message: "Nutrient stock recorded", data: created });
  } catch (err) {
    console.error("createNutrientStock error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /nutrient-stock
export const listNutrientStock = async (_req, res) => {
  try {
    const docs = await NutrientStock.find().sort({ createdAt: -1 }).limit(200);
    const data = docs.map((d) => ({
      id: d._id,
      name: d.name,
      available: d.amount,
      lowerLimit: d.lowerLimit,
      status: d.amount < d.lowerLimit ? "low" : "ok",
      date: d.date,
    }));
    return res.json({ data });
  } catch (err) {
    console.error("listNutrientStock error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
