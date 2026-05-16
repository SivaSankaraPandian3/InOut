import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';
// UserCard is used on the dedicated user detail page now
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/admin-dashboard/common/Loader';
import { getPrimaryWork, getUserWorks } from '../../utils/userWorks';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('enable');
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

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const updateUserStatus = async (userId, isActive) => {
    await axios.put(
      API_ENDPOINTS.updateUser(userId),
      { isActive },
      { headers: getAuthHeaders() }
    );
  };

  const handleToggleStatus = async (e, user) => {
    e.stopPropagation();
    const nextActive = !user.isActive;
    const actionLabel = nextActive ? 'enable' : 'disable';

    const result = await Swal.fire({
      title: `${nextActive ? 'Enable' : 'Disable'} user?`,
      text: `${user.name} (${user.employeeId || 'no ID'}) will be ${actionLabel}d.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nextActive ? '#16a34a' : '#dc2626',
      confirmButtonText: nextActive ? 'Enable' : 'Disable',
    });

    if (!result.isConfirmed) return;

    try {
      setUpdating(true);
      await updateUserStatus(user._id, nextActive);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: nextActive } : u))
      );
      setSelectedIds((prev) => prev.filter((id) => id !== user._id));
      Swal.fire('Success', `User ${actionLabel}d successfully.`, 'success');
    } catch (error) {
      console.error('Failed to update user status:', error);
      Swal.fire('Error', `Could not ${actionLabel} user.`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      Swal.fire('Info', 'Select at least one user.', 'info');
      return;
    }

    const isActive = bulkAction === 'enable';
    const actionLabel = isActive ? 'enable' : 'disable';

    const result = await Swal.fire({
      title: `Bulk ${isActive ? 'Enable' : 'Disable'}?`,
      text: `${selectedIds.length} user(s) will be ${actionLabel}d.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#16a34a' : '#dc2626',
      confirmButtonText: `Yes, ${isActive ? 'Enable' : 'Disable'}`,
    });

    if (!result.isConfirmed) return;

    const count = selectedIds.length;

    try {
      setUpdating(true);
      await Promise.all(selectedIds.map((id) => updateUserStatus(id, isActive)));
      setUsers((prev) =>
        prev.map((u) => (selectedIds.includes(u._id) ? { ...u, isActive } : u))
      );
      setSelectedIds([]);
      Swal.fire('Success', `${count} user(s) ${actionLabel}d.`, 'success');
    } catch (error) {
      console.error('Bulk update failed:', error);
      Swal.fire('Error', `Bulk ${actionLabel} failed. Try again.`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectAll = (e) => {
    e.stopPropagation();
    const visibleIds = filteredUsers.map((u) => u._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const toggleSelectOne = (e, userId) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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
  const visibleIds = filteredUsers.map((u) => u._id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

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

          <button onClick={() => { setSearchTerm(''); setFilterDept('All'); setFilterPosition('All'); setFilterCompany('All'); setFilterStatus('All'); setSelectedIds([]); }} className="px-3 py-1 border rounded text-sm">Reset</button>

          <div className="flex items-center gap-2 border-l pl-2 ml-1">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              disabled={updating}
            >
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={updating || selectedIds.length === 0}
              className="px-3 py-1 rounded text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : `Bulk Update (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="shadow border-b border-gray-200 sm:rounded-lg w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  disabled={updating || filteredUsers.length === 0}
                  className="w-4 h-4 rounded border-gray-300"
                  aria-label="Select all visible users"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user, idx) => (
              <tr
                key={user._id}
                className={`${user.isActive ? '' : 'opacity-60'} hover:bg-gray-50 cursor-pointer`}
                onClick={() => navigate(`/all-users/${user._id}`)}
              >
                <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user._id)}
                    onChange={(e) => toggleSelectOne(e, user._id)}
                    disabled={updating}
                    className="w-4 h-4 rounded border-gray-300"
                    aria-label={`Select ${user.name}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.employeeId || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <img src={user.profilePic || '/default-avatar.png'} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPrimaryWork(user).department || user.department || '-'}
                  {getUserWorks(user).length > 1 && (
                    <span className="ml-1 text-xs text-indigo-600">+{getUserWorks(user).length - 1}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPrimaryWork(user).position || user.position || '-'}
                  {getUserWorks(user).length > 1 && (
                    <span className="ml-1 text-xs text-indigo-600" title={getUserWorks(user).slice(1).map(w => `${w.position} @ ${w.company}`).join(', ')}>
                      +{getUserWorks(user).length - 1}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(e, user)}
                    disabled={updating}
                    className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white disabled:opacity-50 ${
                      user.isActive
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {user.isActive ? 'Disable' : 'Enable'}
                  </button>
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
