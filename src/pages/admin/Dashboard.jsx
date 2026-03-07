import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import RecentAttendanceTable from '../../components/admin-dashboard/dashboard/RecentAttendanceTable';
import DashboardCards from '../../components/admin-dashboard/dashboard/DashboardCards';
import Loader from '../../components/admin-dashboard/common/Loader';
import { FiSearch, FiCalendar } from 'react-icons/fi';
import AbsentUsersList from '../../components/admin-dashboard/dashboard/AbsentUsersList';
import ReportGenerator from '../../components/admin-dashboard/dashboard/ReportGenerator';
import { Sync } from '@mui/icons-material';
const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'
});
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // Fetch summary and logs on load
 useEffect(() => {
  const fetchDashboardData = async () => {
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };

    // Cache keys
    const CACHE_KEY = "dashboard_cache";
    const CACHE_TIME_KEY = "dashboard_cache_time";
    const CACHE_TTL = 10 * 60 * 1000; // 5 minutes

    // 1️⃣ Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    if (cached && cachedTime && (Date.now() - cachedTime < CACHE_TTL)) {
      console.log("⚡ Using dashboard cached data");
      const data = JSON.parse(cached);

      setSummary(data.summary);
      setLogs(data.logs);
      setFilteredLogs(data.logs);
      setAllUsers(data.users);

      setLoading(false);
      return;
    }

    // 2️⃣ No cache → Fetch fresh
    try {
      console.log("⏳ Fetching fresh dashboard data...");
      const [summaryRes, logsRes, usersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.getAdminSummary, { headers }),
        axios.get(API_ENDPOINTS.getRecentDashboardLogs, { headers }),
        axios.get(API_ENDPOINTS.getAllUsers, { headers })
      ]);

      const summary = summaryRes.data || {};
      const logs = logsRes.data || [];
      const users = usersRes.data || [];

      // Set state
      setSummary(summary);
      setLogs(logs);
      setFilteredLogs(logs);
      setAllUsers(users);

      // 3️⃣ Save to cache
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ summary, logs, users })
      );
      localStorage.setItem(CACHE_TIME_KEY, Date.now());

    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [token]);

  
  // Apply filters
  useEffect(() => { 
    let result = [...logs];

    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(log =>
        log.employeeName?.toLowerCase().includes(keyword)
      );
    }

    if (dateFilter) {
      const targetDate = new Date(dateFilter).toDateString();
      result = result.filter(log =>
        new Date(log.timestamp).toDateString() === targetDate
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(log => log.type === typeFilter);
    }

    if (locationFilter !== 'all') {
      const isInOffice = locationFilter === 'office';
      result = result.filter(log => log.isInOffice === isInOffice);
    }

    if (companyFilter !== 'all') {
      result = result.filter(log => log.company === companyFilter);
    }

    setFilteredLogs(result);
    
  }, [logs, search, dateFilter, typeFilter]);
  const logsForSelectedDate = logs.filter(log =>
  new Date(log.timestamp).toDateString() === new Date(dateFilter).toDateString()
);

  if (loading) return <Loader />;
  console.log("FL,L",filteredLogs,logs);

  return (
    <div className="sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-600">Today's Attendance Report</h1>
    <ReportGenerator
          logs={filteredLogs} 
  allUsers={allUsers} 
  selectedDate={dateFilter}
        /></div>
      {/* Summary Cards */}
      {summary && <DashboardCards data={summary} />}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 mb-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="pl-10 w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiCalendar className="text-gray-400" />
          </div>
          <input
            type="date"
            className="pl-10 w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        {/* <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="check-in">Check In</option>
          <option value="check-out">Check Out</option>
        </select> */}
        <button className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => {
  localStorage.removeItem("dashboard_cache");
  localStorage.removeItem("dashboard_cache_time");
  window.location.reload();
}}><Sync />
  Refresh Data
  
</button>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        
      <RecentAttendanceTable logs={filteredLogs} />
      

      
     <AbsentUsersList allUsers={allUsers} logs={logsForSelectedDate} /></div>
    </div>
  );
};

export default Dashboard;
