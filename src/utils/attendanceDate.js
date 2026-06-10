/** Local calendar day key YYYY-MM-DD (browser timezone). */
export const getLocalDateKey = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const isSameCalendarDay = (a, b) => getLocalDateKey(a) === getLocalDateKey(b);
