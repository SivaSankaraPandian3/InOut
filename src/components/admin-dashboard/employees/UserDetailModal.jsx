import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from '../common/Loader';

const UserDetailModal = ({ user, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [last, setLast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');

        const res1 = await axios.get(`/attendance/user/${user._id}/summary/2025/6`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res1.data);

        const res2 = await axios.get(`/attendance/user/${user._id}/last`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLast(res2.data);
      } catch (error) {
        console.error('Error loading user details', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [user]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative p-6 w-full max-w-md mx-4 rounded-2xl shadow-xl bg-white/90 border border-gray-200 backdrop-blur-md transition-all duration-300">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-red-500 font-bold text-lg hover:text-red-700"
        >
          ✕
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h2>
          <p className="text-sm text-gray-600 mb-1">📧 {user.email}</p>
          <p className="text-sm text-gray-600 mb-1">📱 {user.phone}</p>
          <p className="text-sm text-gray-600 mb-1">🏢 {user.company}</p>
          <p className="text-sm text-gray-600 mb-4">🧑‍💼 {user.role}</p>
        </div>

        <div className="mb-4 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-gray-800 mb-2">📊 June 2025 Attendance</h3>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading summary...</p>
          ) : summary ? (
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>✅ Present: {summary.present} days</li>
              <li>❌ Absent: {summary.absent} days</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No summary data found.</p>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-gray-800 mb-2">🕒 Last Attendance</h3>
          {loading ? (
            <Loader/>
            // <p className="text-gray-500 text-sm">Loading...</p>
          ) : last && last.timestamp ? (
            <p className="text-sm text-gray-700">
              {last.type.toUpperCase()} on{' '}
              {new Date(last.timestamp).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          ) : (
            <p className="text-sm text-gray-500">No recent attendance found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
