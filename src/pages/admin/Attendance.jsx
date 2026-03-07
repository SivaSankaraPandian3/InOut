import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AttendanceTable from '../../components/admin-dashboard/attendance/AttendanceTable';
import { API_ENDPOINTS } from '../../utils/api';
import Loader from '../../components/admin-dashboard/common/Loader';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getAttendanceAll, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(res.data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Records</h1>
      <AttendanceTable records={records} />
    </div>
  );
};

export default Attendance;
