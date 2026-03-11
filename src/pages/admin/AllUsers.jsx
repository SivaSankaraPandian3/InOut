import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
// UserCard is used on the dedicated user detail page now
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/admin-dashboard/common/Loader';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterPosition, setFilterPosition] = useState('All');
  const [filterCompany, setFilterCompany] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // ✅ Move fetchUsers outside useEffect so you can use it in onUpdated
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_ENDPOINTS.getUsers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <Loader />;

  // Show active users first, then inactive users
  const sortedUsers = [...(users || [])].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1; // active (true) comes before inactive (false)
  });

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '-';
      return dt.toLocaleDateString();
    } catch (err) {
      return '-';
    }
  };

  // derive unique options for filters
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort();
  const positions = Array.from(new Set(users.map(u => u.position).filter(Boolean))).sort();
  const companies = Array.from(new Set(users.map(u => u.company).filter(Boolean))).sort();

  const matchesSearch = (user) => {
    if (!searchTerm) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.employeeId || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    );
  };

  const matchesFilters = (user) => {
    if (filterDept !== 'All' && (user.department || '') !== filterDept) return false;
    if (filterPosition !== 'All' && (user.position || '') !== filterPosition) return false;
    if (filterCompany !== 'All' && (user.company || '') !== filterCompany) return false;
    if (filterStatus !== 'All') {
      const isActive = !!user.isActive;
      if (filterStatus === 'Active' && !isActive) return false;
      if (filterStatus === 'Inactive' && isActive) return false;
    }
    return true;
  };

  const filteredUsers = sortedUsers.filter(u => matchesSearch(u) && matchesFilters(u));

  return (
    <div className="p-6 w-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>

      {/* Make table horizontally scrollable on small screens and vertically scrollable if very tall */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or employee ID"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="border rounded px-2 py-1">
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="border rounded px-2 py-1">
            <option value="All">All Positions</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select> */}

          <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} className="border rounded px-2 py-1">
            <option value="All">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button onClick={() => { setSearchTerm(''); setFilterDept('All'); setFilterPosition('All'); setFilterCompany('All'); setFilterStatus('All'); }} className="px-3 py-1 border rounded text-sm">Reset</button>
        </div>
      </div>

      <div className="shadow border-b border-gray-200 sm:rounded-lg w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relieved Date</th> */}
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th> */}
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user, idx) => (
              <tr key={user._id} className={user.isActive ? '' : 'opacity-60'} onClick={() => navigate(`/all-users/${user._id}`)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.employeeId || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position || '-'}</td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dateOfRelieving ? formatDate(user.dateOfRelieving) : 'Currently working'}</td> */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.dateOfJoining)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company || '-'}</td> */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewUserId(user._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setEditingUserId(user._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs leading-4 font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <img src={user.profilePic || '/default-avatar.png'} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
      {/* NOTE: Viewing and editing now navigate to dedicated pages */}
    </div>
  );
};

export default AllUsers;
