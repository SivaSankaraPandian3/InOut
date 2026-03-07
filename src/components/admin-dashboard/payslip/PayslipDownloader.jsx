import React from "react";
import { Button } from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from 'axios';
import { API_ENDPOINTS } from "../../../utils/api";

const PayslipDownloader = ({ employeeDetails, incomes, deductions, totalIncome, totalDeductions, netPay }) => {
  
  const handleDownload = async () => {
     try {
   const payload = {
 userId: employeeDetails?.userId, // MongoDB _id of user
        employeeId: employeeDetails?.employeeId || "", // Employee code

        employeeDetails: {
          name: employeeDetails?.name || "",
          designation: employeeDetails?.designation || "",
          department: employeeDetails?.department || "",
          company: employeeDetails?.company || "",
          bankAccountName: employeeDetails?.bankAccountName || "",
          bankAccountNumber: employeeDetails?.bankAccountNumber || "",
          dateOfJoining: employeeDetails?.dateOfJoining || null,
        },

        attendanceSummary: {
          totalDays: employeeDetails?.totalDays || 0,
          workingDays: employeeDetails?.workingDays || 0,
          presentDays: employeeDetails?.presentDays || 0,
          absentDays: employeeDetails?.absentDays || 0,
          leaveDays: employeeDetails?.leaveDays || 0,
          lateDays: employeeDetails?.lateDays || 0,
          halfDays: employeeDetails?.halfDays || 0,
        },

        incomes:
          incomes?.reduce(
            (acc, i) => ({ ...acc, [i.label]: i.amount }),
            {}
          ) || {},

        deductions:
          deductions?.reduce(
            (acc, d) => ({ ...acc, [d.label]: d.amount }),
            {}
          ) || {},

        totalIncome: totalIncome || 0,
        totalDeductions: totalDeductions || 0,
        netPay: netPay || 0,

        month: employeeDetails?.month || "",
        year: new Date().getFullYear(),
      };

      console.log("Final Payload:", payload);

      const token = localStorage.getItem("token");
      const { data } = await axios.post(API_ENDPOINTS.createPayslip, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Payslip saved:", data);

    // Generate PDF
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
    } catch (err) {
      console.error("Error saving or downloading payslip:", err);
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={handleDownload}>
      Generate Payslip
    </Button>
  );
};

export default PayslipDownloader;
