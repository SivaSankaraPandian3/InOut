import React, { useEffect, useState, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_ENDPOINTS } from '../../utils/api';
import './Holidays.css'; // We'll create this CSS file for custom styling
import Loader from '../../components/admin-dashboard/common/Loader';

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isPastHolidayDate = (date) => startOfDay(date) < startOfDay(new Date());

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [holidayMap, setHolidayMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.getHolidays, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHolidays(res.data || []);

      const map = {};
      res.data.forEach(h => {
        map[new Date(h.date).toDateString()] = h;
      });
      setHolidayMap(map);
    } catch (err) {
      console.error('Error fetching holidays:', err);
      Swal.fire('Error', 'Failed to fetch holidays', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleDateClick = async (date) => {
  setSelectedDate(date);
  const holiday = holidayMap[date.toDateString()];

  if (holiday) {
    const { isConfirmed, isDenied } = await Swal.fire({
      title: 'Holiday Info',
      text: `${holiday.name} on ${date.toDateString()}`,
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Edit',
      denyButtonText: 'Delete',
      cancelButtonText: 'Close'
    });

    if (isConfirmed) {
      // ✏️ Edit holiday
      const { value: name } = await Swal.fire({
        title: 'Edit Holiday',
        input: 'text',
        inputValue: holiday.name,
        inputLabel: `Edit holiday name for ${date.toDateString()}`,
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#dc2626'
      });

      if (name) {
        try {
          await axios.put(API_ENDPOINTS.editHoliday(holiday._id), {
            date: date,
            name: name
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          await fetchHolidays();
          Swal.fire('Success', 'Holiday updated successfully!', 'success');
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to update holiday', 'error');
        }
      }
    } else if (isDenied) {
      // 🗑️ Delete holiday
      const { isConfirmed: confirmedDelete } = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (confirmedDelete) {
        try {
          await axios.delete(API_ENDPOINTS.deleteHoliday(holiday._id), {
            headers: { Authorization: `Bearer ${token}` }
          });
          await fetchHolidays();
          Swal.fire('Deleted!', 'Holiday has been deleted.', 'success');
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to delete holiday', 'error');
        }
      }
    }
  } else {
    // ➕ Add new holiday
    const { value: name } = await Swal.fire({
      title: 'Add Holiday',
      input: 'text',
      inputLabel: `Enter holiday name for ${date.toDateString()}`,
      inputPlaceholder: 'e.g., Diwali, Pongal',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#dc2626'
    });

    if (name) {
      try {
        await axios.post(API_ENDPOINTS.addHoliday, {
          date: date,
          name: name
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchHolidays();
        Swal.fire('Success', 'Holiday added successfully!', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to add holiday', 'error');
      }
    }
  }
};


  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const holiday = holidayMap[date.toDateString()];
      if (holiday) {
        return (
          <div className="holiday-indicator">
            <span className="holiday-dot"></span>
            <div className="holiday-tooltip">{holiday.name}</div>
          </div>
        );
      }
      
      // Highlight today
      if (date.toDateString() === new Date().toDateString()) {
        return <div className="today-indicator"></div>;
      }
    }
    return null;
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return holidays
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5); // Show only next 5 holidays
  };

  const upcomingHolidays = getUpcomingHolidays();

  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();
  const stats = {
    total: holidays.length,
    upcoming: holidays.filter((h) => startOfDay(h.date) >= today).length,
    past: holidays.filter((h) => isPastHolidayDate(h.date)).length,
    thisYear: holidays.filter((h) => new Date(h.date).getFullYear() === currentYear).length,
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const holiday = holidayMap[date.toDateString()];
    if (holiday && isPastHolidayDate(date)) return 'holiday-past-tile';
    return null;
  };

  return (
    <div className="holidays-container">
      <div className="holidays-content">
        <div className="holidays-header text-gray-600">
          <h1 className=' font-semibold'> Holiday Calendar</h1>
          <p>Click on a date to manage holidays</p>
        </div>

        <div className="holidays-stats">
          <div className="holiday-stat-card stat-total">
            <p className="holiday-stat-label">Total Holidays</p>
            <p className="holiday-stat-value">{stats.total}</p>
          </div>
          <div className="holiday-stat-card stat-upcoming">
            <p className="holiday-stat-label">Upcoming</p>
            <p className="holiday-stat-value">{stats.upcoming}</p>
          </div>
          <div className="holiday-stat-card stat-past">
            <p className="holiday-stat-label">Past</p>
            <p className="holiday-stat-value">{stats.past}</p>
          </div>
          <div className="holiday-stat-card stat-year">
            <p className="holiday-stat-label">This Year ({currentYear})</p>
            <p className="holiday-stat-value">{stats.thisYear}</p>
          </div>
        </div>

        <div className="calendar-section">
          <div className="calendar-wrapper">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              onClickDay={handleDateClick}
              tileContent={tileContent}
              tileClassName={tileClassName}
              onActiveStartDateChange={({ action, activeStartDate, value, view }) => setView(view)}
              className="holiday-calendar"
              minDetail="decade"
              showNeighboringMonth={false}
            />
          </div>
          
          <div className="upcoming-holidays">
            <h2> Upcoming Holidays</h2>
            {loading ? (
              <Loader/>
            ) : upcomingHolidays.length > 0 ? (
              <ul>
                {upcomingHolidays.map((h) => (
                  <li key={h._id || h.date}>
                    <span className="holiday-date">{new Date(h.date).toLocaleDateString()}</span>
                    <span className="holiday-name">{h.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-holidays">No upcoming holidays</div>
            )}
          </div>
        </div>

        <div className="all-holidays-section">
          <h2>📋 All Holidays</h2>
          {loading ? (
            <Loader/>
          ) : holidays.length > 0 ? (
            <div className="holidays-table-container">
              <table className="holidays-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Holiday Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((h) => {
                      const past = isPastHolidayDate(h.date);
                      return (
                      <tr key={h._id || h.date} className={past ? 'holiday-row-past' : ''}>
                        <td className={past ? 'holiday-past-text' : ''}>{new Date(h.date).toLocaleDateString()}</td>
                        <td className={past ? 'holiday-past-text' : ''}>{h.name}</td>
                        <td>
                          <button 
                            className="btn-edit"
                            onClick={() => handleDateClick(new Date(h.date))}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  }
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-holidays">No holidays found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Holidays;