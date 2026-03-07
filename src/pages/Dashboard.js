import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../utils/api';
import urbancodeLogo from '../assets/uclogo.png';
import jobzenterLogo from '../assets/jzlogo.png';
import {FiMail, FiPhone, FiChevronLeft } from 'react-icons/fi';
import {
  FiUserPlus,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiUser,
  FiSearch,
  FiDownload,
  FiHome,
  FiUsers,
  FiCheckSquare,
  FiImage,
  FiMenu,
  FiChevronRight,
  FiX
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, employeesRes] = await Promise.all([
          axios.get(API_ENDPOINTS.getAttendanceAll, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(API_ENDPOINTS.getUsers, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        
        setAttendanceData(attendanceRes.data);
        setFilteredData(attendanceRes.data);
        setEmployees(employeesRes.data);
      } catch (error) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const groupAttendanceByUserAndDate = (data) => {
    const grouped = {};
    
    data.forEach(record => {
      const date = new Date(record.timestamp).toDateString();
      const key = `${record.user?._id || 'unknown'}-${date}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          user: record.user,
          date: date,
          checkIn: null,
          checkOut: null,
          records: []
        };
      }
      
      grouped[key].records.push(record);
      
      if (record.type === 'check-in') {
        grouped[key].checkIn = record;
      } else if (record.type === 'check-out') {
        grouped[key].checkOut = record;
      }
    });
    
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  useEffect(() => {
    let result = attendanceData;

    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      result = result.filter(record => new Date(record.timestamp).toDateString() === filterDate);
    }

    if (typeFilter !== 'all') {
      result = result.filter(record => record.type === typeFilter);
    }

    if (officeFilter !== 'all') {
      const inOffice = officeFilter === 'yes';
      result = result.filter(record => record.isInOffice === inOffice);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(record =>
        record.user?.name?.toLowerCase().includes(query) ||
        record.user?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredData(result);
  }, [attendanceData, dateFilter, typeFilter, officeFilter, searchQuery]);

  const getCurrentDayData = () => {
    const today = new Date().toDateString();
    return attendanceData.filter(record => 
      new Date(record.timestamp).toDateString() === today
    );
  };

  const currentDayData = getCurrentDayData();
  const currentDayEmployees = [...new Set(currentDayData.map(item => item.user?._id))].filter(id => id).length;
  const currentDayCheckIns = currentDayData.filter(item => item.type === 'check-in').length;
  const currentDayCheckOuts = currentDayData.filter(item => item.type === 'check-out').length;
  const currentDayRemote = currentDayData.filter(item => !item.isInOffice).length;

  const handleAddEmployee = () => navigate('/register');

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(record => ({
      Name: record.user?.name || 'Unknown',
      Email: record.user?.email || 'N/A',
      Type: record.type,
      Date: new Date(record.timestamp).toLocaleDateString(),
      Time: new Date(record.timestamp).toLocaleTimeString(),
      // Location: record.location || 'N/A',
      'In Office': record.isInOffice ? 'Yes' : 'No',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'attendance_report.xlsx');
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById('attendance-table');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('attendance_report.pdf');
    });
  };

  const getEmployeeAttendance = (employeeId) => {
    return attendanceData.filter(record => record.user?._id === employeeId);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee({
      ...employee,
      attendance: getEmployeeAttendance(employee._id)
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 text-red-600 rounded-lg shadow">
      {error}
    </div>
  );

  const groupedData = groupAttendanceByUserAndDate(filteredData);
  const employeeGroupedData = selectedEmployee ? groupAttendanceByUserAndDate(selectedEmployee.attendance) : [];

  return (
    <div className="flex h-screen bg-gray-50">
    {/* Sidebar */}



      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={() => setSelectedImage(null)}>
            <div className="relative bg-white rounded-lg max-w-4xl max-h-screen overflow-auto">
              <button 
                className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
              >
                <FiX size={24} />
              </button>
              <div className="p-4">
                <img 
                  src={`${API_ENDPOINTS.uploadPath}/${selectedImage}`} 
                  alt="Full size attendance" 
                  className="max-w-full max-h-[80vh] object-contain"
                />
                <div className="mt-2 text-center text-sm text-gray-500">
                  Click anywhere to close
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEmployee ? (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-6 bg-white p-4 rounded-xl shadow-sm border">
  
  {/* Left Section: Name & Position */}
  <div>
    <h2 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h2>
    <p className="text-sm text-gray-500">{selectedEmployee.position}</p>
  </div>

  {/* Center: Company Logo */}
  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
    {selectedEmployee.company === 'Urbancode' ? (
      <img src={urbancodeLogo} alt="Urbancode" className="h-10 w-10 object-contain" />
    ) : selectedEmployee.company === 'Jobzenter' ? (
      <img src={jobzenterLogo} alt="Jobzenter" className="h-10 w-10 object-contain" />
    ) : (
      <FiUser className="text-gray-400 w-6 h-6" />
    )}
  </div>

  {/* Right Section: Contact Info */}
  <div className="text-right">
    <p className="text-sm text-gray-500 flex items-center justify-end">
      <FiMail className="mr-1" /> {selectedEmployee.email}
    </p>
    <p className="text-sm text-gray-500 flex items-center justify-end">
      <FiPhone className="mr-1" /> {selectedEmployee.phone}
    </p>
  </div>

  {/* Bottom or Side: Back Button */}
  <div className="sm:absolute sm:top-4 sm:right-4">
    <button 
      onClick={() => setSelectedEmployee(null)}
      className="inline-flex items-center text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
    >
      <FiChevronLeft className="mr-1" /> Back to all
    </button>
  </div>
</div>


            

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Check-ins</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedEmployee.attendance.filter(a => a.type === 'check-in').length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Check-outs</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedEmployee.attendance.filter(a => a.type === 'check-out').length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Remote Work Days</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedEmployee.attendance.filter(a => !a.isInOffice).length}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-800 mb-4">Attendance History</h3>
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th> 
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeGroupedData.map((group) => (
                    <tr key={group.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                      
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-in</span>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                              {group.checkIn?.image ? (
                                <img
                                  src={`${API_ENDPOINTS.uploadPath}/${group.checkIn.image}`}
                                  alt="check-in"
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(group.checkIn.image);
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.parentElement.innerHTML = '<div class="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md"><FiImage class="text-gray-400" /></div>';
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
                                  <FiImage className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                         
                          {group.checkOut && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500 mb-1">Check-out</span>
                              <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                                {group.checkOut?.image ? (
                                  <img
                                    src={`${API_ENDPOINTS.uploadPath}/${group.checkOut.image}`}
                                    alt="check-out"
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImage(group.checkOut.image);
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.parentElement.innerHTML = '<div class="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md"><FiImage class="text-gray-400" /></div>';
                                    }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
                                    <FiImage className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td> 
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Check-in
                            </span>
                          )}
                          {group.checkOut && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Check-out
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(group.checkIn?.timestamp || group.checkOut?.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn && (
                            <span>{formatTime(group.checkIn.timestamp)}</span>
                          )}
                          {group.checkOut && (
                            <span>{formatTime(group.checkOut.timestamp)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {group.checkIn?.isInOffice ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            In Office
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            Remote
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn?.location && (
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" />
                              {group.checkIn.location}
                            </div>
                          )}
                          {group.checkOut?.location && group.checkOut.location !== group.checkIn?.location && (
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" />
                              {group.checkOut.location}
                            </div>
                          )}
                        </div>
                      </td>
                      
                    </tr>
                  ))} 
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Attendance Dashboard</h1>
                <p className="text-gray-600">{filteredData.length} records found</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDownloadExcel} 
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="mr-2" />
                  Excel
                </button>
                <button 
                  onClick={handleDownloadPDF} 
                  className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FiDownload className="mr-2" />
                  PDF
                </button>
                <button 
                  onClick={handleAddEmployee} 
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiUserPlus className="mr-2" />
                  Add Employee
                </button>
              </div>
            </div>

            {/* Summary Cards - Current Day Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                    <FiUsers size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Employees</h3>
                    <p className="text-2xl font-bold text-gray-800">{currentDayEmployees}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-50 text-green-600">
                    <FiCheckSquare size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Check-ins</h3>
                    <p className="text-2xl font-bold text-gray-800">{currentDayCheckIns}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                    <FiCheckCircle size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Check-outs</h3>
                    <p className="text-2xl font-bold text-gray-800">{currentDayCheckOuts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                    <FiHome size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-gray-500 text-sm font-medium">Today's Remote</h3>
                    <p className="text-2xl font-bold text-gray-800">{currentDayRemote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="text-gray-400" />
                </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="pl-10 w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="check-in">Check In</option>
                <option value="check-out">Check Out</option>
              </select>
              <select
                value={officeFilter}
                onChange={e => setOfficeFilter(e.target.value)}
                className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="yes">In Office</option>
                <option value="no">Remote</option>
              </select>
              <select
                 value={companyFilter}
                 onChange={e => setCompanyFilter(e.target.value)}
                 className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
                  <option value="all">All Companies</option>
                  <option value="Urbancode">Urbancode</option>
                  <option value="Jobzenter">Jobzenter</option>
              </select>

            </div>

            

            <div id="attendance-table" className="overflow-auto bg-white rounded-xl shadow-sm border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th> 
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in/out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedData.map((group) => (
                    <tr key={`${group.user?._id || 'unknown'}-${group.date}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">

                          
                          {/* Check-in Image */}
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">Check-in</span>
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                              {group.checkIn?.image ? (
                                <img
                                  src={`${API_ENDPOINTS.uploadPath}/${group.checkIn.image}`}
                                  alt="check-in"
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(group.checkIn.image);
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.parentElement.innerHTML = '<div class="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md"><FiImage class="text-gray-400" /></div>';
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
                                  <FiImage className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div> 
                          
                          {/* Check-out Image */}
                           {group.checkOut && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500 mb-1">Check-out</span>
                              <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                                {group.checkOut?.image ? (
                                  <img
                                    src={`${API_ENDPOINTS.uploadPath}/${group.checkOut.image}`}
                                    alt="check-out"
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImage(group.checkOut.image);
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.parentElement.innerHTML = '<div class="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md"><FiImage class="text-gray-400" /></div>';
                                    }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
                                    <FiImage className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )} 
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{group.user?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{group.user?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Check-in
                            </span>
                          )}
                          {group.checkOut && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Check-out
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(group.checkIn?.timestamp || group.checkOut?.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn && (
                            <span>{formatTime(group.checkIn.timestamp)}</span>
                          )}
                          {group.checkOut && (
                            <span>{formatTime(group.checkOut.timestamp)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {group.checkIn?.isInOffice ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            In Office
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            Remote
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-1">
                          {group.checkIn?.location && (
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" />
                              {group.checkIn.location}
                            </div>
                          )}
                          {group.checkOut?.location && group.checkOut.location !== group.checkIn?.location && (
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" />
                              {group.checkOut.location}
                            </div>
                          )}
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;