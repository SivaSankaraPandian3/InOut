import { localDateYMD } from './localDate';

export const normalizeLogs = (data) => (Array.isArray(data) ? data : []);

export const normalizeId = (id) => (id == null ? '' : String(id));

/** Timestamp from record field or MongoDB ObjectId (legacy rows without timestamp). */
export const getLogTimestamp = (log) => {
  if (log?.timestamp) {
    const d = new Date(log.timestamp);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const id = log?._id;
  if (id && /^[a-f0-9]{24}$/i.test(String(id))) {
    const seconds = Number.parseInt(String(id).substring(0, 8), 16);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  return null;
};

export const mapRawAttendanceRecords = (records = [], users = []) => {
  const byId = new Map(users.map((u) => [normalizeId(u._id), u]));
  const byEmpId = new Map(
    users.filter((u) => u.employeeId).map((u) => [String(u.employeeId).trim(), u])
  );

  return records
    .map((record) => {
      let user = null;
      if (record.user && typeof record.user === 'object') {
        user = byId.get(normalizeId(record.user._id)) || record.user;
      } else {
        user = byId.get(normalizeId(record.user)) || byEmpId.get(String(record.user || '').trim());
      }

      if (!user || user.role === 'admin') return null;
      if (user.isActive === false) return null;

      return {
        _id: record._id,
        employeeName: user.name || 'Unknown',
        name: user.name || 'Unknown',
        userId: user._id || record.user,
        employeeId: user.employeeId || '',
        type: record.type,
        timestamp: getLogTimestamp(record)?.toISOString() || record.timestamp,
        location: record.location,
        isInOffice: record.isInOffice,
        officeName: record.officeName || 'Outside Office',
        image: record.image || '',
        comment: record.comment || '',
        company: user.company || '',
      };
    })
    .filter(Boolean);
};

export const activeEmployees = (users = []) =>
  users.filter((u) => u.role === 'employee' && u.isActive !== false);

/** Build present/absent counts from loaded logs + user list (summary API fallback). */
export const buildSummaryFromLogs = (logs = [], users = [], dateFilter) => {
  const employees = activeEmployees(users);
  const dayLogs = dateFilter ? filterLogsByDate(logs, dateFilter) : logs;
  const presentIds = presentEmployeeIds(dayLogs);
  const presentToday = presentIds.size;
  const totalEmployees = employees.length;
  return {
    totalEmployees,
    presentToday,
    absentToday: Math.max(0, totalEmployees - presentToday),
  };
};

/** Fill missing employee names from the users list. */
export const enrichLogNames = (logs = [], users = []) => {
  if (!logs.length || !users.length) return logs;

  const byId = new Map(users.map((u) => [normalizeId(u._id), u]));
  const byEmpId = new Map(
    users.filter((u) => u.employeeId).map((u) => [String(u.employeeId).trim(), u])
  );

  return logs.map((log) => {
    const name = log.employeeName || log.name;
    if (name && name !== 'Unknown') return log;

    const user =
      byId.get(normalizeId(log.userId)) ||
      (log.employeeId ? byEmpId.get(String(log.employeeId).trim()) : null);

    if (!user) return log;
    return { ...log, employeeName: user.name, name: user.name, userId: user._id };
  });
};

export const filterLogsByDate = (logs, dateFilter) => {
  const target = localDateYMD(dateFilter);
  return logs.filter((log) => {
    const ts = getLogTimestamp(log);
    return ts && localDateYMD(ts) === target;
  });
};

export const presentEmployeeIds = (logs = []) =>
  new Set(
    logs
      .filter((log) => log.type === 'check-in')
      .map((log) => normalizeId(log.userId))
      .filter(Boolean)
  );
