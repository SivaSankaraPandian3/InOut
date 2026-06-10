/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localDateYMD(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(a, b) {
  return localDateYMD(a) === localDateYMD(b);
}
