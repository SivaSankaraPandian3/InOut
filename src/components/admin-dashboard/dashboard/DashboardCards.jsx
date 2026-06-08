import React from 'react';

const DashboardCards = ({ data }) => {
  return (
    <div className="uc-grid-cards">
      <div className="uc-stat-card uc-stat-green">
        <p className="uc-stat-label">Total Employees</p>
        <h2 className="uc-stat-value">{data.totalEmployees}</h2>
      </div>

      <div className="uc-stat-card uc-stat-blue">
        <p className="uc-stat-label">Present Today</p>
        <h2 className="uc-stat-value">{data.presentToday}</h2>
      </div>

      <div className="uc-stat-card uc-stat-red">
        <p className="uc-stat-label">Absent Today</p>
        <h2 className="uc-stat-value">{data.absentToday}</h2>
      </div>
    </div>
  );
};

export default DashboardCards;
