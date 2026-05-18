import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../utils/api";
import { Sync, Home as WFHIcon } from '@mui/icons-material';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import html2pdf from 'html2pdf.js';
import { Button } from "@mui/material";


import {
  Box,
  Typography,
  Paper,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  EventAvailable as PresentIcon,
  EventBusy as AbsentIcon,
  Event as LeaveIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  Business as CompanyIcon,
  Work as PositionIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  WorkOutline as WorkDaysIcon,
  AccessTime as ScheduledIcon,
  Warning as LateIcon,
  AlarmOn as EarlyIcon
} from "@mui/icons-material";

import CommentIcon from '@mui/icons-material/Comment';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Loader from "../../components/admin-dashboard/common/Loader";
import { getPrimaryWork } from "../../utils/userWorks";

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const normalizeName = (name) => (name || '').trim().toLowerCase();

/** Display name on attendance rows (API often uses user.name, not employeeName). */
const logEmployeeLabel = (log) => {
  if (!log || typeof log !== 'object') return 'Unknown';
  const raw =
    (log.employeeName || '').trim() ||
    (log.user?.name || '').trim() ||
    [log.user?.firstName, log.user?.lastName].filter(Boolean).join(' ').trim();
  return raw || 'Unknown';
};

const logUserId = (log) => {
  if (!log || typeof log !== 'object') return null;
  const id = log.userId ?? log.user?._id ?? log.user?.id;
  return id != null && id !== '' ? String(id) : null;
};

const normalizeLogType = (type) => String(type || '').toLowerCase().replace(/[\s_-]/g, '');

const mergeAttendanceCell = (cell, log) => {
  if (!log || typeof log !== 'object') return cell;
  const t = normalizeLogType(log.type);
  if (t === 'checkin') {
    if (!cell.checkIn || new Date(log.timestamp) < new Date(cell.checkIn.timestamp)) {
      cell.checkIn = log;
    }
  } else if (t === 'checkout') {
    if (!cell.checkOut || new Date(log.timestamp) > new Date(cell.checkOut.timestamp)) {
      cell.checkOut = log;
    }
  }
  return cell;
};

/** Index logs by userId, exact display name, and normalized name for report lookups. */
const buildAttendanceIndex = (filteredLogs) => {
  const byUserId = {};
  const byExactName = {};
  const byNormName = {};

  const touch = (bucket, key, dateKey) => {
    if (!bucket[key]) bucket[key] = {};
    if (!bucket[key][dateKey]) bucket[key][dateKey] = { checkIn: null, checkOut: null };
    return bucket[key][dateKey];
  };

  filteredLogs.forEach((log) => {
    if (!log || !log.timestamp) return;
    const dateKey = new Date(log.timestamp).toDateString();
    const label = logEmployeeLabel(log);
    const uid = logUserId(log);
    const norm = normalizeName(label);

    if (uid) mergeAttendanceCell(touch(byUserId, uid, dateKey), log);
    if (label && label !== 'Unknown') mergeAttendanceCell(touch(byExactName, label, dateKey), log);
    if (norm) mergeAttendanceCell(touch(byNormName, norm, dateKey), log);
  });

  return { byUserId, byExactName, byNormName };
};

const getDayAttendance = (index, employeeDisplayName, resolvedUserId, dateKey) => {
  if (resolvedUserId && index.byUserId[resolvedUserId]?.[dateKey]) {
    return index.byUserId[resolvedUserId][dateKey];
  }
  if (index.byExactName[employeeDisplayName]?.[dateKey]) {
    return index.byExactName[employeeDisplayName][dateKey];
  }
  const nk = normalizeName(employeeDisplayName);
  if (nk && index.byNormName[nk]?.[dateKey]) {
    return index.byNormName[nk][dateKey];
  }
  return { checkIn: null, checkOut: null };
};

