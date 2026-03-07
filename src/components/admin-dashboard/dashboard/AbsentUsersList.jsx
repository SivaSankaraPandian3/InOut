import React from 'react';

const AbsentUsersList = ({ allUsers = [], logs = [] }) => {
  const presentUserIds = logs
    .filter(log => log.type === 'check-in')
    .map(log => log.userId)
    .filter(Boolean);

  const absentees = allUsers.filter(user => !presentUserIds.includes(user._id));

  if (absentees.length === 0) return null;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800">
          Absent Employees ({absentees.length})
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Employees who haven't checked in today
        </p>
      </div>
      
      <ul className="divide-y divide-gray-100">
        {absentees.map(user => (
          <li key={user._id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{user.name}</span>
              <span className="text-sm text-gray-500">{user.position} | {user.company}</span>
            </div>
            {user.department && (
              <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {user.department}
              </span>
            )}
          </li>
        ))}
      </ul>
      
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default AbsentUsersList;