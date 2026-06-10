import React from 'react';
import { formatOfficeDisplayName, getLogOfficeName } from '../../utils/officeLocations';

function ActivityLog({ activities, title = 'Your Activity', emptyText = 'No activity on selected date' }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      {title ? (
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      ) : null}
      {activities.map((item, index) => (
        <div
          key={index}
          className="bg-gray-100 p-4 rounded-lg mb-3 shadow-sm border border-gray-200"
        >
          <p className="text-sm font-medium capitalize text-gray-700">
            {item.type}
            {item.location && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                · {formatOfficeDisplayName(getLogOfficeName(item))}
              </span>
            )}
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
