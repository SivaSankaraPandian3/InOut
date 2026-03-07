import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col transition-all duration-300 md:ml-64"> {/* ml-64 matches sidebar width */}
        {/* Top navbar - fixed position */}
        <TopNavbar setSidebarOpen={setSidebarOpen} />
        
        {/* Main content - padding-top to account for fixed navbar height */}
        <main className="flex-1 pt-16 p-6 overflow-y-auto"> {/* pt-16 matches navbar height */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;