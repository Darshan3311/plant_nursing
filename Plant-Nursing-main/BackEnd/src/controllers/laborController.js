import Labor from "../models/labor.js";

// Add labor (either type)
export const addLabor = async (req, res) => {
  try {
    const labor = new Labor(req.body);
    await labor.save();
    res.status(201).json({ success: true, data: labor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add labor", error: err.message });
  }
};
// Get all labors
export const getAllLabors = async (req, res) => {
  try {
    const labors = await Labor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: labors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch labors" });
  }
};
export const updateLabor = async (req, res) => {
  try {
    const updated = await Labor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const deleteLabor = async (req, res) => {
  try {
    await Labor.findByIdAndDelete(req.params.id);
    res.json({ message: "Labor deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
