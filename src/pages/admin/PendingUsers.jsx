import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';
import { FiUserCheck, FiUserX, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/admin-dashboard/common/Loader';

const PendingUsers = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.pendingUsers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(Array.isArray(res.data) ? res.data : []);
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
      confirmButtonColor: '#38a169',
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_ENDPOINTS.approveUser}/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
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
      confirmButtonColor: '#e53e3e',
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ENDPOINTS.rejectUser}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  if (loading) return <Loader />;

  return (
    <div className="uc-page" style={{ maxWidth: '64rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 className="uc-page-title" style={{ margin: 0, textAlign: 'left' }}>
          Pending User Approvals
        </h1>
        <button
          type="button"
          className="uc-btn uc-btn-primary uc-btn-icon-circle"
          onClick={() => navigate('/add-user')}
          title="Add User"
          aria-label="Add User"
        >
          <FiUserPlus size={16} />
        </button>
      </div>

      <div className="uc-stat-card uc-stat-indigo" style={{ marginBottom: '1.25rem' }}>
        <p className="uc-stat-label">Awaiting approval</p>
        <p className="uc-stat-value">{pendingUsers.length}</p>
      </div>

      {pendingUsers.length === 0 ? (
        <p className="uc-empty-msg">No pending users found.</p>
      ) : (
        <div className="uc-pending-list">
          {pendingUsers.map((user) => (
            <div key={user._id} className="uc-pending-card">
              <div className="uc-pending-info">
                <h3>{user.name || 'Unnamed'}</h3>
                <p><strong>Email:</strong> {user.email || '—'}</p>
                <p><strong>Phone:</strong> {user.phone || '—'}</p>
                <p><strong>Company:</strong> {user.company || '—'}</p>
                <p>
                  <strong>DOB:</strong>{' '}
                  {user.dateOfBirth
                    ? new Date(user.dateOfBirth).toLocaleDateString()
                    : 'N/A'}
                </p>
                <p><strong>Position:</strong> {user.position || '—'}</p>
              </div>
              <div className="uc-pending-actions">
                <button
                  type="button"
                  onClick={() => handleApprove(user._id)}
                  className="uc-btn uc-btn-success"
                >
                  <FiUserCheck />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(user._id)}
                  className="uc-btn uc-btn-danger"
                >
                  <FiUserX />
                  Reject
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
