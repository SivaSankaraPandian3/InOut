import React from 'react';

const DashboardCards = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Total Employees */}
      <div className="bg-green-100 border-l-4 border-green-500 p-4 sm:p-5 rounded shadow-sm">
        <p className="text-sm sm:text-base text-green-700 font-medium">Total Employees</p>
        <h2 className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{data.totalEmployees}</h2>
      </div>

      {/* Present Today */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 sm:p-5 rounded shadow-sm">
        <p className="text-sm sm:text-base text-blue-700 font-medium">Present Today</p>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{data.presentToday}</h2>
      </div>

      {/* Absent Today */}
      <div className="bg-red-100 border-l-4 border-red-500 p-4 sm:p-5 rounded shadow-sm">
        <p className="text-sm sm:text-base text-red-700 font-medium">Absent Today</p>
        <h2 className="text-xl sm:text-2xl font-bold text-red-900 mt-1">{data.absentToday}</h2>
      </div>
    </div>
  );
};

export default DashboardCards;
