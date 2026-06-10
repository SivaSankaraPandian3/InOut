import React from 'react';
import { isSameCalendarDay } from '../../utils/attendanceDate';

function DateStrip({ selectedDate, setSelectedDate, markedDates = [], daysToShow = 60 }) {
  const today = new Date();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = Array.from({ length: daysToShow }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(today.getDate() - (daysToShow - 1 - i));
    return {
      date: d,
      day: d.getDate().toString().padStart(2, '0'),
      label: dayLabels[d.getDay()],
      isToday: isSameCalendarDay(d, today),
      isSelected: isSameCalendarDay(d, selectedDate),
      hasActivity: markedDates.some((key) => isSameCalendarDay(key, d)),
    };
  });

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 text-center">
        Last {daysToShow} days — tap a date to view records
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(d.date)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border shadow-sm min-w-[55px] shrink-0 transition-all
            ${
              d.isSelected
                ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">{d.day}</span>
            <span className="text-xs font-medium">{d.label}</span>
            {d.hasActivity && (
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DateStrip;