const normalizeWeeklySchedule = (ws) => {
  if (!ws || typeof ws !== 'object') return {};
  const dayMap = {
    sun: 'Sunday', sunday: 'Sunday',
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
  };
  const out = {};
  Object.entries(ws).forEach(([day, val]) => {
    const lower = String(day).trim().toLowerCase();
    const full = dayMap[lower] || (day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
    if (WEEKDAYS.includes(full)) out[full] = val;
  });
  return out;
};

const findScheduleForEmployee = (employeeName, scheduleList, userId) => {
  const key = normalizeName(employeeName);
  if (!key) return null;
  return scheduleList.find((sch) => {
    const schUserId = sch.user?._id || sch.user?.id || sch.userId;
    if (userId && schUserId && String(schUserId) === String(userId)) return true;
    const names = [
      sch.user?.name,
      sch.name,
      sch.employeeName,
      [sch.user?.firstName, sch.user?.lastName].filter(Boolean).join(' '),
    ];
    return names.some((n) => normalizeName(n) === key);
  }) || null;
};

const resolveEmployeeContext = (employeeName, schedules, allUsers, logs) => {
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];
  const sampleLog = safeLogs.find((l) => {
    const label = logEmployeeLabel(l);
    return normalizeName(label) === normalizeName(employeeName);
  });
  const userIdFromLog = logUserId(sampleLog);
  const schedule = findScheduleForEmployee(employeeName, schedules, userIdFromLog);
  const scheduleUserId =
    schedule?.user?._id != null
      ? String(schedule.user._id)
      : schedule?.user?.id != null
        ? String(schedule.user.id)
        : null;
  const resolvedUserId = userIdFromLog || scheduleUserId || null;

  const weeklySchedule = normalizeWeeklySchedule(schedule?.weeklySchedule);

  let user = schedule?.user;
  if (typeof user === 'string') {
    user = allUsers.find((u) => String(u._id) === String(user));
  }
  if (!user) {
    user = allUsers.find((u) => normalizeName(u.name) === normalizeName(employeeName))
      || (resolvedUserId && allUsers.find((u) => String(u._id) === String(resolvedUserId)));
  }

  const primary = getPrimaryWork(user || {});
  return {
    schedule,
    weeklySchedule,
    resolvedUserId,
    position: primary.position || user?.position || schedule?.user?.position,
    company: primary.company || user?.company || schedule?.user?.company,
  };
};

const isScheduledWorkDay = (dateObj, weeklySchedule, isHolidayDate) => {
  if (isHolidayDate || dateObj.getDay() === 0) return false;

  const norm = normalizeWeeklySchedule(weeklySchedule);
  const hasConfig = Object.keys(norm).length > 0;
  if (!hasConfig) return true;

  const daySchedule = norm[getDayName(dateObj)];
  if (daySchedule === undefined) return false;
  return !daySchedule.isLeave;
};

/** Active employee — same rule as All Users (not past / disabled). */
const isActiveEmployee = (user) => {
  if (!user || typeof user !== 'object') return false;
  if (user.isActive === false) return false;
  if (user.dateOfRelieving) return false;
  return true;
};

const employeeIsActive = (displayName, schedules, allUsers, logs) => {
  const { resolvedUserId, schedule } = resolveEmployeeContext(displayName, schedules, allUsers, logs);

  const byId =
    resolvedUserId &&
    allUsers.find((u) => String(u._id) === String(resolvedUserId));
  if (byId) return isActiveEmployee(byId);

  const byName = allUsers.find(
    (u) => normalizeName(u.name) === normalizeName(displayName)
  );
  if (byName) return isActiveEmployee(byName);

  let schUser = schedule?.user;
  if (typeof schUser === 'string') {
    schUser = allUsers.find((u) => String(u._id) === String(schUser));
  }
  if (schUser && typeof schUser === 'object') return isActiveEmployee(schUser);

  return false;
};



const theme = createTheme({
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
});




const getDatesInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const dates = [];
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

const getDayName = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "long" });
};

/** Calendar date key YYYY-MM-DD without timezone shift (fixes UTC holiday dates). */
const toDateKey = (date) => {
  if (!date) return '';
  const str = String(date);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const normalizeHolidayList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.holidays)) return data.holidays;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const filterHolidaysForMonth = (list, year, monthIndex0) => {
  const month = monthIndex0 + 1;
  return normalizeHolidayList(list).filter((h) => {
    const key = toDateKey(h.date);
    if (!key) return false;
    const [y, m] = key.split('-').map(Number);
    return y === year && m === month;
  });
};

