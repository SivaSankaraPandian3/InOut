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
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('dashboard_cache_time');
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const fetchDashboardData = async () => {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

      try {
        const [summaryRes, logsRes, usersRes] = await Promise.all([
          axios.get(API_ENDPOINTS.getAdminSummary, { headers }),
          axios.get(`${API_ENDPOINTS.getRecentDashboardLogs}?_=${Date.now()}`, { headers }),
          axios.get(`${API_ENDPOINTS.getUsers}?_=${Date.now()}`, { headers }),
        ]);

        setSummary(summaryRes.data || {});
        setLogs(logsRes.data || []);
        setFilteredLogs(logsRes.data || []);
        setAllUsers(usersRes.data || []);
      } catch (err) {
        console.error('Dashboard loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, refreshNonce]);

  
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
          onClick={() => setRefreshNonce((n) => n + 1)}
        >
          <Sync fontSize="small" />
          Refresh Data
        </button>
      </div>

      <RecentAttendanceTable logs={filteredLogs} />
      <AbsentUsersList allUsers={usersForBranch} logs={logsForSelectedDate} />
    </div>
  );
};

export default Dashboard;
