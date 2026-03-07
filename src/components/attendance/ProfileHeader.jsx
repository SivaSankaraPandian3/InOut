import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../utils/api';
import urbancodeLogo from '../../assets/uclogo.png';
import jobzenterLogo from '../../assets/jzlogo.png';
import { FiBell } from 'react-icons/fi';

function ProfileHeader() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.getUsers, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch user');

        const users = await res.json();
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userId = decoded.userId;

        const currentUser = users.find(u => u._id === userId);
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading user:', err.message);
      }
    };

    if (token) fetchUser();
  }, [token]);

  if (!user) return null;

  const getCompanyLogo = (company) => {
    switch (company) {
      case 'Urbancode':
        return urbancodeLogo;
      case 'Jobzenter':
        return jobzenterLogo;
      default:
        return '/default-logo.png';
    }
  };

  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 shadow rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border border-gray-300 shadow-sm bg-white p-1">
          <img
            src={getCompanyLogo(user.company)}
            alt={user.company}
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.position || 'Employee'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user.company}</p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-gray-400 text-xl">
        <FiBell
          className="hover:text-blue-600 transition-colors duration-150 cursor-pointer"
          title="Notifications"
        />
      </div>
    </div>
  );
}

export default ProfileHeader;
