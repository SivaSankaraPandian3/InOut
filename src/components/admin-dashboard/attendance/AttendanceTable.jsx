import React from 'react';

const AttendanceTable = ({ records }) => {
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">In Office</th>
          </tr>
        </thead>
        <tbody className="text-gray-800">
          {records.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-6 text-center text-gray-500">No attendance records found</td>
            </tr>
          ) : (
            records.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{record.user?.name}</td>
                <td className="px-4 py-2">{record.user?.email}</td>
                <td className="px-4 py-2 capitalize">
                  <span className={`px-2 py-1 rounded-full text-white ${record.type === 'check-in' ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {record.type}
                  </span>
                </td>
                <td className="px-4 py-2">{record.location}</td>
                <td className="px-4 py-2">{new Date(record.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-2">{new Date(record.timestamp).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {record.isInOffice ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-red-600 font-semibold">No</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
