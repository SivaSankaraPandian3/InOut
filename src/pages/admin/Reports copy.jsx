import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";

import { Link } from "react-router-dom";

const getDatesInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const dates = [];
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const Report = () => {
  const [logs, setLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
const token = localStorage.getItem('token');
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(API_ENDPOINTS.getRecentAttendanceLogs, { headers }) // replace with your endpoint
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Failed to fetch logs:", err));
  }, []);

  const [year, month] = selectedMonth.split("-").map(Number);
  const allDates = getDatesInMonth(year, month - 1);

  const employees = [...new Set(logs.map((log) => log.employeeName || "Unknown"))];

  const filteredLogs = logs.filter((log) => {
    const date = new Date(log.timestamp);
    return date.getFullYear() === year && date.getMonth() === month - 1;
  });

  const grouped = {};
  filteredLogs.forEach((log) => {
    const emp = log.employeeName || "Unknown";
    const dateKey = new Date(log.timestamp).toDateString();
    if (!grouped[emp]) grouped[emp] = {};
    if (!grouped[emp][dateKey]) grouped[emp][dateKey] = { checkIn: null, checkOut: null };
    if (log.type === "check-in") {
      if (!grouped[emp][dateKey].checkIn || new Date(log.timestamp) < new Date(grouped[emp][dateKey].checkIn.timestamp)) {
        grouped[emp][dateKey].checkIn = log;
      }
    }
    if (log.type === "check-out") {
      if (!grouped[emp][dateKey].checkOut || new Date(log.timestamp) > new Date(grouped[emp][dateKey].checkOut.timestamp)) {
        grouped[emp][dateKey].checkOut = log;
      }
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monthly Attendance Report</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {employees.length === 0 ? (
        <p className="text-gray-500">No attendance data for this month.</p>
      ) : (
        employees.map((employee) => {
          let presentCount = 0;
          let absentCount = 0;
          let leaveCount = 0;

          return (
            <div key={employee} className="mb-10 border shadow bg-white rounded">
              <h2 className="text-lg font-semibold bg-gray-100 px-4 py-3 border-b">{employee}</h2>

              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Check-In</th>
                    <th className="px-4 py-2">Check-Out</th>
                    <th className="px-4 py-2">Office (In)</th>
                    <th className="px-4 py-2">Office (Out)</th>
                    <th className="px-4 py-2">Work Hours</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allDates.map((dateObj, idx) => {
                    const dateKey = dateObj.toDateString();
                    const today = new Date();
                    const isFuture = dateObj > today;
                    const isSunday = dateObj.getDay() === 0;

                    const attendance = grouped[employee]?.[dateKey];
                    const checkIn = attendance?.checkIn;
                    const checkOut = attendance?.checkOut;

                    const checkInTime = checkIn ? new Date(checkIn.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
                    const checkOutTime = checkOut ? new Date(checkOut.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

                    let workHours = "—";
                    if (checkIn && checkOut) {
                      const start = new Date(checkIn.timestamp);
                      const end = new Date(checkOut.timestamp);
                      const diff = end - start;
                      const h = Math.floor(diff / (1000 * 60 * 60));
                      const m = Math.floor((diff / (1000 * 60)) % 60);
                      workHours = `${h}h ${m}m`;
                    }

                    let status = "—";
                    if (isFuture) {
                      status = "";
                    } else if (isSunday) {
                      status = "Leave";
                      leaveCount++;
                    } else if (checkIn) {
                      status = "Present";
                      presentCount++;
                    } else {
                      status = "Absent";
                      absentCount++;
                    }

                    if (isFuture) return null;

                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{dateKey}</td>
                        <td className="px-4 py-2">{checkInTime}</td>
                        <td className="px-4 py-2">{checkOutTime}</td>
                        <td className="px-4 py-2">{checkIn?.officeName || "—"}</td>
                        <td className="px-4 py-2">{checkOut?.officeName || "—"}</td>
                        <td className="px-4 py-2">{workHours}</td>
                        <td className="px-4 py-2 font-semibold">
                          {status === "Present" && <span className="text-green-600">Present</span>}
                          {status === "Absent" && <span className="text-red-500">Absent</span>}
                          {status === "Leave" && <span className="text-blue-500">Leave</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="px-4 py-3 border-t text-sm text-gray-700 bg-gray-50 flex justify-between">
                <div><strong>Present Days:</strong> {presentCount}</div>
                <div><strong>Absent Days:</strong> {absentCount}</div>
                <div><strong>Leaves (Sunday):</strong> {leaveCount}</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Report;
