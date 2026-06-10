import React, { useState } from "react";
import {
  branchToOfficeName,
  extractBranchFromUser,
  findUserForAttendanceLog,
  officePresentBadgeClass,
} from "../../../utils/branches";
import { getLogOfficeName } from "../../../utils/officeLocations";
import {
  getAttendanceImage,
  resolveAttendanceImageUrl,
} from "../../../utils/attendanceImage";

const RecentAttendanceTable = ({ logs = [], allUsers = [] }) => {
  const [modalImage, setModalImage] = useState(null);

  const preferredOfficeForLog = (log) => {
    if (!log) return null;
    if (log.userBranch) return branchToOfficeName(log.userBranch);
    const user = findUserForAttendanceLog(log, allUsers);
    return branchToOfficeName(extractBranchFromUser(user));
  };

  const groupLogsByEmployeeAndDate = (logList) => {
    const grouped = {};

    logList.forEach((log) => {
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
    <div className="uc-table-panel">
      <h2>Recent Attendance Logs</h2>
      <table className="uc-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Hours</th>
            <th>Office (In)</th>
            <th>Office (Out)</th>
            <th>Image (In)</th>
            <th>Image (Out)</th>
          </tr>
        </thead>
        <tbody>
          {groupedLogs.length === 0 ? (
            <tr>
              <td colSpan="8" className="uc-table-empty">
                No recent attendance
              </td>
            </tr>
          ) : (
            groupedLogs.map((entry, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 500 }}>{entry.employeeName || "Unknown"}</td>
                <td className="uc-text-green">
                  {entry.checkIn
                    ? new Date(entry.checkIn.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="uc-text-blue">
                  {entry.checkOut
                    ? new Date(entry.checkOut.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td>
                  {entry.checkIn && entry.checkOut
                    ? (() => {
                        const diffMs =
                          new Date(entry.checkOut.timestamp) - new Date(entry.checkIn.timestamp);
                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                        return `${hours}h ${minutes}m`;
                      })()
                    : "—"}
                </td>
                <td>
                  {(() => {
                    const name = getLogOfficeName(entry.checkIn, preferredOfficeForLog(entry.checkIn));
                    return (
                      <span className={officePresentBadgeClass(name)}>
                        {name}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  {(() => {
                    const name = getLogOfficeName(entry.checkOut, preferredOfficeForLog(entry.checkOut));
                    return (
                      <span className={officePresentBadgeClass(name)}>
                        {name}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  {(() => {
                    const src = resolveAttendanceImageUrl(getAttendanceImage(entry.checkIn));
                    return src ? (
                      <img
                        src={src}
                        alt="Check-In"
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                        onClick={() => setModalImage(src)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      "—"
                    );
                  })()}
                </td>
                <td>
                  {(() => {
                    const src = resolveAttendanceImageUrl(getAttendanceImage(entry.checkOut));
                    return src ? (
                      <img
                        src={src}
                        alt="Check-Out"
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                        onClick={() => setModalImage(src)}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      "—"
                    );
                  })()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalImage && (
        <div
          role="presentation"
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={modalImage}
            alt="Preview"
            style={{ maxHeight: '80vh', maxWidth: '90%', objectFit: 'contain', background: '#fff', padding: 8, borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
};

export default RecentAttendanceTable;
