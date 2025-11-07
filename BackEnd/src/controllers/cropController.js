import CropGroup from "../models/CropGroup.js";
import CropVariety from "../models/CropVariety.js";

// ✅ Add new crop group
export const addCropGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Group name required" });

    const existing = await CropGroup.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Group already exists" });

    const group = await CropGroup.create({ name });
    res.status(201).json(group);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating crop group", error: err.message });
  }
};
// ✅ Add variety (linked to group)
export const addCropVariety = async (req, res) => {
  // console.log(req.body);
  try {
    const { groupId, name, defaultUnit, sku } = req.body;
    if (!groupId || !name)
      return res.status(400).json({ message: "Group and name required" });

    const group = await CropGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const variety = await CropVariety.create({
      group: groupId,
      name,
      defaultUnit,
      sku,
    });
    // console.log(variety);
    res.status(201).json(variety);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating variety", error: err.message });
  }
};
// ✅ Fetch all crop groups
export const getAllCropGroups = async (req, res) => {
  try {
    const groups = await CropGroup.find().sort("name");
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch crop groups" });
  }
};
// ✅ Fetch varieties by group
export const getVarietiesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const varieties = await CropVariety.find({ group: groupId }).sort("name");
    res.json(varieties);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch varieties" });
  }
};
