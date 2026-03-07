import React, { useState } from "react";

const RecentAttendanceTable = ({ logs = [] }) => {
  const [modalImage, setModalImage] = useState(null);

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const groupLogsByEmployeeAndDate = (logs) => {
    const grouped = {};

    logs.forEach((log) => {
      const dateKey = new Date(log.timestamp).toDateString();
      const key = `${log.employeeName}-${dateKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          employeeName: log.employeeName,
          date: dateKey,
          checkIn: null,
          checkOut: null,
        };
      }

      if (log.type === "check-in") {
        grouped[key].checkIn = log;
      } else if (log.type === "check-out") {
        grouped[key].checkOut = log;
      }
    });

    return Object.values(grouped);
  };

  const groupedLogs = groupLogsByEmployeeAndDate(logs);

  return (
    <div className="overflow-x-auto rounded shadow bg-white w-full mt-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4 py-3 border-b">
        Recent Attendance Logs
      </h2>
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Check-In</th>
            <th className="px-4 py-3">Check-Out</th>
            <th className="px-4 py-3">Hours</th>
            <th className="px-4 py-3">Office (In)</th>
            <th className="px-4 py-3">Office (Out)</th>
            <th className="px-4 py-3">Image (In)</th>
            <th className="px-4 py-3">Image (Out)</th>
          </tr>
        </thead>
        <tbody className="text-gray-800">
          {groupedLogs.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
                No recent attendance
              </td>
            </tr>
          ) : (
            groupedLogs.map((entry, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-medium">
                  {entry.employeeName || "Unknown"}
                </td>

                {/* Check-in */}
                <td className="px-4 py-2">
                  {entry.checkIn ? (
                    <span className=" text-green-500">
                      {new Date(entry.checkIn.timestamp).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {entry.checkOut ? (
                    <span className=" text-blue-500">
                      {new Date(entry.checkOut.timestamp).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-2">
                  {entry.checkIn && entry.checkOut
                    ? (() => {
                        const start = new Date(entry.checkIn.timestamp);
                        const end = new Date(entry.checkOut.timestamp);
                        const diffMs = end - start;
                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                        return `${hours}h ${minutes}m`;
                      })()
                    : "—"}
                </td>
                {/* Office info */}
                <td className="px-4 py-2">
                  <span
                    className={`font-medium ${
                      (entry.checkIn?.officeName === "Pallikaranai" &&
                        "px-2 py-1 rounded-full text-white bg-green-500 text-xs") ||
                      (entry.checkIn?.officeName === "Velechery" &&
                        "px-2 py-1 rounded-full text-white bg-blue-500 text-xs") ||
                      "text-red-600"
                    }`}
                  >
                    {entry.checkIn?.officeName || "—"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`font-medium ${
                      (entry.checkOut?.officeName === "Pallikaranai" &&
                        "px-2 py-1 rounded-full text-white bg-green-500 text-xs") ||
                      (entry.checkOut?.officeName === "Velechery" &&
                        "px-2 py-1 rounded-full text-white bg-blue-500 text-xs") ||
                      "text-red-600"
                    }`}
                  >
                  {entry.checkOut?.officeName || "—"}</span>
                </td>

                {/* Images */}
                <td className="px-4 py-2">
                  {entry.checkIn?.image ? (
                    <img
                      src={entry.checkIn.image}
                      alt="Check-In"
                      className="w-14 h-14 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => handleImageClick(entry.checkIn.image)}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {entry.checkOut?.image ? (
                    <img
                      src={entry.checkOut.image}
                      alt="Check-Out"
                      className="w-14 h-14 object-cover rounded border cursor-pointer hover:opacity-80"
                      onClick={() => handleImageClick(entry.checkOut.image)}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Image modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="bg-white rounded-lg overflow-hidden p-4 max-w-[90%] max-h-[90%]">
            <img
              src={modalImage}
              alt="Preview"
              className="max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
       
    </div>
  );
};

export default RecentAttendanceTable;