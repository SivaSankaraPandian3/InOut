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
import { BRANCH_OPTIONS, logMatchesBranchFilter, matchesBranchFilter } from '../../utils/branches';
import {
  DUMMY_ATTENDANCE_LOGS,
  DUMMY_DASHBOARD_SUMMARY,
  DUMMY_USERS,
} from '../../utils/dummyAttendanceData';

const IS_DEV = process.env.NODE_ENV === 'development';

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
  const [typeFilter] = useState('all');
  const [locationFilter] = useState('all');
  const [companyFilter] = useState('all');
  const [filterBranch, setFilterBranch] = useState('All');
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
      const [summaryRes, logsRes, usersRes] = await Promise.all([
        axios.get(API_ENDPOINTS.getAdminSummary, { headers }),
        axios.get(API_ENDPOINTS.getRecentDashboardLogs, { headers }),
        axios.get(API_ENDPOINTS.getUsers, { headers })
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

    if (filterBranch !== 'All') {
      result = result.filter((log) => logMatchesBranchFilter(log, allUsers, filterBranch));
    }

    setFilteredLogs(result);
    
  }, [logs, search, dateFilter, typeFilter, locationFilter, companyFilter, filterBranch, allUsers]);
  const logsForSelectedDate = logs.filter(log =>
  new Date(log.timestamp).toDateString() === new Date(dateFilter).toDateString()
);

  const usersForBranch =
    filterBranch === 'All'
      ? allUsers
      : allUsers.filter((u) => matchesBranchFilter(u, filterBranch));

  if (loading) return <Loader />;

  return (
    <div className="uc-page">
      <div className="uc-flex-between">
        <h1 className="uc-page-title">Today&apos;s Attendance Report</h1>
        <ReportGenerator
          logs={filteredLogs}
          allUsers={allUsers}
          selectedDate={dateFilter}
        />
      </div>

      {summary && <DashboardCards data={summary} />}

      <div className="uc-grid-filters">
        <div className="uc-field">
          <span className="uc-field-icon"><FiSearch /></span>
          <input
            type="text"
            placeholder="Search employees..."
            className="uc-input uc-input-icon"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="uc-field">
          <span className="uc-field-icon"><FiCalendar /></span>
          <input
            type="date"
            className="uc-input uc-input-icon"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="uc-select"
        >
          <option value="All">All Branches</option>
          {BRANCH_OPTIONS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <button
          type="button"
          className="uc-btn uc-btn-primary"
          onClick={() => {
            localStorage.removeItem('dashboard_cache');
            localStorage.removeItem('dashboard_cache_time');
            window.location.reload();
          }}
        >
          <Sync fontSize="small" />
          Refresh Data
        </button>

        {IS_DEV && (
          <button
            type="button"
            className="uc-btn uc-btn-outline"
            onClick={() => {
              setSummary(DUMMY_DASHBOARD_SUMMARY);
              setLogs(DUMMY_ATTENDANCE_LOGS);
              setFilteredLogs(DUMMY_ATTENDANCE_LOGS);
              setAllUsers(DUMMY_USERS);
              setLoading(false);
            }}
          >
            Load Test Data
          </button>
        )}
      </div>

      <RecentAttendanceTable logs={filteredLogs} />
      <AbsentUsersList allUsers={usersForBranch} logs={logsForSelectedDate} />
    </div>
  );
};

export default Dashboard;
