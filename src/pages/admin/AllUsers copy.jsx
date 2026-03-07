import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getUsers, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">👥 All Users</h1>

      {loading ? (
        <p className="text-center text-gray-500">Loading users...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              onClick={() => navigate(`/attendance/${user._id}`)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 p-6 cursor-pointer"
            >
              {/* Profile Pic */}
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={user.profilePic || 'https://ui-avatars.com/api/?name=User&background=random'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-blue-600 capitalize font-medium">🧑‍💼 {user.role}</p>
                </div>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-semibold">📞 Phone:</span> {user.phone}</p>
                <p><span className="font-semibold">🏢 Company:</span> {user.company}</p>
                <p><span className="font-semibold">💼 Position:</span> {user.position}</p>
                <p><span className="font-semibold">🏷️ Department:</span> {user.department || '-'}</p>
                <p><span className="font-semibold">🎓 Qualification:</span> {user.qualification || '-'}</p>
                <p><span className="font-semibold">📅 Joined On:</span> {user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '-'}</p>
                <p><span className="font-semibold">💰 Salary:</span> ₹{user.salary}</p>
                <p><span className="font-semibold">✅ Active:</span> {user.isActive ? 'Yes' : 'No'}</p>
              </div>

              {/* Skills & Responsibilities */}
              <div className="mt-4">
                {user.skills?.length > 0 && (
                  <div className="mb-2">
                    <p className="font-semibold text-gray-800">🛠️ Skills:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {user.skills.map((skill, i) => <li key={i}>{skill}</li>)}
                    </ul>
                  </div>
                )}
                {user.rolesAndResponsibility?.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-800">📌 Responsibilities:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {user.rolesAndResponsibility.map((task, i) => <li key={i}>{task}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Banking Info */}
              {user.bankDetails && (
                <div className="mt-4 text-sm text-gray-700">
                  <p className="font-semibold text-gray-800 mb-1">🏦 Bank Details:</p>
                  <p><span className="font-semibold">Name:</span> {user.bankDetails.bankingName || '-'}</p>
                  <p><span className="font-semibold">Account #:</span> {user.bankDetails.bankAccountNumber || '-'}</p>
                  <p><span className="font-semibold">IFSC:</span> {user.bankDetails.ifscCode || '-'}</p>
                  <p><span className="font-semibold">UPI ID:</span> {user.bankDetails.upiId || '-'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllUsers;
