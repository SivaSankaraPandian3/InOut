import React from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import {Fragment} from 'react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from "../../../assets/logo.png";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import PayslipDownloader from "./PayslipDownloader";

const theme = createTheme({
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
});
const PayslipPreview = ({ payslipData, onBack }) => {
  const {
    employeeDetails,
    incomes,
    deductions,
    totalIncome,
    totalDeductions,
    netPay,
  } = payslipData;




  return (
    <ThemeProvider theme={theme}>
    <Container maxWidth="md" sx={{ my: 4 }}>
  <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
    {/* Company Header */}
    <Box textAlign="center" mb={3}>
      {/* <img src={logo} alt="Company Logo" style={{ height: 50, marginBottom: 8 }} /> */}
      <Typography variant="h6" fontWeight="bold" color="primary">
        {employeeDetails.company.toLowerCase() === "jobzenter" 
      ? "Jobzenter Placement Solutions" 
      : "Urbancode Edutech Solutions Pvt Ltd"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        No 9/29, 5th street, Kamakoti nagar, Pallikaranai, Chennai - 600100
      </Typography>
    </Box>

    {/* Payslip Header */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h5" fontWeight="bold" color="primary">
        PAYSLIP
      </Typography>
      <Typography variant="subtitle1">
        {employeeDetails.month} • {new Date().toLocaleDateString()}
      </Typography>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Employee Info & Attendance Side-by-Side */}
    <Grid container spacing={3} mb={3}>
      {/* Employee Information */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader 
            title="Employee Information"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold" }}
            sx={{ bgcolor: "#f8f9fa", p: 1.5 }}
          />
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={5}>
              {[
                { label: "Name", value: employeeDetails.name },
                { label: "Employee ID", value: employeeDetails.employeeId },
                { label: "Date of Joining", value: employeeDetails.dateOfJoining },
                { label: "Designation", value: employeeDetails.designation },
                { label: "Department", value: employeeDetails.department },
                // { label: "Payment Date", value: employeeDetails.paymentDate },
                { label: "Bank", value: employeeDetails.bankAccountName },
                { label: "Account No", value: employeeDetails.bankAccountNumber }
              ].map((item, index) => (
                <Fragment key={index}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body2" fontWeight="bold">
                      {item.value}
                    </Typography>
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Attendance Summary */}
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader 
            title="Attendance Summary"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold" }}
            sx={{ bgcolor: "#f8f9fa", p: 1.5 }}
          />
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={1.5}>
              {[
                { label: "Total Days", value: employeeDetails.totalDays },
                { label: "Working Days", value: employeeDetails.workingDays },
                { label: "Present Days", value: employeeDetails.presentDays },
                { label: "Leave Days", value: employeeDetails.leaveDays || 0 },
                { label: "Absent Days", value: employeeDetails.absentDays || 0 }
              ].map((item, index) => (
                <Fragment key={index}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="medium" textAlign="right">
                      {item.value}
                    </Typography>
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Earnings & Deductions Side-by-Side */}
    <Grid container spacing={3} mb={3}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader 
            title="Earnings"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", color: "primary" }}
            sx={{ bgcolor: "#f8f9fa", p: 1.5 }}
          />
          <CardContent sx={{ p: 2 }}>
            {incomes.map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ₹{Number(item.amount || 0).toFixed(2)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">Total Earnings</Typography>
              <Typography variant="body2" fontWeight="bold">₹{Number(totalIncome).toFixed(2)}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader 
            title="Deductions"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", color: "primary" }}
            sx={{ bgcolor: "#f8f9fa", p: 1.5 }}
          />
          <CardContent sx={{ p: 2 }}>
            {deductions.map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2">{item.label}</Typography>
                <Typography variant="body2" fontWeight="medium">
                  ₹{Number(item.amount || 0).toFixed(2)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">Total Deductions</Typography>
              <Typography variant="body2" fontWeight="bold">₹{Number(totalDeductions).toFixed(2)}</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Net Pay */}
    <Box 
      sx={{ 
        p: 2, 
        bgcolor: "#e8f5e9", 
        borderRadius: 1, 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center"
      }}
    >
      <Typography variant="h6" fontWeight="bold">
        NET PAYABLE
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        ₹{Number(netPay).toFixed(2)}
      </Typography>
    </Box>

    {/* Footer Note */}
    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
      Before generating the payslip, ensure all details are present and correct.
    </Typography>

    {/* Action Buttons */}
    <Box mt={4} display="flex" justifyContent="space-between">
      <Button variant="outlined" onClick={onBack}>
        Back to Edit
      </Button>
      
      <PayslipDownloader
  employeeDetails={employeeDetails}
  incomes={incomes}
  deductions={deductions}
  totalIncome={totalIncome}
  totalDeductions={totalDeductions}
  netPay={netPay}
/>

    </Box>
  </Paper>
</Container>
</ThemeProvider>
  );
};

export default PayslipPreview;