import Asset from "../models/Asset.js";
import Nutrient from "../models/Nutrient.js";
import CropGroup from "../models/CropGroup.js";
import CropVariety from "../models/CropVariety.js";
import Stock from "../models/Stock.js";

// --- ASSET ---
// GET /assets?category=any or ?category=other
export const getAssets = async (req, res) => {
  try {
    const category = req.query.category?.toLowerCase();
    let query = {};

    if (category === "other") {
      // Only "other"
      query.type = "other";
    } else if (category) {
      query.type = { $ne: "other" };
    }
    const assets = await Asset.find(query).sort({ createdAt: -1 });
    return res.json(assets);
  } catch (err) {
    console.error("getAssets error:", err);
    return res.status(500).json({ message: "Failed to fetch assets" });
  }
};


// POST /asset
export const createAsset = async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /asset/:id  (NEW)
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAsset = await Asset.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
    });
    if (!updatedAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.status(200).json(updatedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// DELETE /asset/:id (NEW)
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAsset = await Asset.findByIdAndDelete(id);
    if (!deletedAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }
    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- NUTRIENT ---
// GET /assets/nutrients
export const getNutrients = async (req, res) => {
  try {
    const nutrients = await Nutrient.find().sort({ name: 1 });
    return res.json(nutrients);
  } catch (err) {
    console.error("getNutrients error:", err);
    return res.status(500).json({ message: "Failed to fetch nutrients" });
  }
};

// POST /nutrient
export const createNutrient = async (req, res) => {
  try {
    const nutrient = new Nutrient(req.body);
    await nutrient.save();
    res.status(201).json(nutrient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /nutrient/:id (NEW)
export const updateNutrient = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNutrient = await Nutrient.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedNutrient) {
      return res.status(404).json({ message: "Nutrient not found" });
    }
    res.status(200).json(updatedNutrient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// DELETE /nutrient/:id (NEW)
export const deleteNutrient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNutrient = await Nutrient.findByIdAndDelete(id);
    if (!deletedNutrient) {
      return res.status(404).json({ message: "Nutrient not found" });
    }
    res.status(200).json({ message: "Nutrient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// --- STOCK ---
export const getStock = async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate({
        path: "variety",
        populate: { path: "group", select: "name" },
      })
      .sort({ updatedAt: -1 });
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stock:", error);
    res.status(500).json({ message: "Failed to fetch stock", error: error.message });
  }
};

// GET /assets/stock/crop-groups
export const getCropGroups = async (req, res) => {
  try {
    const groups = await CropGroup.find().sort({ name: 1 });
    const payload = groups.map((g) => ({ id: g._id.toString(), name: g.name }));
    return res.json(payload);
  } catch (err) {
    console.error("getCropGroups error:", err);
    return res.status(500).json({ message: "Failed to fetch crop groups" });
  }
};

// GET /assets/stock/varieties
export const getVarieties = async (req, res) => {
  // ... (this function remains the same)
  try {
    const { cropGroup } = req.query;
    if (!cropGroup) return res.status(400).json({ message: "cropGroup query is required" });
    const varieties = await CropVariety.find({ group: cropGroup }).sort({ name: 1 });
    const payload = varieties.map((v) => ({ id: v._id.toString(), name: v.name }));
    return res.json(payload);
  } catch (err) {
    console.error("getVarieties error:", err);
    return res.status(500).json({ message: "Failed to fetch varieties" });
  }
};

// POST /assets/stock
export const upsertStock = async (req, res) => {
  // ... (this function remains the same for creating stock)
  try {
    const { varietyId, quantity, lowerLimit, unit } = req.body;
    if (!varietyId) return res.status(400).json({ message: "varietyId required" });
    const stock = await Stock.findOneAndUpdate(
      { variety: varietyId },
      { $set: { quantity, lowerLimit, unit, lastUpdated: new Date() }, $setOnInsert: { variety: varietyId } },
      { new: true, upsert: true }
    );
    return res.json(stock);
  } catch (err) {
    console.error("upsertStock error:", err);
    return res.status(500).json({ message: "Failed to save stock" });
  }
};

// PUT /stock/:id (NEW)
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedStock = await Stock.findByIdAndUpdate(id, req.body, { new: true })
            .populate({
                path: "variety",
                populate: { path: "group", select: "name" },
            });

        if (!updatedStock) {
            return res.status(404).json({ message: "Stock item not found" });
        }
        res.status(200).json(updatedStock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// DELETE /stock/:id (NEW)
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStock = await Stock.findByIdAndDelete(id);
    if (!deletedStock) {
      return res.status(404).json({ message: "Stock item not found" });
    }
    res.status(200).json({ message: "Stock item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};