import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  MenuItem,
  Grid,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress
} from "@mui/material";
import {
  Search,
  FilterList,
  Download,
  CalendarMonth
} from "@mui/icons-material";
import { API_ENDPOINTS } from "../../utils/api";
import dayjs from "dayjs";
import Loader from "../../components/admin-dashboard/common/Loader";

const PayslipList = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(API_ENDPOINTS.getPayslips, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayslips(data);
    } catch (err) {
      console.error("Error fetching payslips:", err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique months and years for filters
  const { months, years } = useMemo(() => {
    const monthSet = new Set();
    const yearSet = new Set();
    
    payslips.forEach(payslip => {
      if (payslip.month) {
        // Extract year from month string (assuming format like "January 2023")
        const year = payslip.month.split(" ")[1];
        if (year) yearSet.add(year);
        monthSet.add(payslip.month);
      }
    });
    
    return {
      months: Array.from(monthSet).sort((a, b) => {
        // Sort by date, most recent first
        return new Date(b) - new Date(a);
      }),
      years: Array.from(yearSet).sort((a, b) => b - a) // Sort years descending
    };
  }, [payslips]);

  // Filter and search payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter(payslip => {
      // Search filter
      const matchesSearch = 
        payslip.employeeDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payslip.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Month filter
      const matchesMonth = monthFilter === "all" || payslip.month === monthFilter;
      
      // Year filter (extract year from month string)
      const payslipYear = payslip.month?.split(" ")[1];
      const matchesYear = yearFilter === "all" || payslipYear === yearFilter;
      
      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [payslips, searchTerm, monthFilter, yearFilter]);

  // Group payslips by month
  const payslipsByMonth = useMemo(() => {
    const grouped = {};
    
    filteredPayslips.forEach(payslip => {
      if (!payslip.month) return;
      
      if (!grouped[payslip.month]) {
        grouped[payslip.month] = [];
      }
      
      grouped[payslip.month].push(payslip);
    });
    
    return grouped;
  }, [filteredPayslips]);

  const generatePDF = (payslip) => {
    // PDF generation code remains the same as in your original implementation
    const {
      employeeDetails,
      incomes,
      deductions,
      totalIncome,
      totalDeductions,
      netPay,
      month,
    } = payslip;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Colors
    const primaryColor = [0, 102, 204];
    const secondaryColor = [60, 60, 60];
    const accentColor = [230, 240, 255];

    // Company Header
    doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...primaryColor);
    doc.text("Urbancode Edutech Solutions Pvt Ltd", pageWidth / 2, 15, { align: "center" });

    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...secondaryColor);
    doc.text("No 9/29, 5th street, Kamakoti nagar, Pallikaranai, Chennai - 600100", pageWidth / 2, 20, { align: "center" });

    // Payslip Title
    doc.setFontSize(12).setTextColor(...primaryColor);
    doc.text("PAYSLIP", pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(10).setTextColor(...secondaryColor);
    doc.text(`For the month of ${month}`, pageWidth / 2, 35, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 35, { align: "right" });

    doc.setDrawColor(...primaryColor).setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);

    // Employee Info
    const columnWidth = (pageWidth - 2 * margin) / 2 - 5;
    const startY = 45;

    doc.setFontSize(10).setTextColor(...primaryColor);
    doc.text("EMPLOYEE INFORMATION", margin, startY);

    doc.autoTable({
      startY: startY + 2,
      tableWidth: columnWidth,
      body: [
        ["Employee Name", employeeDetails?.name],
        ["Bank Name", employeeDetails?.bankAccountName],
        ["Account Number", employeeDetails?.bankAccountNumber],
        ["Total STD Days", employeeDetails?.totalDays || "N/A"],
        ["Leaves Taken", employeeDetails?.absentDays || "0"],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2, minCellHeight: 12 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: accentColor, cellWidth: columnWidth * 0.4 },
        1: { cellWidth: columnWidth * 0.6 },
      },
      margin: { left: margin },
    });
    const leftTableY = doc.lastAutoTable.finalY;

    doc.autoTable({
      startY: startY + 2,
      tableWidth: columnWidth,
      body: [
        ["Employee ID", payslip.employeeId],
        ["Designation", employeeDetails?.designation],
        ["Location", "Chennai"],
        ["Department", employeeDetails?.department],
        ["Date of Joining", employeeDetails?.dateOfJoining
        ? dayjs(employeeDetails.dateOfJoining).format("DD-MMM-YYYY") 
        : "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2, minCellHeight: 12 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: accentColor, cellWidth: columnWidth * 0.4 },
        1: { cellWidth: columnWidth * 0.6 },
      },
      margin: { left: margin + columnWidth + 10 },
    });
    const rightTableY = doc.lastAutoTable.finalY;

    let earningsStartY = Math.max(leftTableY, rightTableY) + 10;

    // Earnings
    doc.setTextColor(...primaryColor);
    doc.text("EARNINGS", margin, earningsStartY);
    doc.autoTable({
      startY: earningsStartY + 5,
      head: [["Description", "Amount (Rs)"]],
      body: [
        ...Object.entries(incomes || {}).map(([label, amount]) => [label, amount.toFixed(2)]),
        ["Total Earnings", totalIncome.toFixed(2)],
      ],
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: margin, right: margin },
    });
    const earningsTableY = doc.lastAutoTable.finalY;

    // Deductions
    doc.setTextColor(...primaryColor);
    doc.text("DEDUCTIONS", margin, earningsTableY + 10);
    doc.autoTable({
      startY: earningsTableY + 15,
      head: [["Description", "Amount (Rs)"]],
      body: [
        ...Object.entries(deductions || {}).map(([label, amount]) => [label, amount.toFixed(2)]),
        ["Total Deductions", totalDeductions.toFixed(2)],
      ],
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: margin, right: margin },
    });
    const deductionsTableY = doc.lastAutoTable.finalY;

    // Net Pay
    doc.setFontSize(12).setFont("helvetica", "bold");
    doc.text("NET PAYABLE:", pageWidth - margin - 90, deductionsTableY + 15);
    doc.text(`Rs. ${netPay.toFixed(2)}`, pageWidth - margin - 20, deductionsTableY + 15, { align: "right" });

    // Footer
    doc.setFontSize(8).setTextColor(...secondaryColor).setFont("helvetica", "normal");
    doc.text("This is a computer generated payslip and does not require signature.", pageWidth / 2, 285, { align: "center" });
    doc.text("For any discrepancies, please contact Management within 7 days.", pageWidth / 2, 290, { align: "center" });

    const fileName = `Payslip_${employeeDetails?.name?.replace(/\s+/g, "_")}_${month?.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <Loader/>
      // <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      //   <CircularProgress />
      // </Box>
    );
  }

  return (
    <div className="p-4">
      {/* Header with title and filters */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h4" fontWeight="bold" color="#16192aff">
          <span className="text-gray-600">Employee Payslips</span>
        </Typography>
      </Box>

      {/* Filter and Search Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              variant="outlined"
              label="Filter by Month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonth />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Months</MenuItem>
              {months.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              variant="outlined"
              label="Filter by Year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Years</MenuItem>
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Chip 
              label={`${filteredPayslips.length} payslips`} 
              color="primary" 
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Payslips List */}
      {Object.keys(payslipsByMonth).length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No payslips found
          </Typography>
        </Box>
      ) : (
        Object.entries(payslipsByMonth).map(([month, monthPayslips]) => (
          <Box key={month} mb={4}>
            {/* Month Heading */}
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                mb: 2, 
                p: 1, 
                backgroundColor: '#616161', 
                color: 'white', 
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <CalendarMonth sx={{ mr: 1 }} />
              {month}
            </Typography>
            
            <Grid container spacing={3}>
              {monthPayslips.map((payslip) => (
                <Grid item xs={12} md={6} key={payslip._id}>
                  <Card className="shadow-lg rounded-xl p-4 h-full">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography variant="h6" component="h3" color="textSecondary" fontWeight="bold">
                            {payslip.employeeDetails?.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            ID: {payslip.employeeId}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Dept: {payslip.employeeDetails?.department}
                          </Typography>
                        </Box>
                        <Chip 
                          label={`₹${payslip.netPay?.toFixed(2)}`} 
                          color="success" 
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                      
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          color=""
                          startIcon={<Download />}
                          onClick={() => generatePDF(payslip)}
                          fullWidth
                          sx={{ borderRadius: 2 }}
                        >
                          Download Payslip
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </div>
  );
};

export default PayslipList;