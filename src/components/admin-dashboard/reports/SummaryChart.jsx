import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const SummaryChart = ({ data }) => {
  const chartData = [
    { name: 'Total Employees', count: data.totalEmployees },
    { name: 'Present Today', count: data.presentToday },
    { name: 'Absent Today', count: data.absentToday },
  ];

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Attendance Summary</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#4F46E5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SummaryChart;
