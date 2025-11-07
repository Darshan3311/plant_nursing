import NewEntry from "../models/NewEntry.js";

// Create new crop entry
export const createNewEntry = async (req, res) => {
  try {
    const { date, groupId, varietyId, totalTrays, totalPlants, sowingDate, totalMans } = req.body;

    // Basic validation
    if (!groupId || !varietyId || !date) {
      return res.status(400).json({ message: "groupId, varietyId, and date are required" });
    }

    const entry = new NewEntry({
      date,
      groupId,
      varietyId,
      totalTrays,
      totalPlants,
      sowingDate,
      totalMans,
    });

    await entry.save();

    res.status(201).json({ message: "Crop entry created successfully", entry });
  } catch (err) {
    console.error("Error creating crop entry:", err);
    res.status(500).json({ message: "Failed to create crop entry" });
  }
};

// Get all crop entries
export const getNewEntries = async (req, res) => {
  try {
    const entries = await NewEntry.find()
      .populate("groupId", "name")
      .populate("varietyId", "name")
      .sort({ createdAt: -1 });
    console.log(entries)
    res.json(entries);
  } catch (err) {
    console.error("Error fetching crop entries:", err);
    res.status(500).json({ message: "Failed to fetch crop entries" });
  }
};

// Delete entry
export const deleteNewEntry = async (req, res) => {
  try {
    const entry = await NewEntry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Crop entry not found" });
    }

    res.json({ message: "Crop entry deleted" });
  } catch (err) {
    console.error("Error deleting crop entry:", err);
    res.status(500).json({ message: "Failed to delete crop entry" });
  }
};
