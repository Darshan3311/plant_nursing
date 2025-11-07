// src/pages/SowingSchedulePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "../../lib/axios";

/**
 * Backend returns an array of schedules:
 * [
 *   {
 *     _id, name, startDate, endDate, status,
 *     groups: [
 *       {
 *         groupId, groupName?,
 *         varieties: [
 *           {
 *             varietyId, varietyName?,
 *             bookings: [{ bookingId, farmerId, quantity, farmerName? }],
 *             total, completed
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 *
 * GET  /schedules -> returns schedules array
 * PATCH /schedules/update -> { action: 'updateVarietyProgress', payload: { scheduleId, groupId, varietyId, completed } }
 */

/* ---------- fallback sample ---------- */
const defaultSchedules = [
  {
    _id: "64f200a17d9f2a1234567001",
    name: "Schedule 1 (1 Aug - 5 Aug)",
    startDate: "2025-08-01T00:00:00.000Z",
    endDate: "2025-08-05T23:59:59.999Z",
    status: "pending",
    groups: [
      {
        groupId: "64f200b27d9f2a1234567002",
        groupName: "Tomato",
        varieties: [
          {
            varietyId: "64f200c37d9f2a1234567003",
            varietyName: "3171",
            bookings: [
              {
                bookingId: "64f200d47d9f2a1234567004",
                farmerId: "64f200e57d9f2a1234567005",
                quantity: 5000,
                farmerName: "Yash Patil",
              },
              {
                bookingId: "64f200f67d9f2a1234567006",
                farmerId: "64f201077d9f2a1234567007",
                quantity: 3000,
                farmerName: "Rajesh Shinde",
              },
            ],
            total: 8000,
            completed: 2000,
          },
        ],
      },
    ],
  },
];

/* ---------- helpers ---------- */
const formatRange = (start, end) => {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts = { day: "numeric", month: "short" };
    return `${s.toLocaleDateString("en-GB", opts)} — ${e.toLocaleDateString(
      "en-GB",
      opts
    )}`;
  } catch {
    return `${start} - ${end}`;
  }
};

const SowingSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedVarietyId, setSelectedVarietyId] = useState(null);
  const [completedQtyInput, setCompletedQtyInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDetails, setModalDetails] = useState({
    scheduleLabel: "",
    groupLabel: "",
    varietyLabel: "",
    bookings: [],
    totalQuantity: 0,
  });

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.get("/schedules");
      const data = res?.data;
      if (Array.isArray(data) && data.length > 0) {
        setSchedules(data);
        const first = data[0];
        setSelectedScheduleId(first._id);
        const firstGroup = first.groups?.[0];
        if (firstGroup) {
          setSelectedGroupId(firstGroup.groupId);
          setSelectedVarietyId(firstGroup.varieties?.[0]?.varietyId || null);
        }
      } else {
        setSchedules(defaultSchedules);
        const first = defaultSchedules[0];
        setSelectedScheduleId(first._id);
        setSelectedGroupId(first.groups[0].groupId);
        setSelectedVarietyId(first.groups[0].varieties[0].varietyId);
        setMessage("No schedules from server — showing fallback data.");
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setSchedules(defaultSchedules);
      const first = defaultSchedules[0];
      setSelectedScheduleId(first._id);
      setSelectedGroupId(first.groups[0].groupId);
      setSelectedVarietyId(first.groups[0].varieties[0].varietyId);
      setMessage("Failed to load schedules — showing fallback data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const currentSchedule = schedules.find((s) => s._id === selectedScheduleId);
  const currentGroup =
    currentSchedule?.groups?.find((g) => g.groupId === selectedGroupId) || null;
  const currentVariety =
    currentGroup?.varieties?.find((v) => v.varietyId === selectedVarietyId) ||
    null;

  const currentTotal = currentVariety?.total || 0;
  const currentCompleted = currentVariety?.completed || 0;
  const remaining = Math.max(0, currentTotal - currentCompleted);
  const percent = currentTotal ? (currentCompleted / currentTotal) * 100 : 0;

  const handleScheduleChange = (e) => {
    const sid = e.target.value;
    setSelectedScheduleId(sid);
    const sch = schedules.find((s) => s._id === sid);
    if (sch?.groups?.[0]) {
      setSelectedGroupId(sch.groups[0].groupId);
      setSelectedVarietyId(sch.groups[0].varieties?.[0]?.varietyId || null);
    } else {
      setSelectedGroupId(null);
      setSelectedVarietyId(null);
    }
    setMessage("");
  };

  const handleGroupChange = (e) => {
    const gid = e.target.value;
    setSelectedGroupId(gid);
    const group =
      currentSchedule?.groups?.find((g) => g.groupId === gid) || null;
    setSelectedVarietyId(group?.varieties?.[0]?.varietyId || null);
    setMessage("");
  };

  const handleVarietyChange = (e) => {
    setSelectedVarietyId(e.target.value);
    setMessage("");
  };

  const handleAddCompleted = async () => {
    const added = parseInt(completedQtyInput, 10);
    if (isNaN(added) || added <= 0)
      return setMessage("Please enter a valid positive quantity.");
    if (!currentVariety) return setMessage("No variety selected.");
    if (currentCompleted + added > currentTotal)
      return setMessage(
        "Warning: entered quantity exceeds total planned quantity."
      );

    setCompletedQtyInput("");
    setMessage(`Updating... +${added.toLocaleString("en-IN")} Seeds`);

    try {
      const payload = {
        action: "updateVarietyProgress",
        payload: {
          scheduleId: selectedScheduleId,
          groupId: selectedGroupId,
          varietyId: selectedVarietyId,
          completed: (currentCompleted || 0) + added,
        },
      };
      await axios.patch("/schedules/update", payload);

      // Refetch schedules from server to reload fresh data
      const res = await axios.get("/schedules");
      const data = res?.data;
      if (Array.isArray(data) && data.length > 0) {
        setSchedules(data);
        setMessage(
          `Successfully added +${added.toLocaleString("en-IN")} Seeds.`
        );
      } else {
        setMessage(`Added locally, but no data returned from server.`);
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Update failed:", err);
      setMessage(
        err?.response?.data?.message || "Failed to update on server. Try again."
      );
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleViewDetails = (schedule, group, variety) => {
    setModalDetails({
      scheduleLabel: schedule
        ? `${schedule.name} (${formatRange(
            schedule.startDate,
            schedule.endDate
          )})`
        : "",
      groupLabel: group?.groupName || group?.groupId || "Group",
      varietyLabel: variety?.varietyName || variety?.varietyId || "Variety",
      bookings: variety?.bookings || [],
      totalQuantity: variety?.total || 0,
    });
    setIsModalOpen(true);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center font-inter">
        <p className="text-xl font-semibold">Loading schedules...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-5 font-inter">
      <div className="flex justify-between items-center mb-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-700">
          Farmer Order Management
        </h1>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Task Completion Update */}
        <div
          id="taskCompletionPanel"
          className="bg-white p-5 rounded-xl shadow border border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Task Completion Update
          </h2>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
            {/* Schedule */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-gray-700 font-semibold mb-2">
                Select Schedule
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
                value={selectedScheduleId || ""}
                onChange={handleScheduleChange}
              >
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name ? s.name : formatRange(s.startDate, s.endDate)}
                  </option>
                ))}
              </select>
            </div>
            {/* Group */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-gray-700 font-semibold mb-2">
                Select Group
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
                value={selectedGroupId || ""}
                onChange={handleGroupChange}
              >
                {currentSchedule?.groups?.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.groupName || g.groupId}
                  </option>
                ))}
              </select>
            </div>
            {/* Variety */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-gray-700 font-semibold mb-2">
                Select Variety
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg text-base"
                value={selectedVarietyId || ""}
                onChange={handleVarietyChange}
              >
                {currentGroup?.varieties?.map((v) => (
                  <option key={v.varietyId} value={v.varietyId}>
                    {v.varietyName || v.varietyId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentVariety ? (
            <div className="task-progress mt-4 pt-4 border-t">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow min-w-[300px]">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700">
                    Progress Details
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-5 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full text-white text-xs font-bold flex items-center justify-end pr-2"
                      style={{ width: `${percent}%` }}
                    >
                      {percent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 font-bold">
                      Completed: {currentCompleted.toLocaleString("en-IN")}{" "}
                      Seeds
                    </span>
                    <span className="text-red-500 font-bold">
                      Remaining: {remaining.toLocaleString("en-IN")} Seeds
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    className="p-3 border border-gray-300 rounded-lg text-base"
                    placeholder="Add completed Seeds"
                    value={completedQtyInput}
                    onChange={(e) => setCompletedQtyInput(e.target.value)}
                  />
                  <button
                    className="bg-green-500 text-white px-5 py-3 rounded-lg font-bold text-base"
                    onClick={handleAddCompleted}
                  >
                    Add
                  </button>
                </div>
              </div>
              {message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-white font-semibold ${
                    message.toLowerCase().includes("warning") ||
                    message.toLowerCase().includes("failed")
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t">
              <div className="p-4 bg-yellow-100 rounded-lg text-sm text-yellow-800 border border-yellow-200">
                Select a schedule, group, and variety to see progress and add
                updates.
              </div>
            </div>
          )}
        </div>

        {/* Bottom horizontal scroller - Order Details */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2 pb-2 border-b-2 border-gray-200">
            Order Details (by Schedule)
          </h2>
          <div className="flex overflow-x-auto space-x-6 py-4">
            {schedules.map((schedule) => {
              const periodHeader = schedule.name
                ? `${schedule.name} (${formatRange(
                    schedule.startDate,
                    schedule.endDate
                  )})`
                : formatRange(schedule.startDate, schedule.endDate);
              const varietiesFlat = (schedule.groups || []).flatMap(
                (g) => g.varieties || []
              );
              const allCompleted =
                varietiesFlat.length > 0 &&
                varietiesFlat.every(
                  (v) => (v.completed || 0) >= (v.total || 0)
                );
              const anyProgress = varietiesFlat.some(
                (v) => (v.completed || 0) > 0
              );
              let badgeClass = "bg-orange-400",
                badgeText = "Pending";
              if (varietiesFlat.length === 0) {
                badgeClass = "bg-gray-400";
                badgeText = "No Tasks";
              } else if (allCompleted) {
                badgeClass = "bg-green-500";
                badgeText = "Completed";
              } else if (!anyProgress) {
                badgeClass = "bg-red-500";
                badgeText = "Not Started";
              }

              return (
                <div
                  key={schedule._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border flex-shrink-0 w-96"
                >
                  <div className="bg-gray-100 text-gray-800 p-4 text-center font-bold flex justify-between items-center border-b">
                    <span>{periodHeader}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold text-white ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {schedule.groups?.length === 0 && (
                      <div className="text-sm text-gray-600">
                        No groups for this schedule.
                      </div>
                    )}

                    {schedule.groups?.map((group) => (
                      <div key={group.groupId} className="mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                          Group: {group.groupName || group.groupId}
                        </div>

                        {group.varieties?.map((variety) => {
                          const percentLocal = variety.total
                            ? (variety.completed / variety.total) * 100
                            : 0;
                          return (
                            <div
                              key={variety.varietyId}
                              className="mb-4 border rounded-lg p-3 bg-gray-50"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold">
                                  {variety.varietyName ||
                                    String(variety.varietyId)}
                                </span>
                                <span className="text-gray-600 font-bold">
                                  {(variety.total || 0).toLocaleString("en-IN")}{" "}
                                  Seeds
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-4 mb-1 overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${percentLocal}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs mb-3">
                                <span className="text-green-600">
                                  Completed:{" "}
                                  {(variety.completed || 0).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>
                                <span className="text-red-500">
                                  Remaining:{" "}
                                  {(
                                    (variety.total || 0) -
                                    (variety.completed || 0)
                                  ).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm flex-1"
                                  onClick={() => {
                                    setSelectedScheduleId(schedule._id);
                                    setSelectedGroupId(group.groupId);
                                    setSelectedVarietyId(variety.varietyId);
                                    // Scroll to the top task completion panel
                                    const panel = document.getElementById(
                                      "taskCompletionPanel"
                                    );
                                    if (panel) {
                                      panel.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                      });
                                    }
                                  }}
                                >
                                  Select
                                </button>
                                <button
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold text-sm flex-1"
                                  onClick={() =>
                                    handleViewDetails(schedule, group, variety)
                                  }
                                >
                                  View Farmer Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-3xl font-bold"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
              Farmer Details
            </h2>
            <p className="mb-4 font-bold text-gray-700">
              {modalDetails.scheduleLabel} — {modalDetails.groupLabel} —{" "}
              {modalDetails.varietyLabel}
            </p>
            <div className="space-y-3">
              {modalDetails.bookings.length === 0 && (
                <div className="text-sm text-gray-600">
                  No bookings found for this variety.
                </div>
              )}
              {modalDetails.bookings.map((b, i) => (
                <div
                  key={b.bookingId || i}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div>
                    <div className="font-semibold">
                      {b.farmerName || b.farmerId || `Farmer ${i + 1}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Booking: {b.bookingId || "—"}
                    </div>
                  </div>
                  <div className="text-green-700 font-bold">
                    {(b.quantity || 0).toLocaleString("en-IN")} Seeds
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 border-t-2 text-gray-800 p-4 rounded-b-lg mt-6 flex justify-between font-bold text-lg">
              <span>Total Quantity</span>
              <span>
                {(modalDetails.totalQuantity || 0).toLocaleString("en-IN")}{" "}
                Seeds
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SowingSchedulePage;
