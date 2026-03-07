import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../utils/api';
import Loader from '../common/Loader';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getUsers, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(res.data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-6 bg-white rounded shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Employees</h2>

      {employees.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No employees found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {employees.map((emp) => (
                <tr key={emp._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{emp.name || '-'}</td>
                  <td className="px-4 py-2">{emp.email || '-'}</td>
                  <td className="px-4 py-2">{emp.phone || '-'}</td>
                  <td className="px-4 py-2">{emp.position || '-'}</td>
                  <td className="px-4 py-2">{emp.company || '-'}</td>
                  <td className="px-4 py-2 capitalize">{emp.role || 'employee'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
