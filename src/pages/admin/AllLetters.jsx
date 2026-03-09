import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/api';
import { Box, Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, CircularProgress, TextField } from '@mui/material';
import { FiDownload } from 'react-icons/fi';

const AllLetters = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(API_ENDPOINTS.getAdminLetters, { headers: { Authorization: `Bearer ${token}` } });
        setLetters(res.data || []);
      } catch (err) {
        console.error('Failed to fetch letters', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLetters();
  }, []);

  const filtered = letters.filter(l => {
    const q = query.toLowerCase();
    return !q || (l.userName && l.userName.toLowerCase().includes(q)) || (l.filename && l.filename.toLowerCase().includes(q)) || (l.userEmail && l.userEmail.toLowerCase().includes(q));
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>All Uploaded Letters</Typography>

      <Box sx={{ mb: 2 }}>
        <TextField placeholder="Search by user, filename or email" fullWidth value={query} onChange={(e) => setQuery(e.target.value)} />
      </Box>

      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Filename</TableCell>
              <TableCell>Uploaded At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((l, idx) => (
              <TableRow key={idx}>
                <TableCell>{l.userName}</TableCell>
                <TableCell>{l.userEmail}</TableCell>
                <TableCell>{l.filename || l.url?.split('/').pop()}</TableCell>
                <TableCell>{l.uploadedAt ? new Date(l.uploadedAt).toLocaleString() : ''}</TableCell>
                <TableCell>
                  {/* <IconButton onClick={() => window.open(l.url, '_blank')} title="View">
                    <FiDownload />
                  </IconButton> */}
                  <IconButton onClick={() => { const a = document.createElement('a'); a.href = l.url; a.download = l.filename || ''; a.click(); }} title="Download">
                    <FiDownload />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
};

export default AllLetters;
