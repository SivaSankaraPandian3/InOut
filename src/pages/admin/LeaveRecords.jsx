import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Box, Container, Typography, Table, TableHead, TableRow,
  TableCell, TableBody, Select, MenuItem, Paper
} from '@mui/material';

const LeaveRecords = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredMonth, setFilteredMonth] = useState(dayjs().format('YYYY-MM'));

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get('/api/leaves/all'); // Update API URL as needed
      setLeaveRequests(res.data);
    } catch (err) {
      console.error('Error fetching leave requests', err);
    }
  };

  const months = [...new Set(leaveRequests.map(req => dayjs(req.fromDate).format('YYYY-MM')))];

  const filteredRequests = leaveRequests.filter(req =>
    dayjs(req.fromDate).format('YYYY-MM') === filteredMonth
  );

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" my={4}>
        <Typography variant="h5">Leave Requests (Admin View)</Typography>
        <Select value={filteredMonth} onChange={(e) => setFilteredMonth(e.target.value)}>
          {months.map(month => (
            <MenuItem key={month} value={month}>
              {dayjs(month + '-01').format('MMMM YYYY')}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map(req => (
              <TableRow key={req._id}>
                <TableCell>{req.user?.name}</TableCell>
                <TableCell>{dayjs(req.fromDate).format('DD MMM YYYY')}</TableCell>
                <TableCell>{dayjs(req.toDate).format('DD MMM YYYY')}</TableCell>
                <TableCell>{req.reason}</TableCell>
                <TableCell>{req.leaveType}</TableCell>
                <TableCell>{req.status}</TableCell>
              </TableRow>
            ))}
            {filteredRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No leave requests for this month.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default LeaveRecords;
