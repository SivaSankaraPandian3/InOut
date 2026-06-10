import React from 'react';

function ActivityLog({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400">
        No activity on selected date
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Activity</h3>
      {activities.map((item, index) => (
        <div
          key={index}
          className="bg-gray-100 p-4 rounded-lg mb-3 shadow-sm border border-gray-200"
        >
          <p className="text-sm font-medium capitalize text-gray-700">
            {item.type}
          </p>
          <div className="flex justify-between text-sm mt-1">
            <span className="font-bold text-gray-900">
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-gray-500">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityLog;
