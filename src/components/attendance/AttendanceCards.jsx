import React from 'react';

function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AttendanceCards({ attendanceData = [] }) {
  if (!attendanceData.length) return null;

  // Group attendance by date
  const grouped = attendanceData.reduce((acc, entry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  // Get latest date
  const latestDate = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))[0];
  const latestEntries = grouped[latestDate] || [];

  const checkIn = latestEntries.find(entry => entry.type === 'check-in');
  const checkOut = latestEntries.find(entry => entry.type === 'check-out');

  const cards = [
    {
      title: 'Check In',
      time: formatTime(checkIn?.timestamp),
      note: checkIn ? 'On Time' : 'Not Yet',
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800',
    },
    {
      title: 'Check Out',
      time: formatTime(checkOut?.timestamp),
      note: checkOut ? 'Go Home' : 'Not Yet',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    {
      title: 'Break Time',
      time: '00:40 min',
      note: 'Avg Time 30 min',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    {
      title: 'Total Days',
      time: Object.keys(grouped).length.toString(),
      note: 'Working Days',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} p-4 rounded-xl shadow-md border border-gray-200`}
        >
          <p className="text-sm text-gray-700">{card.title}</p>
          <h4 className={`text-xl font-bold ${card.textColor}`}>{card.time}</h4>
          <p className={`text-xs font-medium ${card.textColor}`}>{card.note}</p>
        </div>
      ))}
    </div>
  );
}

export default AttendanceCards;
