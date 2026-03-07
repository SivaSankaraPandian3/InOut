// client/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { API_ENDPOINTS } from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const res = await axios.get(API_ENDPOINTS.getAttendanceByDate(dateStr), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRecords(res.data);
        setFiltered(res.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const handleAddEmployee = () => {
    navigate('/register');
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    const term = e.target.value.toLowerCase();
    setFiltered(records.filter(r =>
      r.user?.name?.toLowerCase().includes(term) ||
      r.user?.email?.toLowerCase().includes(term)
    ));
  };

  const calculateHours = (userRecords) => {
    const checkIns = userRecords.filter(r => r.type === 'check-in').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const checkOuts = userRecords.filter(r => r.type === 'check-out').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let total = 0;

    for (let i = 0; i < Math.min(checkIns.length, checkOuts.length); i++) {
      const inTime = new Date(checkIns[i].timestamp);
      const outTime = new Date(checkOuts[i].timestamp);
      total += (outTime - inTime) / (1000 * 60 * 60); // Convert ms to hours
    }
    return total.toFixed(2);
  };

  const users = [...new Set(filtered.map(r => r.user?._id).filter(Boolean))];
  const today = new Date().toISOString().split('T')[0];
  const presentUsers = new Set(
    filtered
      .filter(r => r.timestamp.startsWith(today) && r.user?._id)
      .map(r => r.user._id)
  );

  const attendanceData = users.map(uid => {
    const userRecs = filtered.filter(r => r.user?._id === uid);
    return {
      name: userRecs[0]?.user?.name?.split(' ')[0] || 'Unknown',
      hours: parseFloat(calculateHours(userRecs)),
      present: presentUsers.has(uid) ? 1 : 0,
    };
  });

  const statusData = [
    { name: 'Present', value: presentUsers.size },
    { name: 'Absent', value: users.length - presentUsers.size }
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Attendance Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddEmployee}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Add New Employee
            </button>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="MMMM d, yyyy"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={handleSearch}
                className="border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            {['overview', 'details', 'analytics'].map(tab => (
              <button
                key={tab}
                className={`px-6 py-3 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="p-6">
              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <SummaryCard title="Total Employees" value={users.length} color="blue" />
                    <SummaryCard
                      title="Present Today"
                      value={presentUsers.size}
                      color="green"
                      subtext={`${((presentUsers.size / users.length) * 100 || 0).toFixed(1)}% attendance`}
                    />
                    <SummaryCard
                      title="Absent Today"
                      value={users.length - presentUsers.size}
                      color="red"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <ChartCard title="Work Hours Distribution">
                      <BarChartComponent data={attendanceData} dataKey="hours" color="#3b82f6" />
                    </ChartCard>
                    <ChartCard title="Attendance Status">
                      <BarChartComponent data={statusData} dataKey="value" color="#10b981" />
                    </ChartCard>
                  </div>
                </>
              )}

              {activeTab === 'details' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Employee', 'Status', 'Time', 'Location', 'Image', 'Hours'].map((h) => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((rec) => (
                        <tr key={rec._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <UserInfo user={rec.user} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              rec.type === 'check-in' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {rec.type === 'check-in' ? 'Checked In' : 'Checked Out'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rec.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rec.location || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img
                              src={`http://localhost:5000/uploads/${rec.image}`}
                              alt="attendance"
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {calculateHours(filtered.filter(r => r.user?._id === rec.user?._id))} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="text-gray-500 text-center p-12">
                  Analytics section placeholder – Add charts or metrics here.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
const SummaryCard = ({ title, value, color, subtext }) => (
  <div className={`bg-${color}-50 p-6 rounded-lg border border-${color}-100`}>
    <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
    <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
    {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200">
    <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
    <div className="h-80">{children}</div>
  </div>
);

const BarChartComponent = ({ data, dataKey, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey={dataKey} fill={color} />
    </BarChart>
  </ResponsiveContainer>
);

const UserInfo = ({ user }) => (
  <div className="flex items-center">
    
    <div className="ml-4">
      <div className="text-sm font-medium text-gray-900">{user?.name || 'Unknown'}</div>
      <div className="text-sm text-gray-500">{user?.email || 'N/A'}</div>
    </div>
  </div>
);

export default Dashboard;
