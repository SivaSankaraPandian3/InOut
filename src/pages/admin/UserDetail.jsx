import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import UserCard from '../../components/admin-dashboard/allusers/UserCard';
import Loader from '../../components/admin-dashboard/common/Loader';

const UserDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getUserById(userId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data || null);
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <Loader />;

  return (
    <div className="uc-profile-page">
      <div className="uc-profile-shell">
        <button type="button" className="uc-profile-back" onClick={() => navigate('/all-users')}>
          ← Back to All Users
        </button>

        {user ? (
          <UserCard
            user={user}
            forceExpanded
            showCloseButton={false}
            onEdit={(id) => navigate(`/all-users/${id}/edit`)}
          />
        ) : (
          <div className="uc-profile-card">
            <p className="uc-empty-msg">User not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
