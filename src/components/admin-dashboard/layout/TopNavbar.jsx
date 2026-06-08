import React from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import './layout.css';

const TopNavbar = ({ setSidebarOpen }) => {
  return (
    <header className="admin-topnav">
      <button
        type="button"
        className="admin-topnav-menu-btn"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        <FiMenu size={20} />
      </button>

      <div className="admin-topnav-title">
        <strong>Admin Dashboard</strong>
        <span>User Management System</span>
      </div>

      <button type="button" className="admin-topnav-menu-btn" style={{ position: 'relative' }} aria-label="Notifications">
        <FiBell />
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            background: '#ef4444',
            borderRadius: '50%',
          }}
        />
      </button>
    </header>
  );
};

export default TopNavbar;