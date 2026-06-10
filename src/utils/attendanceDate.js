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

/** Legacy MongoDB ObjectId embeds creation time in first 4 bytes. */
export const timestampFromObjectId = (id) => {
  const hex = String(id || '');
  if (!/^[a-f0-9]{24}$/i.test(hex)) return null;
  return new Date(parseInt(hex.slice(0, 8), 16) * 1000).toISOString();
};

export const resolveRecordTimestamp = (record) => {
  if (!record) return null;

  const direct =
    record.timestamp ??
    record.createdAt ??
    record.date ??
    record.time ??
    record.checkInTime ??
    record.checkOutTime;

  if (direct && typeof direct === 'object' && direct.$date) {
    const bsonDate = new Date(direct.$date);
    if (!Number.isNaN(bsonDate.getTime())) return bsonDate.toISOString();
  }

  const d = new Date(direct);
  if (direct != null && direct !== '' && !Number.isNaN(d.getTime())) {
    return d.toISOString();
  }

  return timestampFromObjectId(record._id);
};

/** Normalize API / DB attendance type strings. */
export const normalizeAttendanceType = (type) => {
  const t = String(type || '')
    .toLowerCase()
    .trim()
    .replace(/_/g, '-')
    .replace(/\s+/g, '');
  if (t === 'checkin' || t === 'check-in' || t === 'in') return 'check-in';
  if (t === 'checkout' || t === 'check-out' || t === 'out') return 'check-out';
  if (t.includes('checkin') || (t.includes('check') && t.includes('in'))) return 'check-in';
  if (t.includes('checkout') || (t.includes('check') && t.includes('out'))) return 'check-out';
  return '';
};

/** Normalize one API row (timestamp from _id if missing). */
export const normalizeAttendanceRecord = (record) => {
  if (!record || typeof record !== 'object') return null;

  const timestamp = resolveRecordTimestamp(record);
  if (!timestamp) return null;

  const type =
    normalizeAttendanceType(record.type) ||
    normalizeAttendanceType(record.action) ||
    normalizeAttendanceType(record.status) ||
    'check-in';

  return { ...record, timestamp, type };
};

/** Parse /attendance/me API payload into display-ready rows. */
export const parseAttendanceRecords = (data) => {
  if (!Array.isArray(data)) return [];
  const seen = new Set();

  return data
    .map(normalizeAttendanceRecord)
    .filter((row) => {
      if (!row) return false;
      const key = `${row._id || ''}-${getLocalDateKey(row.timestamp)}-${row.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * What the employee should do next today:
 * - no check-in yet → check-in
 * - check-in but no check-out → check-out
 * - both done → null
 */
export const resolveTodayAttendanceType = (entries = []) => {
  const list = Array.isArray(entries) ? entries : [];
  const today = list.filter((entry) => isSameCalendarDay(entry.timestamp, new Date()));

  const hasCheckIn = today.some(
    (entry) => normalizeAttendanceType(entry.type) === 'check-in'
  );
  const hasCheckOut = today.some(
    (entry) => normalizeAttendanceType(entry.type) === 'check-out'
  );

  if (!hasCheckIn) return 'check-in';
  if (!hasCheckOut) return 'check-out';
  return null;
};

const attendanceEntryKey = (entry) =>
  `${getLocalDateKey(entry.timestamp)}-${normalizeAttendanceType(entry.type)}`;

/** Merge server list with local optimistic rows (same day + type deduped). */
export const mergeAttendanceRecords = (serverRecords, localRecords) => {
  const server = Array.isArray(serverRecords) ? serverRecords : [];
  const local = Array.isArray(localRecords) ? localRecords : [];
  const merged = [...server];

  for (const entry of local) {
    if (!normalizeAttendanceType(entry.type)) continue;
    const key = attendanceEntryKey(entry);
    if (!merged.some((row) => attendanceEntryKey(row) === key)) {
      merged.push(entry);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
