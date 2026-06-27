import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import PayslipDownloader from "./PayslipDownloader";
import PayslipTemplate from "./PayslipTemplate";
import { buildPayslipViewModel } from "../../../utils/payslipViewModel";

const theme = createTheme({
  typography: {
    fontFamily: "Montserrat, sans-serif",
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

  const viewModel = buildPayslipViewModel(
    employeeDetails,
    incomes,
    deductions,
    totalIncome,
    totalDeductions,
    netPay
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Box sx={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: 1, p: 2, mb: 3 }}>
          <PayslipTemplate data={viewModel} />
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={2}>
          Before generating the payslip, ensure all details are present and correct.
        </Typography>

        <Box display="flex" justifyContent="space-between">
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
      </Container>
    </ThemeProvider>
  );
};

export default PayslipPreview;