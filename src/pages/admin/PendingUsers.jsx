import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';
import { FiUserCheck, FiUserX } from 'react-icons/fi';
import Loader from '../../components/admin-dashboard/common/Loader';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.pendingUsers, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      Swal.fire('Error', 'Failed to load pending users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const confirm = await Swal.fire({
      title: 'Approve this user?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      confirmButtonColor: '#38a169'
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_ENDPOINTS.approveUser}/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'User approved and moved to employees.', 'success');
      fetchPendingUsers();
    } catch (err) {
      console.error('Approval failed:', err);
      Swal.fire('Error', 'Failed to approve user.', 'error');
    }
  };

  const handleReject = async (id) => {
    const confirm = await Swal.fire({
      title: 'Reject this user?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      confirmButtonColor: '#e53e3e'
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ENDPOINTS.rejectUser}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Rejected', 'User has been removed.', 'info');
      fetchPendingUsers();
    } catch (err) {
      console.error('Rejection failed:', err);
      Swal.fire('Error', 'Failed to reject user.', 'error');
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  if (loading) return <Loader/>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Pending User Approvals</h2>

      {pendingUsers.length === 0 ? (
        <p className="text-center text-gray-600">No pending users found.</p>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
          {pendingUsers.map((user) => (
            <div
              key={user._id}
              className="w-full p-4 border border-gray-200 bg-white rounded-md flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600">Email: {user.email}</p>
                <p className="text-sm text-gray-600">Phone: {user.phone}</p>
                <p className="text-sm text-gray-600">Company: {user.company}</p>
                <p className="text-sm text-gray-600">Position: {user.position}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(user._id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded"
                >
                  <FiUserCheck className="inline mr-1" /> Approve
                </button>
                <button
                  onClick={() => handleReject(user._id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm rounded"
                >
                  <FiUserX className="inline mr-1" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingUsers;
