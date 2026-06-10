import { isSameLocalDay } from './localDate';

export const normalizeLogs = (data) => (Array.isArray(data) ? data : []);

export const normalizeId = (id) => (id == null ? '' : String(id));

export const activeEmployees = (users = []) =>
  users.filter((u) => u.role === 'employee' && u.isActive !== false);

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

export const filterLogsByDate = (logs, dateFilter) =>
  logs.filter((log) => isSameLocalDay(log.timestamp, dateFilter));

export const presentEmployeeIds = (logs = []) =>
  new Set(
    logs
      .filter((log) => log.type === 'check-in')
      .map((log) => normalizeId(log.userId))
      .filter(Boolean)
  );
