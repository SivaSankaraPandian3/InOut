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
        const res = await axios.get(API_ENDPOINTS.getUserById(userId), { headers: { Authorization: `Bearer ${token}` } });
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            ← Back
          </button>
        </div>

        {user ? (
          <UserCard user={user} forceExpanded onEdit={(id) => navigate(`/all-users/${id}/edit`)} onClose={() => navigate(-1)} />
        ) : (
          <div className="bg-white p-6 rounded shadow">User not found</div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
