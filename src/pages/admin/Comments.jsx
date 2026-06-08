import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import {
  getAttendanceImage,
  resolveAttendanceImageUrl,
} from '../../utils/attendanceImage';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  CircularProgress,
  Tooltip,
  Button
} from '@mui/material';
import Loader from '../../components/admin-dashboard/common/Loader';

const CommentsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(API_ENDPOINTS.getRecentAttendanceLogs, { headers });
        setLogs(res.data || []);
      } catch (err) {
        console.error('Failed to fetch attendance logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const withComment = (log) => log && log.comment && String(log.comment).trim().length > 0;

  const filterByMonth = (month, year) =>
    logs
      .filter((l) => withComment(l))
      .filter((l) => {
        try {
          const d = new Date(l.timestamp);
          return d.getMonth() === month && d.getFullYear() === year;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const currentComments = filterByMonth(currentMonth, currentYear);
  const prevComments = filterByMonth(prevMonth, prevYear);

  if (loading) {
    return (
        <Loader />
    );
  }

  const renderTable = (items) => (
    <Paper sx={{ p: 2, mt: 2 }} elevation={2}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Office</TableCell>
            <TableCell>Comment</TableCell>
            <TableCell>Image</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row, idx) => {
            const d = new Date(row.timestamp);
            return (
              <TableRow key={idx} hover>
                <TableCell>{d.toLocaleDateString()}</TableCell>
                <TableCell>{row.employeeName || row.userName || 'Unknown'}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                <TableCell>{row.officeName || '—'}</TableCell>
                <TableCell style={{ maxWidth: 400 }}>
                  <Tooltip title={row.comment} arrow>
                    <span style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 }}>
                      {row.comment}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {(() => {
                    const imgSrc = resolveAttendanceImageUrl(getAttendanceImage(row));
                    return imgSrc ? (
                    <a href={imgSrc} target="_blank" rel="noreferrer">
                      <Avatar src={imgSrc} variant="rounded" sx={{ width: 48, height: 48 }} />
                    </a>
                  ) : (
                    <Avatar sx={{ width: 36, height: 36 }}>{(row.employeeName || 'U').charAt(0)}</Avatar>
                  );
                  })()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Attendance Comments — Current & Previous Month
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle1">Current Month ({now.toLocaleString('default', { month: 'long', year: 'numeric' })})</Typography>
        <Typography variant="caption" color="text.secondary">{currentComments.length} comments</Typography>
        <Button size="small" onClick={() => window.location.reload()}>Refresh</Button>
      </Stack>

      {currentComments.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }} elevation={1}>
          <Typography>No comments for current month.</Typography>
        </Paper>
      ) : (
        renderTable(currentComments)
      )}

      <Typography variant="subtitle1" sx={{ mt: 4 }}>
        Previous Month ({new Date(prevYear, prevMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}) — {prevComments.length} comments
      </Typography>

      {prevComments.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }} elevation={1}>
          <Typography>No comments for previous month.</Typography>
        </Paper>
      ) : (
        renderTable(prevComments)
      )}
    </Box>
  );
};

export default CommentsPage;
