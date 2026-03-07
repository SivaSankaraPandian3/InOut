import React from 'react';
import { FiUser, FiLogOut, FiMenu, FiBell, FiSearch } from 'react-icons/fi';

const TopNavbar = ({ setSidebarOpen }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-30 shadow-sm md:left-64 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="md:hidden text-gray-600 hover:text-blue-600 transition"
        >
          <FiMenu size={20} />
        </button>
        
        <div className="relative hidden md:block">
          
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        
        <div className="flex items-center gap-2">
          
          <div className="hidden md:block text-sm">
            <div className="font-medium text-gray-800">Admin Dashboard</div>
            <div className="text-xs text-gray-500">User Management System</div>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <FiBell className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        
      </div>
    </header>
  );
};

export default TopNavbar;