const eachDateInRange = (from, to) => {
  const dates = [];
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const Report = () => {
  const [logs, setLogs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);
  /** Bump to refetch without full page reload (replaces localStorage cache for this page). */
  const [dataFetchNonce, setDataFetchNonce] = useState(0);

  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [searchTerm, setSearchTerm] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      try {
        console.log("⏳ Fetching fresh data...");
        const [logsRes, schedulesRes, leavesRes, allHolidaysRes, usersRes] = await Promise.all([
          axios.get(API_ENDPOINTS.getAttendanceAll, { headers }),
          axios.get(API_ENDPOINTS.getSchedules, { headers }),
          axios.get(API_ENDPOINTS.getAllLeaves, { headers }),
          axios.get(API_ENDPOINTS.getHolidays, { headers }),
          axios.get(API_ENDPOINTS.getUsers, { headers }),
        ]);

        let holidayData = filterHolidaysForMonth(allHolidaysRes.data, year, selectedMonth.getMonth());

        if (holidayData.length === 0) {
          try {
            const monthHolidaysRes = await axios.get(
              `${API_ENDPOINTS.getHolidaysByMonth}?year=${year}&month=${month}`,
              { headers }
            );
            holidayData = filterHolidaysForMonth(monthHolidaysRes.data, year, selectedMonth.getMonth());
          } catch {
            /* use empty */
          }
        }

        const leavesData = Array.isArray(leavesRes.data) ? leavesRes.data : [];

        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];

        setLogs(Array.isArray(logsRes.data) ? logsRes.data.filter(Boolean) : []);
        setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
        setAllUsers(usersData);
        setHolidays(holidayData);
        setApprovedLeaves(leavesData);
      }
      catch (err) {
        console.error("Failed to fetch data:", err);
      }
      finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedMonth, dataFetchNonce]);
  // Add selectedMonth as dependency

  const holidayDateKeys = useMemo(
    () => new Set(holidays.map((h) => toDateKey(h.date)).filter(Boolean)),
    [holidays]
  );

  const isHoliday = (date) => holidayDateKeys.has(toDateKey(date));

  const getHolidayName = (date) => {
    const key = toDateKey(date);
    const holiday = holidays.find((h) => toDateKey(h.date) === key);
    return holiday ? holiday.name : null;
  };

  const getApprovedLeaveOnDate = (employeeName, dateObj) => {
    const key = toDateKey(dateObj);
    const empKey = normalizeName(employeeName);
    return approvedLeaves.find((leave) => {
      const name = leave.user?.name || leave.employeeName;
      if (normalizeName(name) !== empKey) return false;
      if ((leave.status || '').toLowerCase() !== 'approved') return false;
      return eachDateInRange(leave.fromDate, leave.toDate).some((d) => toDateKey(d) === key);
    });
  };

  const isOnApprovedLeave = (employeeName, dateObj) => !!getApprovedLeaveOnDate(employeeName, dateObj);


  const [year, month] = [selectedMonth.getFullYear(), selectedMonth.getMonth()];
  const allDates = getDatesInMonth(year, month);


  const employees = useMemo(() => {
    const names = new Set();
    allUsers.forEach((u) => {
      if (isActiveEmployee(u) && u.name) names.add(u.name);
    });
    logs.forEach((log) => {
      const label = logEmployeeLabel(log);
      if (label && label !== 'Unknown') names.add(label);
    });
    schedules.forEach((sch) => {
      const n = sch.user?.name || sch.name;
      if (n) names.add(n);
    });
    return [...names]
      .filter((employee) => employeeIsActive(employee, schedules, allUsers, logs))
      .filter((employee) => employee.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }, [logs, schedules, allUsers, searchTerm]);
  const monthYearLabel = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const fitToColumn = (data) => {
    const result = data[0].map((col, i) => {
      const maxLength = data.reduce((acc, row) => {
        const val = row[i] ? row[i].toString() : '';
        return Math.max(acc, val.length);
      }, col ? col.toString().length : 0);
      return { wch: maxLength + 2 }; // Add extra padding
    });
    return result;
  };
  const downloadDetailedExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Name', 'Position', 'Company', 'Total Days', 'Present', 'Absent', 'Holidays', 'Leaves', 'Late']
    ];

    // Build Summary Sheet Data
    employees.forEach((employee) => {
      const { weeklySchedule, position, company, resolvedUserId } = resolveEmployeeContext(employee, schedules, allUsers, logs);
      const stats = getEmployeeStats(employee, weeklySchedule, resolvedUserId);

      summaryData.push([
        employee,
        position || 'Position',
        company || 'Company',
        stats.scheduledWorkingDays,
        stats.presentCount,
        stats.absentCount,
        stats.holidayCount,
        stats.leaveCount,
        stats.lateCount
      ]);
    });

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWS['!autofilter'] = { ref: "A1:I1" };
    summaryWS['!cols'] = fitToColumn(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Individual Employee Sheets
    employees.forEach((employee) => {
      const wsData = [
        ['Date', 'Day', 'CheckIn', 'CheckOut', 'WorkHours', 'Status', 'Late', 'EarlyLeave']
      ];

      const { weeklySchedule, resolvedUserId } = resolveEmployeeContext(employee, schedules, allUsers, logs);
      const normSchedule = normalizeWeeklySchedule(weeklySchedule);

      allDates.forEach((dateObj) => {
        const dateKey = dateObj.toDateString();
        const dayName = getDayName(dateObj);
        const attendance = getDayAttendance(attendanceIndex, employee, resolvedUserId, dateKey);
        const checkIn = attendance?.checkIn;
        const checkOut = attendance?.checkOut;
        const scheduled = normSchedule[dayName];

        const checkInTime = checkIn
          ? new Date(checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        const checkOutTime = checkOut
          ? new Date(checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        const approvedLeave = getApprovedLeaveOnDate(employee, dateObj);

        let status = '—';
        if (isHoliday(dateObj)) {
          status = getHolidayName(dateObj) || 'Holiday';
        } else if (approvedLeave) {
          status = `Leave (${approvedLeave.leaveType || 'Approved'})`;
        } else if (scheduled?.isLeave && checkIn) {
          const officeName = checkIn.officeName?.toLowerCase() || '';
          const presentType = (!officeName.includes("velechery") && !officeName.includes("pallikaranai")) ? 'WFH' : 'Present';
          status = `${presentType} (Scheduled Leave)`;  // Mark both Present and Scheduled Leave
        } else if (scheduled?.isLeave) {
          status = 'Leave';
        } else if (checkIn) {
          const officeName = checkIn.officeName?.toLowerCase() || '';
          status = (!officeName.includes("velechery") && !officeName.includes("pallikaranai")) ? 'WFH' : 'Present';
        } else if (dateObj.getDay() !== 0 && scheduled && !scheduled.isLeave) {
          status = 'Absent';
        }

        let workHours = '';
        if (checkIn && checkOut) {
          const diff = new Date(checkOut.timestamp) - new Date(checkIn.timestamp);
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff / (1000 * 60)) % 60);
          workHours = `${h}h ${m}m`;
        }

        let isLate = '';
        let isEarly = '';
        if (checkIn && scheduled?.start) {
          const [schInH, schInM] = scheduled.start.split(":").map(Number);
          const schIn = new Date(dateObj);
          schIn.setHours(schInH, schInM, 0, 0);
          const actualIn = new Date(checkIn.timestamp);
          const schInWithGrace = new Date(schIn.getTime() + 10 * 60000);
          if (actualIn > schInWithGrace) isLate = 'Yes';
        }

        if (checkOut && scheduled?.end) {
          const [schOutH, schOutM] = scheduled.end.split(":").map(Number);
          const schOut = new Date(dateObj);
          schOut.setHours(schOutH, schOutM, 0, 0);
          const actualOut = new Date(checkOut.timestamp);
          if (actualOut < schOut) isEarly = 'Yes';
        }

        wsData.push([
          dateObj.toLocaleDateString(),
          dayName,

          checkInTime,
          checkOutTime,
          workHours,
          status,
          isLate,
          isEarly,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!autofilter'] = { ref: "A1:H1" };
      ws['!cols'] = fitToColumn(wsData);
      XLSX.utils.book_append_sheet(wb, ws, employee.substring(0, 31));
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(dataBlob, `Attendance_Report_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}.xlsx`);
  };





  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (!log || !log.timestamp) return false;
        const date = new Date(log.timestamp);
        return date.getFullYear() === year && date.getMonth() === month;
      }),
    [logs, year, month]
  );

  const attendanceIndex = useMemo(
    () => buildAttendanceIndex(filteredLogs),
    [filteredLogs]
  );

  const getEmployeeStats = (employee, weeklySchedule, resolvedUserId) => {
    let presentCount = 0;
    let absentCount = 0;
    let holidayCount = 0;
    let leaveCount = 0;
    let wfhCount = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let scheduledWorkingDays = 0;

    let incompleteDays = 0; // ✅ NEW

    allDates.forEach((dateObj) => {
      const dateKey = dateObj.toDateString();
      const today = new Date();
      const isFuture = dateObj > today;
      const dayName = getDayName(dateObj);
      const normSchedule = normalizeWeeklySchedule(weeklySchedule);
      const scheduled = normSchedule[dayName];
      const isHolidayDate = isHoliday(dateObj);
      const workDay = isScheduledWorkDay(dateObj, weeklySchedule, isHolidayDate);

      if (isFuture) return;

      if (workDay) {
        scheduledWorkingDays++;
      }

      const attendance = getDayAttendance(attendanceIndex, employee, resolvedUserId, dateKey);
      const checkIn = attendance?.checkIn;
      const checkOut = attendance?.checkOut;

      if (isHolidayDate) {
        holidayCount++;
      }
      else if (scheduled?.isLeave || isOnApprovedLeave(employee, dateObj)) {
        leaveCount++;
      }
      else if (checkIn && !checkOut) {
        // ✅ CHECK-IN WITHOUT CHECK-OUT
        incompleteDays++;
        presentCount++; // still counts as present (optional – you can change)
      }
      else if (checkIn) {
        presentCount++;

        const officeName = checkIn.officeName?.toLowerCase();
        const isWFH = officeName &&
          !officeName.includes("velechery") &&
          !officeName.includes("pallikaranai");

        if (isWFH) wfhCount++;

        if (scheduled?.start) {
          const [h, m] = scheduled.start.split(":").map(Number);
          const schIn = new Date(dateObj);
          schIn.setHours(h, m, 0, 0);
          const actualIn = new Date(checkIn.timestamp);
          if (actualIn > new Date(schIn.getTime() + 10 * 60000)) {
            lateCount++;
          }
        }

        if (checkOut && scheduled?.end) {
          const [h, m] = scheduled.end.split(":").map(Number);
          const schOut = new Date(dateObj);
          schOut.setHours(h, m, 0, 0);
          if (new Date(checkOut.timestamp) < schOut) {
            earlyCount++;
          }
        }
      }
      else if (
        workDay &&
        !isOnApprovedLeave(employee, dateObj) &&
        !scheduled?.isLeave
      ) {
        absentCount++;
      }
    });

    return {
      presentCount,
      absentCount,
      holidayCount,
      leaveCount,
      wfhCount,
      lateCount,
      earlyCount,
      scheduledWorkingDays,
      incompleteDays, // ✅ RETURN IT
    };
  };



  if (loading) {
    return (
      <Loader />
      // <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      //   <CircularProgress />
      // </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ p: 3, maxWidth: "1800px", mx: "auto" }}>


          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <DatePicker
                views={["year", "month"]}
                openTo="month"
                label="Select Month"
                value={selectedMonth}
                onChange={(newValue) => {
                  if (newValue) {
                    setSelectedMonth(new Date(newValue.getFullYear(), newValue.getMonth(), 1));
                  }
                }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Employee"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>

              <Button variant="contained" color="primary" onClick={downloadDetailedExcel}>
                Download Detailed Excel
              </Button>&nbsp;
              <Button  variant="contained" color="primary" onClick={() => {
                try {
                  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
                    const k = localStorage.key(i);
                    if (k && (k.startsWith('attendanceCache') || k.startsWith('attendanceCacheTime'))) {
                      localStorage.removeItem(k);
                    }
                  }
                } catch {
                  /* ignore */
                }
                setDataFetchNonce((n) => n + 1);
              }}><Sync/>
                Refresh Data
                
              </Button>
            </Grid>
          </Grid>

          <Box id="report-content" >
            <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
              <h1 className="text-2xl font-bold text-gray-600">
                {monthYearLabel} User wise Attendance Report
              </h1>
              <Chip label={`${employees.length} Active`} color="success" size="small" variant="outlined" />
              <Chip label={`${holidays.length} Holidays`} color="secondary" size="small" variant="outlined" />
              <Chip
                label={`${approvedLeaves.filter((l) => (l.status || '').toLowerCase() === 'approved' && new Date(l.fromDate).getFullYear() === year && new Date(l.fromDate).getMonth() === month).length} Approved Leaves`}
                color="info"
                size="small"
                variant="outlined"
              />
            </Stack>



            {employees.length === 0 ? (
              <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6">
                  {searchTerm ? "No matching active employees found" : "No active employees for this month"}
                </Typography>
              </Paper>
            ) : (
              employees.map((employee, index) => {
                const { weeklySchedule, position: role, company: org, resolvedUserId } = resolveEmployeeContext(
                  employee,
                  schedules,
                  allUsers,
                  logs
                );
                const {
                  presentCount,
                  absentCount,
                  holidayCount,
                  leaveCount,
                  wfhCount,
                  lateCount,
                  earlyCount,
                  scheduledWorkingDays,
                  incompleteDays
                } = getEmployeeStats(employee, weeklySchedule, resolvedUserId);

                const position = role || "Position not specified";
                const company = org || "Company not specified";
                const attendanceDenominator = scheduledWorkingDays || presentCount + absentCount;
                const attendancePercentage = attendanceDenominator > 0
                  ? Math.min(100, Math.round((presentCount / attendanceDenominator) * 100))
                  : 0;

                return (
                  <div key={employee} id={`employee-section-${index}`} style={{ marginBottom: "20px" }}>
                    <Card key={employee} elevation={3} sx={{ mb: 4, border: '1px solid #ddd' }}>
                      <CardContent>
                        {/* Employee Summary Section */}
                        <Grid container spacing={3} mb={4}>
                          <Grid item xs={12} md={4}>
                            <Stack direction="row" spacing={3} alignItems="center">
                              <Avatar sx={{ width: 60, height: 60 }}>
                                <PersonIcon fontSize="large" />
                              </Avatar>
                              <Box>
                                <Typography variant="h5">{employee}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {position}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {company}
                                </Typography>
                              </Box>
                              <Grid item xs={6} sm={4} md={3} >
                                <Paper elevation={1} sx={{ p: 2, mx: 6, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                    <WorkDaysIcon color="action" />
                                    <Typography variant="h6">
                                      {scheduledWorkingDays}
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2">Scheduled Work Days</Typography>
                                </Paper>
                              </Grid>
                                <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="error">
                                    {absentCount}
                                  </Typography>
                                  <Typography variant="body2">Absent Days</Typography>
                                </Paper>
                              </Grid>
                            </Stack>

                            {/* {weeklySchedule && (
                        <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            <ScheduledIcon color="primary" sx={{ fontSize: 16, mr: 1 }} />
                            Weekly Schedule
                          </Typography>
                          <List dense>
                            {Object.entries(weeklySchedule).map(([day, time]) => (
                              <ListItem key={day} sx={{ py: 0 }}>
                                <ListItemText
                                  primary={`${day}: ${time.isLeave ? 'Leave' : `${time.start} - ${time.end}`}`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      )} */}
                          </Grid>

                          <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>

                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: "center", border: '1px solid #ddd' }}>
                                  <Typography variant="h6" color="primary">
                                    {presentCount}
                                  </Typography>
                                  <Typography variant="body2">Present Days</Typography>
                                </Paper>
                              </Grid>
                            
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" sx={{ color: '#7c3aed' }}>
                                    {holidayCount}
                                  </Typography>
                                  <Typography variant="body2">Holidays</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="info.main">
                                    {leaveCount}
                                  </Typography>
                                  <Typography variant="body2">Leaves</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="success.main">
                                    {wfhCount}
                                  </Typography>
                                  <Typography variant="body2">WFH Days</Typography>
                                </Paper>
                              </Grid>

                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color={attendancePercentage >= 90 ? "success.main" : "warning.main"}>
                                    {attendancePercentage}%
                                  </Typography>
                                  <Typography variant="body2">Attendance</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="warning.main">
                                    {lateCount}
                                  </Typography>
                                  <Typography variant="body2">Late Arrivals</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="warning.main">
                                    {earlyCount}
                                  </Typography>
                                  <Typography variant="body2">Early Departures</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6} sm={4} md={3}>
                                <Paper elevation={1} sx={{ p: 2, border: '1px solid #ddd', textAlign: "center" }}>
                                  <Typography variant="h6" color="warning.main">
                                    {incompleteDays}
                                  </Typography>
                                  <Typography variant="body2">Missing Check-Out</Typography>
                                </Paper>
                              </Grid>

                            </Grid>
                          </Grid>
                        </Grid>
                        <Button
                          variant="outlined"
                          onClick={() => setOpenIndex(openIndex === index ? null : index)}
                          sx={{ mb: 2 }}
                        >
                          {openIndex === index ? "Hide Detailed Log" : "View Detailed Log"}
                        </Button>

                        <Divider sx={{ my: 2 }} />

                        {/* Calendar View */}
                        {openIndex === index && (
                          <Box sx={{ overflowX: "auto" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell align="center">Day</TableCell>
                                  <TableCell align="center">Check-In</TableCell>
                                  <TableCell align="center">Check-Out</TableCell>
                                  <TableCell align="center">Scheduled</TableCell>
                                  <TableCell align="center">Work Hours</TableCell>
                                  <TableCell align="center">Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {allDates.map((dateObj, idx) => {
                                  const dateKey = dateObj.toDateString();
                                  const today = new Date();
                                  const isFuture = dateObj > today;
                                  const dayName = getDayName(dateObj);
                                  const scheduled = normalizeWeeklySchedule(weeklySchedule)[dayName];
                                  const isHolidayDate = isHoliday(dateObj);
                                  const workDay = isScheduledWorkDay(dateObj, weeklySchedule, isHolidayDate);
                                  const holidayName = getHolidayName(dateObj);

                                  const attendance = getDayAttendance(attendanceIndex, employee, resolvedUserId, dateKey);
                                  const checkIn = attendance?.checkIn;
                                  const checkOut = attendance?.checkOut;

                                  const checkInTime = checkIn
                                    ? new Date(checkIn.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : "—";
                                  const checkOutTime = checkOut
                                    ? new Date(checkOut.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : "—";

                                  let workHours = "—";
                                  if (checkIn && checkOut) {
                                    const start = new Date(checkIn.timestamp);
                                    const end = new Date(checkOut.timestamp);
                                    const diff = end - start;
                                    const h = Math.floor(diff / (1000 * 60 * 60));
                                    const m = Math.floor((diff / (1000 * 60)) % 60);
                                    workHours = `${h}h ${m}m`;
                                  }

                                  const approvedLeave = getApprovedLeaveOnDate(employee, dateObj);

                                  let status = "—";
                                  let statusColor = "default";
                                  let late = false;
                                  let early = false;
                                  let isWFH = false;
                                  if (isFuture) {
                                    status = "";
                                  } else if (isHolidayDate) {
                                    status = holidayName || "Holiday";
                                    statusColor = "info";
                                  } else if (approvedLeave) {
                                    status = `Leave (${approvedLeave.leaveType || 'Approved'})`;
                                    statusColor = "info";
                                  } else if (scheduled?.isLeave) {
                                    status = "Scheduled Leave";
                                    statusColor = "info";
                                  } else if (checkIn && checkOut) {
                                    const officeName = checkIn.officeName?.toLowerCase() || '';
                                    isWFH = !officeName.includes("velechery") && !officeName.includes("pallikaranai");

                                    status = isWFH ? "Remote" : "Present";
                                    statusColor = isWFH ? "secondary" : "success";

                                    // Check for late arrival or early departure
                                    if (scheduled?.start) {
                                      const [schInH, schInM] = scheduled.start.split(":").map(Number);
                                      const schIn = new Date(dateObj);
                                      schIn.setHours(schInH, schInM, 0, 0);
                                      const actualIn = new Date(checkIn.timestamp);
                                      const schInWithGrace = new Date(schIn.getTime() + 10 * 60000);
                                      if (actualIn > schInWithGrace) late = true;
                                    }

                                    if (checkOut && scheduled?.end) {
                                      const [schOutH, schOutM] = scheduled.end.split(":").map(Number);
                                      const schOut = new Date(dateObj);
                                      schOut.setHours(schOutH, schOutM, 0, 0);
                                      const actualOut = new Date(checkOut.timestamp);
                                      if (actualOut < schOut) early = true;
                                    }
                                  }
                                  else if (checkIn && !checkOut) {
                                    status = "Incomplete";
                                    statusColor = "warning";
                                  }
                                  else if (
                                    workDay &&
                                    !isOnApprovedLeave(employee, dateObj)
                                  ) {
                                    status = "Absent";
                                    statusColor = "error";
                                  }

                                  if (isFuture) return null;



                                  return (
                                    <TableRow key={idx} hover>
                                      <TableCell>
                                        {dateObj.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </TableCell>
                                      <TableCell align="center">{dayName}</TableCell>
                                      <TableCell align="center">
                                        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                          {late && <LateIcon color="warning" fontSize="small" />}

                                            {/* Show check-in time and tooltip if comment exists */}
                                            {checkIn?.comment ? (
                                              <>
                                                <Tooltip title={checkIn.comment} arrow>
                                                  <Typography sx={{ fontSize: "0.9rem" }}>{checkInTime}</Typography>
                                                </Tooltip>
                                                <Tooltip title={checkIn.comment} arrow>
                                                  <CommentIcon fontSize="small" sx={{ color: 'action.active', ml: 0.5 }} />
                                                </Tooltip>
                                              </>
                                            ) : (
                                              <Typography sx={{ fontSize: "0.9rem" }}>{checkInTime}</Typography>
                                            )}
                                        </Stack>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                                          {early && <EarlyIcon color="warning" fontSize="small" />}

                                            {/* Show check-out time and tooltip if comment exists */}
                                            {checkOut?.comment ? (
                                              <>
                                                <Tooltip title={checkOut.comment} arrow>
                                                  <Typography sx={{ fontSize: "0.9rem" }}>{checkOutTime}</Typography>
                                                </Tooltip>
                                                <Tooltip title={checkOut.comment} arrow>
                                                  <CommentIcon fontSize="small" sx={{ color: 'action.active', ml: 0.5 }} />
                                                </Tooltip>
                                              </>
                                            ) : (
                                              <Typography sx={{ fontSize: "0.9rem" }}>{checkOutTime}</Typography>
                                            )}
                                        </Stack>
                                      </TableCell>
                                      <TableCell align="center">
                                        {isHolidayDate
                                          ? (holidayName || 'Holiday')
                                          : approvedLeave
                                            ? `Leave (${approvedLeave.leaveType || 'Approved'})`
                                            : scheduled?.isLeave
                                              ? 'Scheduled Leave'
                                              : `${scheduled?.start || "—"} - ${scheduled?.end || "—"}`}
                                      </TableCell>
                                      <TableCell align="center">{workHours}</TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={status}
                                          color={statusColor}
                                          size="small"
                                          variant="outlined"
                                          sx={{ width: '100px', justifyContent: 'left' }} // Ensure fixed width
                                          icon={
                                            status === "Remote" ? (
                                              <WFHIcon fontSize="small" />
                                            ) : status === "Present" ? (
                                              <PresentIcon fontSize="small" />
                                            ) : status === "Absent" ? (
                                              <AbsentIcon fontSize="small" />
                                            ) : (
                                              <LeaveIcon fontSize="small" />
                                            )
                                          }
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default Report;