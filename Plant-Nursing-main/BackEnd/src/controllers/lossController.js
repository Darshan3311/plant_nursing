// controllers/lossController.js
import Loss from "../models/Loss.js";
import CropGroup from "../models/CropGroup.js";
import CropVariety from "../models/CropVariety.js";
import mongoose from "mongoose";

// Create a new loss
export const createLoss = async (req, res) => {
  try {
    const { group, variety, date, description,value, status } = req.body;
    // validate references
    const groupExists = await CropGroup.findById(group);
    if (!groupExists) {
      return res.status(400).json({ message: "Invalid crop group" });
    }

    const varietyExists = await CropVariety.findById(variety);
    if (!varietyExists) {
      return res.status(400).json({ message: "Invalid crop variety" });
    }

    const loss = new Loss({
      group,
      variety,
      date,
      value,
      description,
      status: status || "Pending",
    });

    await loss.save();

    res.status(201).json(loss);
  } catch (err) {
    console.error("Error creating loss:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllLosses = async (req, res) => {
  try {
    // quick debug
    // console.log("GET /losses called");

    const losses = await Loss.find()
      .populate("group", "name")
      .populate("variety", "name")
      .exec();
   

    return res.status(200).json(losses);
  } catch (err) {
    console.error("Error fetching losses:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update loss
export const updateLoss = async (req, res) => {
  try {
    const { group, variety, date, description, value, amount, status } = req.body;
    const updates = {};
    if (description !== undefined) {
      updates.description = description;

    }
    if (status !== undefined) {
      updates.status = status;

    }
    // Always save into `value` field (schema expects this)
    const rawAmount = value ?? amount;
    if (rawAmount !== undefined && rawAmount !== "") {
      updates.value = Number(rawAmount); 
      if (Number.isNaN(updates.value)) {
        console.error("❌ Invalid amount provided:", rawAmount);
        return res.status(400).json({ message: "Invalid amount" });
      }
    }
    if (date) {
      const d = new Date(date);
      if (isNaN(d)) {
        console.error("❌ Invalid date provided:", date);
        return res.status(400).json({ message: "Invalid date" });
      }
      updates.date = d;
    }
    // Resolve group
    const resolveGroupId = async (groupInput) => {
      if (!groupInput) return undefined;
      if (mongoose.Types.ObjectId.isValid(groupInput)) {
        return groupInput;
      }
      const name = String(groupInput).trim();
      if (!name) return undefined;
      let g = await CropGroup.findOne({ name: new RegExp(`^${name}$`, "i") });
      if (!g) {
        g = await CropGroup.create({ name });
      }
      return g._id;
    };
    // Resolve variety
    const resolveVarietyId = async (varInput, groupId) => {
      if (!varInput) return undefined;
      if (mongoose.Types.ObjectId.isValid(varInput)) {
        return varInput;
      }
      const name = String(varInput).trim();
      if (!name) return undefined;
      const query = { name: new RegExp(`^${name}$`, "i") };
      if (groupId) query.group = groupId;
      let v = await CropVariety.findOne(query);
      if (!v) {
        v = await CropVariety.create({ name, group: groupId || undefined });
      }
      return v._id;
    };
    if (group !== undefined) {
      const gid = await resolveGroupId(group);
      if (gid) {
        updates.group = gid;
      }
    }
    if (variety !== undefined) {
      const vid = await resolveVarietyId(variety, updates.group);
      if (vid) {
        updates.variety = vid;
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }
    const updated = await Loss.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("group", "name")
      .populate("variety", "name");
    if (!updated) {
      return res.status(404).json({ message: "Loss not found" });
    }
    return res.json(updated);
  } catch (err) {
    console.error("❌ Error updating loss:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete loss
export const deleteLoss = async (req, res) => {
  try {
    const deleted = await Loss.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Loss not found" });

    res.json({ message: "Loss deleted successfully" });
  } catch (err) {
    console.error("Error deleting loss:", err);
    res.status(500).json({ message: "Server error" });
  }
};
