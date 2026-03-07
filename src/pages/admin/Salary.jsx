// components/PayslipList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {API_ENDPOINTS} from "../../utils/api"; // Adjust the import path as needed

const PayslipList = () => {
  const [payslips, setPayslips] = useState([]);
 const token = localStorage.getItem('token');
        
  // fetch all payslips
  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await axios.get(API_ENDPOINTS.getPayslips, {
          headers: { Authorization: `Bearer ${token}` }
        });  // 👈 use wrapper function
        setPayslips(data.data);
      } catch (err) {
        console.error("Error fetching payslips:", err);
      }
    };
    fetchPayslips();
  }, []);

  // re-download function
  const handleDownload = (payslip) => {
    const { employeeDetails, incomes, deductions, totalIncome, totalDeductions, netPay } = payslip;

   const doc = new jsPDF();
       const pageWidth = doc.internal.pageSize.getWidth();
       const margin = 15;
     
       // 🎨 New Blue Theme
       const primaryColor = [0, 102, 204]; // Strong Blue
       const secondaryColor = [60, 60, 60]; // Dark Gray
       const accentColor = [230, 240, 255]; // Very light blue for backgrounds
     
       // Set default font
       doc.setFont("helvetica");
     
       // Company Header
       doc.setFontSize(16);
       doc.setTextColor(...primaryColor);
       doc.setFont("helvetica", "bold");
       doc.text("Urbancode Edutech Solutions Pvt Ltd", pageWidth / 2, 15, { align: "center" });
     
       doc.setFontSize(9);
       doc.setTextColor(...secondaryColor);
       doc.setFont("helvetica", "normal");
       doc.text("No 9/29, 5th street, Kamakoti nagar, Pallikaranai, Chennai - 600100", pageWidth / 2, 20, { align: "center" });
     
       // Payslip Title
       doc.setFontSize(12);
       doc.setTextColor(...primaryColor);
       doc.text("PAYSLIP", pageWidth / 2, 30, { align: "center" });
     
       doc.setFontSize(10);
       doc.setTextColor(...secondaryColor);
       doc.text(`For the month of ${employeeDetails.month}`, pageWidth / 2, 35, { align: "center" });
       doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 35, { align: "right" });
     
       // Divider line
       doc.setDrawColor(...primaryColor);
       doc.setLineWidth(0.5);
       doc.line(margin, 40, pageWidth - margin, 40);
     
       // Employee Info and Attendance side by side
       const columnWidth = (pageWidth - 2 * margin) / 2 - 5;
       const startY = 45;
     
       // Employee Info Column 1
       doc.setFontSize(10);
       doc.setTextColor(...primaryColor);
       doc.text("EMPLOYEE INFORMATION", margin, startY);
     
       // Employee Info - Left Column ✅ Borders Added
     doc.autoTable({
       startY: startY + 2,
       tableWidth: columnWidth,
       body: [
         ["Employee Name", employeeDetails.name],
         ["Bank Name", employeeDetails.bankAccountName],
         ["Account Number", employeeDetails.bankAccountNumber],
         ["Total STD Days", employeeDetails.totalDays],
         ["Leaves taken", employeeDetails.absentDays || '0']
       ],
       theme: "grid",
       styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak',minCellHeight: 12 }, // ✅ wrap
       columnStyles: {
         0: { fontStyle: "bold", fillColor: accentColor, cellWidth: columnWidth * 0.4 }, // fixed % width
         1: { cellWidth: columnWidth * 0.6 } // remaining space
       },
       margin: { left: margin },
     });
     const leftTableY = doc.lastAutoTable.finalY;
     
     // Employee Info - Right Column ✅ Wrapped Text
     doc.autoTable({
       startY: startY + 2,
       tableWidth: columnWidth,
       body: [
         ["Employee ID", employeeDetails.employeeId],
         ["Designation", employeeDetails.designation],
         ["Location", "Chennai"],
         ["Department", employeeDetails.department],
         ["Date of Joining", employeeDetails.dateOfJoining || 'N/A'], 
       ],
       theme: "grid",
       styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak',minCellHeight: 12 }, // ✅ wrap
       columnStyles: {
         0: { fontStyle: "bold", fillColor: accentColor, cellWidth: columnWidth * 0.4 },
         1: { cellWidth: columnWidth * 0.6 }
       },
       margin: { left: margin + columnWidth + 10 },
     });
     const rightTableY = doc.lastAutoTable.finalY;
     
     // Determine where to start Earnings section
     let earningsStartY = Math.max(leftTableY, rightTableY) + 10;
     
     // Earnings Section
     doc.setTextColor(...primaryColor);
     doc.text("EARNINGS", margin, earningsStartY);
     
     doc.autoTable({
       startY: earningsStartY + 5,
       head: [["Description", "Amount (Rs)"]],
       body: [
         ...incomes.map(i => [i.label, i.amount.toFixed(2)]),
         ["Total Earnings", totalIncome.toFixed(2)]
       ],
       headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
       columnStyles: { 1: { halign: "right" } },
       margin: { left: margin, right: margin }
     });
     const earningsTableY = doc.lastAutoTable.finalY;
     
     // Deductions Section
     doc.setTextColor(...primaryColor);
     doc.text("DEDUCTIONS", margin, earningsTableY + 10);
     
     doc.autoTable({
       startY: earningsTableY + 15,
       head: [["Description", "Amount (Rs)"]],
       body: [
         ...deductions.map(d => [d.label, d.amount.toFixed(2)]),
         ["Total Deductions", totalDeductions.toFixed(2)]
       ],
       headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
       columnStyles: { 1: { halign: "right" } },
       margin: { left: margin, right: margin }
     });
     const deductionsTableY = doc.lastAutoTable.finalY;
     
     // Net Pay
     doc.setFontSize(12).setFont("helvetica", "bold");
     doc.text("NET PAYABLE:", pageWidth - margin - 90, deductionsTableY + 15);
     doc.text(`Rs. ${netPay.toFixed(2)}`, pageWidth - margin - 20, deductionsTableY + 15, { align: "right" });
     
     
       // Footer with improved styling
       doc.setFontSize(8);
       doc.setTextColor(...secondaryColor);
       doc.setFont("helvetica", "normal");
       doc.text("This is a computer generated payslip and does not require signature.", pageWidth / 2, 285, { align: "center" });
       doc.text("For any discrepancies, please contact Management within 7 days.", pageWidth / 2, 290, { align: "center" });
     
       // Save the PDF with a proper filename
       const fileName = `Payslip_${employeeDetails.name.replace(/\s+/g, '_')}_${employeeDetails.month.replace(/\s+/g, '_')}.pdf`;
       doc.save(fileName);
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><b>Employee</b></TableCell>
            <TableCell><b>Designation</b></TableCell>
            <TableCell><b>Month</b></TableCell>
            <TableCell><b>Net Pay</b></TableCell>
            <TableCell><b>Generated On</b></TableCell>
            <TableCell><b>Action</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payslips.map((payslip) => (
            <TableRow key={payslip._id}>
              <TableCell>{payslip.employeeDetails.name}</TableCell>
              <TableCell>{payslip.employeeDetails.designation}</TableCell>
              <TableCell>{payslip.employeeDetails.month}</TableCell>
              <TableCell>{payslip.netPay}</TableCell>
              <TableCell>{new Date(payslip.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="outlined" onClick={() => handleDownload(payslip)}>
                  Re-Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PayslipList;
