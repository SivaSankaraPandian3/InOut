import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { MoreVertical } from 'lucide-react';
import { API_ENDPOINTS } from '../../utils/api';
// UserCard is used on the dedicated user detail page now
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/admin-dashboard/common/Loader';
import { getPrimaryWork, getUserWorks } from '../../utils/userWorks';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPastModal, setShowPastModal] = useState(false);
  const [pastSearch, setPastSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
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

  useEffect(() => {
    if (!openMenuId) return undefined;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openMenuId]);

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
      Swal.fire('Success', `User ${actionLabel}d successfully.`, 'success');
    } catch (error) {
      console.error('Failed to update user status:', error);
      Swal.fire('Error', `Could not ${actionLabel} user.`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const isPastEmployee = (user) => !user.isActive || !!user.dateOfRelieving;

  const matchesPastSearch = (user) => {
    if (!pastSearch.trim()) return true;
    const q = pastSearch.trim().toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.employeeId || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
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
  const pastEmployees = sortedUsers
    .filter(isPastEmployee)
    .filter(matchesPastSearch);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    showing: filteredUsers.length,
    multiWork: users.filter((u) => getUserWorks(u).length > 1).length,
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-col min-w-0">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-100 border-l-4 border-slate-500 p-4 rounded-lg shadow-sm">
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
          <p className="text-xs sm:text-sm text-green-700 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{stats.active}</p>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <p className="text-xs sm:text-sm text-red-700 font-medium">Inactive</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-indigo-100 border-l-4 border-indigo-500 p-4 rounded-lg shadow-sm">
          <p className="text-xs sm:text-sm text-indigo-700 font-medium">Filtered Results</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.showing}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-w-0">
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

          <button
            type="button"
            onClick={() => { setPastSearch(''); setShowPastModal(true); }}
            className="px-3 py-1.5 rounded text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 border-l border-slate-300 ml-1 pl-3"
          >
            Past Employees ({users.filter(isPastEmployee).length})
          </button>
        </div>
      </div>

      <div className="shadow border border-gray-200 sm:rounded-lg w-full overflow-hidden">
          <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
              <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="w-[26%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="w-[18%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
              <th className="w-[20%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="w-10 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user, idx) => (
              <tr
                key={user._id}
                className={`${user.isActive ? '' : 'opacity-60'} hover:bg-gray-50 cursor-pointer`}
                onClick={() => navigate(`/all-users/${user._id}`)}
              >
                <td className="px-2 py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-2 py-3 text-sm text-gray-900 truncate" title={user.employeeId}>{user.employeeId || '-'}</td>
                <td className="px-2 py-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={user.profilePic || '/default-avatar.png'} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    <span className="truncate" title={user.name}>{user.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-sm text-gray-500">
                  <span className="line-clamp-2" title={getPrimaryWork(user).department || user.department}>
                    {getPrimaryWork(user).department || user.department || '-'}
                    {getUserWorks(user).length > 1 && (
                      <span className="text-xs text-indigo-600"> +{getUserWorks(user).length - 1}</span>
                    )}
                  </span>
                </td>
                <td className="px-2 py-3 text-sm text-gray-500">
                  <span className="line-clamp-2" title={getPrimaryWork(user).position || user.position}>
                    {getPrimaryWork(user).position || user.position || '-'}
                    {getUserWorks(user).length > 1 && (
                      <span className="text-xs text-indigo-600"> +{getUserWorks(user).length - 1}</span>
                    )}
                  </span>
                </td>
                <td className="px-2 py-3 text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="relative px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === user._id ? null : user._id);
                    }}
                    className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    aria-label={`Actions for ${user.name}`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {openMenuId === user._id && (
                    <div
                      className="absolute right-2 top-full mt-1 z-30 min-w-[9rem] bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/all-users/${user._id}`);
                        }}
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                        onClick={() => {
                          setOpenMenuId(null);
                          navigate(`/all-users/${user._id}/edit`);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 disabled:opacity-50 ${
                          user.isActive ? 'text-red-600' : 'text-green-600'
                        }`}
                        onClick={(e) => {
                          setOpenMenuId(null);
                          handleToggleStatus(e, user);
                        }}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
      </div>

      {showPastModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPastModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Past Employees</h2>
                <p className="text-sm text-gray-500">Inactive or relieved employees</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPastModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none px-2"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="px-5 py-3 border-b">
              <input
                value={pastSearch}
                onChange={(e) => setPastSearch(e.target.value)}
                placeholder="Search past employees..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4">
              {pastEmployees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No past employees found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Employee ID</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Name</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Department</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Designation</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Relieved</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pastEmployees.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setShowPastModal(false);
                          navigate(`/all-users/${user._id}`);
                        }}
                      >
                        <td className="py-2.5 px-2 font-mono text-gray-800">{user.employeeId || '-'}</td>
                        <td className="py-2.5 px-2 font-medium text-gray-900">{user.name}</td>
                        <td className="py-2.5 px-2 text-gray-600">{getPrimaryWork(user).department || user.department || '-'}</td>
                        <td className="py-2.5 px-2 text-gray-600">{getPrimaryWork(user).position || user.position || '-'}</td>
                        <td className="py-2.5 px-2 text-gray-600">{formatDate(user.dateOfRelieving)}</td>
                        <td className="py-2.5 px-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(e, user)}
                            disabled={updating}
                            className="px-2 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            Enable
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
