// src/components/admin-dashboard/payroll/SalaryDetails.jsx

import React from 'react';

const SalaryDetails = ({ employee, onSalaryChange }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-2">{employee.name}</td>
      <td className="px-4 py-2">{employee.company}</td>
      <td className="px-4 py-2">{employee.position}</td>
      <td className="px-4 py-2">
        <input
          type="number"
          className="border px-2 py-1 rounded w-32"
          value={employee.salary || ''}
          onChange={(e) => onSalaryChange(employee._id, e.target.value)}
          placeholder="Enter salary"
        />
      </td>
    </tr>
  );
};

export default SalaryDetails;
