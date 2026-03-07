import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeaveRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
/*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Fetches all leave requests from the server and updates the component state
   * with the received data.
   *

/*******  3325c697-060c-4f78-ba35-67ddf2d0fe43  *******/
    async function fetchRequests() {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/leaves/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    }
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    await axios.patch(`/api/leaves/${id}`, { status });
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status } : r))
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Leave Requests</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Name</th>
            <th>From</th>
            <th>To</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req._id} className="border-t">
              <td>{req.employeeName}</td>
              <td>{req.fromDate}</td>
              <td>{req.toDate}</td>
              <td>{req.reason}</td>
              <td>{req.status}</td>
              <td className="space-x-2">
                <button onClick={() => updateStatus(req._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded">Approve</button>
                <button onClick={() => updateStatus(req._id, 'Rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveRequestsAdmin;
