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
import { isSameLocalDay, localDateYMD } from '../../utils/localDate';
import {
  enrichLogNames,
  filterLogsByDate,
  mapRawAttendanceRecords,
  normalizeLogs,
} from '../../utils/dashboardLogs';

const fetchDashboardLogs = async (dateFilter, headers, users = []) => {
  const datedUrl = `${API_ENDPOINTS.getRecentDashboardLogs}?date=${encodeURIComponent(dateFilter)}&_=${Date.now()}`;
  try {
    const datedRes = await axios.get(datedUrl, { headers });
    const dated = normalizeLogs(datedRes.data);
    if (dated.length > 0) return dated;
  } catch {
    /* try wider window */
  }

  try {
    const wideUrl = `${API_ENDPOINTS.getRecentDashboardLogs}?days=365&_=${Date.now()}`;
    const wideRes = await axios.get(wideUrl, { headers });
    const filtered = filterLogsByDate(normalizeLogs(wideRes.data), dateFilter);
    if (filtered.length > 0) return filtered;
  } catch {
    /* try by-date route */
  }

  try {
    const byDateRes = await axios.get(
      `${API_ENDPOINTS.getAttendanceByDate(dateFilter)}?_=${Date.now()}`,
      { headers }
    );
    const byDate = normalizeLogs(byDateRes.data);
    if (byDate.length > 0) return byDate;
  } catch {
    /* try full history */
  }

  try {
    const allRes = await axios.get(`${API_ENDPOINTS.getAttendanceAll}?_=${Date.now()}`, { headers });
    return filterLogsByDate(mapRawAttendanceRecords(normalizeLogs(allRes.data), users), dateFilter);
  } catch {
    return [];
  }
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => localDateYMD());
  const [typeFilter] = useState('all');
  const [locationFilter] = useState('all');
  const [companyFilter] = useState('all');
  const [filterBranch, setFilterBranch] = useState('All');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const token = localStorage.getItem('token');
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    localStorage.removeItem('dashboard_cache');
    localStorage.removeItem('dashboard_cache_time');
  }, []);

  useEffect(() => {
    if (!token || !dateFilter) return undefined;

    const loadDashboard = async () => {
      setLoading(true);
      setFetchError('');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

      let users = [];
      try {
        const usersRes = await axios.get(`${API_ENDPOINTS.getUsers}?_=${Date.now()}`, { headers });
        users = Array.isArray(usersRes.data) ? usersRes.data : [];
        setAllUsers(users);
      } catch (err) {
        console.error('Dashboard users error:', err);
      }

      try {
        const summaryRes = await axios.get(API_ENDPOINTS.getAdminSummary, { headers });
        setSummary(summaryRes.data || {});
      } catch (err) {
        console.error('Dashboard summary error:', err);
        const msg = err.response?.data?.msg || err.response?.data?.error;
        if (err.response?.status === 403) {
          setFetchError('Admin access only. Log out and sign in with an admin account.');
        } else if (err.response?.status === 401) {
          setFetchError('Session expired. Please log in again.');
        } else if (msg) {
          setFetchError(msg);
        }
      }

      try {
        const logsData = enrichLogNames(
          await fetchDashboardLogs(dateFilter, headers, users),
          users
        );
        setLogs(logsData);
        setFilteredLogs(logsData);
        if (logsData.length > 0) setFetchError('');
      } catch (logErr) {
        console.error('Dashboard logs error:', logErr);
        const msg = logErr.response?.data?.msg || logErr.response?.data?.error;
        setFetchError((prev) => prev || msg || 'Could not load attendance for this date. Try Refresh Data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token, dateFilter, refreshNonce]);

  
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
      result = result.filter((log) => isSameLocalDay(log.timestamp, dateFilter));
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
  const logsForSelectedDate = logs.filter((log) => isSameLocalDay(log.timestamp, dateFilter));

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

      {fetchError && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
          }}
        >
          {fetchError}
        </div>
      )}

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

      <RecentAttendanceTable logs={filteredLogs} selectedDate={dateFilter} />
      <AbsentUsersList allUsers={usersForBranch} logs={logsForSelectedDate} />
    </div>
  );
};

export default Dashboard;
