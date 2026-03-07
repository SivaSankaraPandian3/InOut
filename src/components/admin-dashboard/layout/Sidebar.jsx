import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCalendar, FiBarChart2, FiSettings, FiLogOut,
  FiFileText, FiDollarSign, FiCamera, FiChevronRight
} from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', icon: <FiHome />, path: '/dashboard' },
  { label: 'Monthly Reports', icon: <FiCamera />, path: '/reports' },
  {
    label: 'User Management',
    icon: <FiUsers />,
    subItems: [
      { label: 'User Cards', path: '/all-users' },
      { label: 'Employees Schedules', path: '/employees' },
      
      { label: 'Pending Approvals', path: '/pending-users' }
    ]
  },
  {
    label: 'Leaves & Lates',
    icon: <FiCalendar />,
    subItems: [
      { label: 'Leave Records', path: '/leave-requests' },
      { label: 'Late Reports', path: '/coming-soon/late-reports' }
    ]
  },
      {
        label: 'Documents',
        icon: <FiFileText />,
        subItems: [
          { label: 'Experience Letters', path: '/experience-letters' },
          { label: 'Internship Certificate', path: '/internship-letter' },
          { label: 'Internship Offer Letter', path: '/internship-offer' },
          { label: 'Offer Letters', path: '/offer-letters' },
          { label: 'Relieving Letters', path: '/relieving-letters' },
          { label: 'Upload Documents', path: '/coming-soon/upload-documents' }
        ]
      },
  { label: 'Pay History', icon: <FiDollarSign />, path: '/salaryhistory' },
  { label: 'Payslip Generator', icon: <FiBarChart2 />, path: '/payslip' },
  { label: 'Holiday List', icon: <FiCalendar />, path: '/holidays' },
  { label: 'Settings', icon: <FiSettings />, path: '/coming-soon/settings' }
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  // Open the 'Documents', 'Leaves & Lates', and 'User Management' submenus by default
  const [expandedItems, setExpandedItems] = React.useState({
    Documents: true,
    'Leaves & Lates': true,
    'User Management': true
  });

  const toggleItem = (label) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-800 border-r z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="text-xl font-semibold text-center py-4 border-b border-gray-200">
          INOUT HR Portal
        </div>

        <nav className="mt-4 px-2 flex flex-col gap-1 overflow-y-auto h-[calc(100vh-80px)]">
          {menuItems.map((item, index) => {
            if (item.subItems) {
              return (
                <div key={index} className="mb-1">
                  <button
                    onClick={() => toggleItem(item.label)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-md hover:bg-gray-100 text-sm font-medium transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <FiChevronRight
                      className={`transition-transform duration-200 ${
                        expandedItems[item.label] ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {expandedItems[item.label] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `block px-3 py-2 rounded-md text-sm font-medium ${
                              isActive
                                ? 'bg-gray-200 text-black'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                          }
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? 'bg-gray-200 text-black'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="mt-auto pb-4 px-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full  py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
