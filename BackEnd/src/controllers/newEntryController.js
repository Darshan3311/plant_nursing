import NewEntry from "../models/NewEntry.js";

export const createNewEntry = async (req, res) => {
  try {
    const { date, cropGroup, varieties } = req.body;
    if (!date) return res.status(400).json({ message: "Date is required" });
    if (!cropGroup || typeof cropGroup !== "string") return res.status(400).json({ message: "cropGroup (string) is required" });
    if (!Array.isArray(varieties) || varieties.length === 0) return res.status(400).json({ message: "At least one variety is required" });

    const cleaned = varieties.map(v => {
      if (!v.variety || typeof v.variety !== "string") {
        throw new Error("Each variety must have a variety name (string)");
      }
      // Save only the variety name; quantity will be managed via bookings/schedules
      return { variety: v.variety };
    });

    const entry = new NewEntry({
      date,
      cropGroup,
      varieties: cleaned
    });

    const saved = await entry.save();
    return res.status(201).json({ message: "Crop entry created successfully", entry: saved });
  } catch (err) {
    console.error("Error creating crop entry:", err);
    return res.status(500).json({ message: "Failed to create crop entry", error: err.message });
  }
};

export const updateNewEntryVarieties = async (req, res) => {
  try {
    const { id } = req.params;
    let { varieties } = req.body;

    if (!id) return res.status(400).json({ message: "Missing id parameter" });
    if (!Array.isArray(varieties) || varieties.length === 0) {
      return res.status(400).json({ message: "varieties (non-empty array) is required" });
    }

    // Clean input: accept objects with {variety} or strings
    const cleaned = varieties.map((v) => {
      if (typeof v === 'string') {
        if (!v.trim()) throw new Error('Variety name cannot be empty');
        return { variety: v.trim() };
      }
      if (!v?.variety || typeof v.variety !== 'string') {
        throw new Error('Each item must have a variety name (string)');
      }
      return { variety: v.variety.trim() };
    });

    const updated = await NewEntry.findByIdAndUpdate(
      id,
      { $set: { varieties: cleaned } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Crop entry not found' });

    return res.json({ message: 'Varieties updated successfully', entry: updated });
  } catch (err) {
    console.error('Error updating crop varieties:', err);
    return res.status(500).json({ message: 'Failed to update crop varieties', error: err.message });
  }
};

export const getNewEntries = async (req, res) => {
  try {
    const entries = await NewEntry.find().sort({ createdAt: -1 }).lean();
    // send them as-is: entries[i].cropGroup is string, varieties is array of {variety}
    return res.json(entries);
  } catch (err) {
    console.error("Error fetching crop entries:", err);
    return res.status(500).json({ message: "Failed to fetch crop entries", error: err.message });
  }
};

export const deleteNewEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await NewEntry.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({ message: "Crop entry not found" });
    }
    return res.json({ message: "Crop entry deleted" });
  } catch (err) {
    console.error("Error deleting crop entry:", err);
    return res.status(500).json({ message: "Failed to delete crop entry", error: err.message });
  }
};
