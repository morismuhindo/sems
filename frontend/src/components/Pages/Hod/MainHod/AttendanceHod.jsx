import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  User,
  Calendar,
  Clock,
  TrendingUp,
  PieChart,
  Keyboard,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Coffee,
  BarChart3,
  Search,
  Filter,
  Users,
  FileText,
  Building,
  Shield,
  Home
} from 'lucide-react';
import './AttendanceHod.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AttendanceHod = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [hodData, setHodData] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [todaySummary, setTodaySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  useEffect(() => {
    const checkAuthorization = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (!parsedUser.role || parsedUser.role.toLowerCase() !== 'hod') {
          navigate('/unauthorized');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        navigate('/login');
      }
    };

    checkAuthorization();
  }, [navigate]);

  useEffect(() => {
    if (authorized && user) {
      fetchHodData();
      fetchDepartmentAttendance();
      fetchDepartmentTodaySummary();
    }
  }, [authorized, user]);

  useEffect(() => {
    filterData();
  }, [attendanceData, dateFilter, statusFilter, searchTerm, employeeFilter, customStartDate, customEndDate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchHodData = async () => {
    try {
      const response = await axios.get(
        '/api/me',
        getAuthHeaders()
      );

      if (response.data && response.data.success) {
        const userData = response.data.data;
        setHodData(userData);
        
        if (userData.employee?.department) {
          const deptData = {
            name: typeof userData.employee.department === 'object' 
              ? userData.employee.department.name 
              : 'Unknown',
            code: typeof userData.employee.department === 'object' 
              ? userData.employee.department.code 
              : 'N/A',
            id: typeof userData.employee.department === 'object' 
              ? userData.employee.department._id 
              : userData.employee.department
          };
          
          setDepartmentData(deptData);
        } else {
          setError('Your account is not assigned to any department. Please contact HR.');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const fetchDepartmentAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        '/api/attend/department',
        getAuthHeaders()
      );

      if (response.data.success) {
        const data = response.data.data;
        setAttendanceData(data.attendance || []);
        setDepartmentData(data.department);
        setDepartmentEmployees(data.employees || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Error loading department attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentTodaySummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await axios.get(
        '/api/attend/department/today',
        getAuthHeaders()
      );

      if (response.data.success) {
        setTodaySummary(response.data.data);
      }
    } catch (err) {
    } finally {
      setSummaryLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...attendanceData];

    const now = new Date();
    switch (dateFilter) {
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(record => 
          new Date(record.date).toISOString().split('T')[0] === today
        );
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(record => 
          new Date(record.date) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(record => 
          new Date(record.date) >= monthAgo
        );
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(customStartDate) && 
                   recordDate <= new Date(customEndDate);
          });
        }
        break;
      default:
        break;
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(record => {
        const employeeId = record.employee?._id || record.employee;
        return employeeId === employeeFilter;
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const employee = record.employee || {};
        const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.toLowerCase();
        const employeeCode = (employee.employeeCode || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               employeeCode.includes(searchLower);
      });
    }

    setFilteredData(filtered);
  };

  const calculateHoursWorked = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return { hours: 0, minutes: 0, totalHours: 0 };
    
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { hours: 0, minutes: 0, totalHours: 0 };
      }
      
      const diffMs = end - start;
      
      if (diffMs < 0) {
        return { hours: 0, minutes: 0, totalHours: 0 };
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHours = hours + (minutes / 60);
      
      return { hours, minutes, totalHours };
    } catch (error) {
      return { hours: 0, minutes: 0, totalHours: 0 };
    }
  };

  const calculateTotalHoursWorked = () => {
    let totalHours = 0;
    let completedRecords = 0;
    
    filteredData.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const { totalHours: recordHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        totalHours += recordHours;
        completedRecords++;
      }
    });
    
    return {
      total: parseFloat(totalHours.toFixed(2)),
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours % 1) * 60),
      average: completedRecords > 0 ? parseFloat((totalHours / completedRecords).toFixed(2)) : 0
    };
  };

  const calculateOvertime = () => {
    let overtime = 0;
    
    filteredData.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        if (totalHours > 8) {
          overtime += totalHours - 8;
        }
      }
    });
    
    return parseFloat(overtime.toFixed(2));
  };

  const getStats = () => {
    const stats = {
      total: filteredData.length,
      present: 0,
      late: 0,
      absent: 0,
      on_leave: 0,
      today: 0,
      totalHours: 0,
      avgHours: 0,
      autoAbsent: 0,
      pendingClockOut: 0,
      overtime: 0,
      attendanceRate: 0
    };

    const today = new Date().toISOString().split('T')[0];
    let totalHoursAll = 0;
    let completedRecords = 0;
    
    filteredData.forEach(record => {
      if (record.status) {
        if (stats[record.status] !== undefined) {
          stats[record.status]++;
        }
      }
      
      if (record.status === 'absent' && record.autoMarked) {
        stats.autoAbsent++;
      }
      
      if (new Date(record.date).toISOString().split('T')[0] === today) {
        stats.today++;
      }
      
      if (record.clockIn && !record.clockOut) {
        stats.pendingClockOut++;
      }
      
      if (record.clockIn && record.clockOut) {
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        totalHoursAll += totalHours;
        completedRecords++;
      }
    });

    stats.totalHours = parseFloat(totalHoursAll.toFixed(2));
    stats.avgHours = completedRecords > 0 ? parseFloat((totalHoursAll / completedRecords).toFixed(2)) : 0;
    stats.overtime = calculateOvertime();
    
    const totalWorkDays = stats.present + stats.late + stats.absent;
    stats.attendanceRate = totalWorkDays > 0 ? 
      parseFloat(((stats.present + stats.late) / totalWorkDays * 100).toFixed(1)) : 0;

    return stats;
  };

  const getChartData = () => {
    const stats = getStats();
    
    const statusChart = {
      labels: ['Present', 'Late', 'Absent', 'On Leave'],
      datasets: [{
        data: [stats.present, stats.late, stats.absent, stats.on_leave],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
        borderWidth: 1
      }]
    };

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyCounts = {};
    last7Days.forEach(date => {
      dailyCounts[date] = 0;
    });

    filteredData.forEach(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      if (dailyCounts[recordDate] !== undefined) {
        dailyCounts[recordDate]++;
      }
    });

    const dateLabels = last7Days.map(date => {
      const d = new Date(date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const dailyChart = {
      labels: dateLabels,
      datasets: [{
        label: 'Attendance Count',
        data: last7Days.map(date => dailyCounts[date] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };

    const employeeHours = {};
    filteredData.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const employeeName = `${record.employee?.firstname || ''} ${record.employee?.lastname || ''}`;
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        
        if (!employeeHours[employeeName]) {
          employeeHours[employeeName] = 0;
        }
        employeeHours[employeeName] += totalHours;
      }
    });

    const sortedEmployees = Object.entries(employeeHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const hoursChart = {
      labels: sortedEmployees.map(([name]) => name),
      datasets: [{
        label: 'Hours Worked',
        data: sortedEmployees.map(([, hours]) => parseFloat(hours.toFixed(1))),
        backgroundColor: [
          '#8b5cf6',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 1
      }]
    };

    return { statusChart, dailyChart, hoursChart };
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'status-badge-presentHH';
      case 'late': return 'status-badge-lateHH';
      case 'absent': return 'status-badge-absentHH';
      case 'on_leave': return 'status-badge-leaveHH';
      case 'system-auto': return 'status-badge-systemHH';
      default: return 'status-badge-pendingHH';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return <CheckCircle size={16} />;
      case 'late': return <AlertCircle size={16} />;
      case 'absent': return <XCircle size={16} />;
      case 'on_leave': return <Coffee size={16} />;
      case 'system-auto': return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee Code', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Status', 'Auto Marked', 'Overtime'];
    const csvData = filteredData.map(record => {
      const { hours, minutes, totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
      const hoursWorked = `${hours}h ${minutes}m`;
      const overtime = totalHours > 8 ? `${(totalHours - 8).toFixed(1)}h` : '0h';
      
      return [
        `${record.employee?.firstname || ''} ${record.employee?.lastname || ''}`,
        record.employee?.employeeCode || '',
        new Date(record.date).toLocaleDateString(),
        record.clockIn ? formatTime(record.clockIn) : '',
        record.clockOut ? formatTime(record.clockOut) : '',
        hoursWorked,
        record.status || '',
        record.autoMarked ? 'Yes' : 'No',
        overtime
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `department-attendance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchDepartmentAttendance();
      await fetchDepartmentTodaySummary();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const getHodName = () => {
    if (hodData?.employee) {
      return `${hodData.employee.firstname} ${hodData.employee.lastname}`;
    }
    if (hodData?.firstname) {
      return `${hodData.firstname} ${hodData.lastname || ''}`;
    }
    return 'HOD User';
  };

  if (!authorized) {
    return (
      <div className="dashboard-loadingHH">
        <div className="spinnerHH"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (loading && !attendanceData.length) {
    return (
      <div className="dashboard-loadingHH">
        <div className="spinnerHH"></div>
        <p>Loading HOD Dashboard...</p>
      </div>
    );
  }

  const stats = getStats();
  const totalHours = calculateTotalHoursWorked();
  const { statusChart, dailyChart, hoursChart } = getChartData();

  return (
    <div className="attendance-dashboardHH">
      <div className="hod-headerHH">
        <div className="hod-header-contentHH">
          <div className="hod-infoHH">
              <div className="hod-detailsHH">
              <div className="hod-detailHH">
                <User size={16} />
                <span><strong>HOD:</strong> {getHodName()}</span>
              </div>
              <div className="hod-detailHH">
                <Building size={16} />
                <span>
                  <strong>Department:</strong> {departmentData?.name || 'N/A'}
                  {departmentData?.code && ` (${departmentData.code})`}
                </span>
              </div>
              <div className="hod-detailHH">
                <Calendar size={16} />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="department-statsHH">
            <div className="department-statHH">
              <Users size={20} />
              <div>
                <div className="stat-valueHH">{departmentEmployees.length}</div>
                <div className="stat-labelHH">Employees</div>
              </div>
            </div>
            <div className="department-statHH">
              <FileText size={20} />
              <div>
                <div className="stat-valueHH">{attendanceData.length}</div>
                <div className="stat-labelHH">Records</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {todaySummary && (
        <div className="today-summary-bannerHH hod-summaryHH">
          <div className="summary-contentHH">
            <div className="summary-iconHH">
              <Calendar size={24} />
            </div>
            <div className="summary-detailsHH">
              <h3>Today's Department Summary - {departmentData?.name}</h3>
              <div className="summary-statsHH">
                <span className="summary-statHH presentHH">
                  <CheckCircle size={14} />
                  Present: {todaySummary.summary?.present || 0}
                </span>
                <span className="summary-statHH lateHH">
                  <AlertCircle size={14} />
                  Late: {todaySummary.summary?.late || 0}
                </span>
                <span className="summary-statHH absentHH">
                  <XCircle size={14} />
                  Absent: {todaySummary.summary?.absent || 0}
                </span>
                <span className="summary-statHH leaveHH">
                  <Coffee size={14} />
                  On Leave: {todaySummary.summary?.on_leave || 0}
                </span>
                <span className="summary-statHH pendingHH">
                  <Clock size={14} />
                  Pending Clockout: {todaySummary.summary?.pendingClockOut || 0}
                </span>
              </div>
              <div className="summary-footerHH">
                <span className="attendance-rateHH">
                  Attendance Rate: {todaySummary.summary?.attendanceRate || 0}%
                </span>
                <span className="leave-rateHH">
                  Leave Rate: {todaySummary.summary?.leaveRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-controlsHH">
        <div className="filters-sectionHH">
          <div className="filter-groupHH">
            <label>
              <Calendar size={16} />
              Time Period:
            </label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-selectHH"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="custom-date-rangeHH">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-inputHH"
                placeholder="Start Date"
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-inputHH"
                placeholder="End Date"
              />
            </div>
          )}

          <div className="filter-groupHH">
            <label>
              <Filter size={16} />
              Status:
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-selectHH"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div className="filter-groupHH">
            <label>
              <User size={16} />
              Employee:
            </label>
            <select 
              value={employeeFilter} 
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="filter-selectHH"
            >
              <option value="all">All Employees</option>
              {departmentEmployees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstname} {emp.lastname} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupHH">
            <label>
              <Search size={16} />
              Search:
            </label>
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-inputHH"
            />
          </div>
        </div>

        <div className="action-buttonsHH">
          <button onClick={handleRefresh} className="btn-refreshHH" disabled={loading}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={exportToCSV} className="btn-exportHH" disabled={filteredData.length === 0}>
            <Download size={18} />
            Export CSV
          </button>
          <div className="record-countHH">
            <FileText size={16} />
            Showing {filteredData.length} of {attendanceData.length} records
          </div>
        </div>
      </div>

      {error && (
        <div className="dashboard-errorHH">
          <div className="error-contentHH">
            <span className="error-iconHH"><XCircle size={20} /></span>
            <p>{error}</p>
            <button onClick={() => setError('')} className="close-errorHH">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="statistics-cardsHH">
        <div className="stat-cardHH totalHH hod-statHH">
          <div className="stat-iconHH">
            <Users size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Department Records</h3>
            <p className="stat-valueHH">{stats.total}</p>
            <p className="stat-subtextHH">{departmentEmployees.length} employees</p>
          </div>
        </div>
        
        <div className="stat-cardHH presentHH hod-statHH">
          <div className="stat-iconHH">
            <CheckCircle size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Present</h3>
            <p className="stat-valueHH">{stats.present}</p>
            {stats.total > 0 && (
              <p className="stat-percentageHH">
                {((stats.present / stats.total) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        
        <div className="stat-cardHH lateHH hod-statHH">
          <div className="stat-iconHH">
            <AlertCircle size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Late</h3>
            <p className="stat-valueHH">{stats.late}</p>
            {stats.total > 0 && (
              <p className="stat-percentageHH">
                {((stats.late / stats.total) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        
        <div className="stat-cardHH hoursHH hod-statHH">
          <div className="stat-iconHH">
            <Clock size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Total Hours</h3>
            <p className="stat-valueHH">{totalHours.hours}h {totalHours.minutes}m</p>
            <p className="stat-subtextHH">
              Avg: {totalHours.average.toFixed(1)}h per record
            </p>
          </div>
        </div>
        
        <div className="stat-cardHH absentHH hod-statHH">
          <div className="stat-iconHH">
            <XCircle size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Absent</h3>
            <p className="stat-valueHH">{stats.absent}</p>
            <p className="stat-subtextHH">
              {stats.autoAbsent} auto-marked
            </p>
          </div>
        </div>
        
        <div className="stat-cardHH overtimeHH hod-statHH">
          <div className="stat-iconHH">
            <TrendingUp size={24} />
          </div>
          <div className="stat-contentHH">
            <h3>Overtime</h3>
            <p className="stat-valueHH">
              {Math.floor(stats.overtime)}h {Math.round((stats.overtime % 1) * 60)}m
            </p>
            <p className="stat-subtextHH">
              Extra hours worked
            </p>
          </div>
        </div>
      </div>

      <div className="charts-sectionHH">
        <div className="chart-containerHH">
          <div className="chart-headerHH">
            <TrendingUp size={20} />
            <h3>Weekly Attendance Trend</h3>
          </div>
          {filteredData.length > 0 ? (
            <Line 
              data={dailyChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Attendance Count'
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="chart-placeholderHH">
              <Calendar size={32} />
              <p>No attendance data for the selected period</p>
            </div>
          )}
        </div>
        
        <div className="chart-containerHH">
          <div className="chart-headerHH">
            <PieChart size={20} />
            <h3>Status Distribution</h3>
          </div>
          {stats.total > 0 ? (
            <Pie 
              data={statusChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }}
            />
          ) : (
            <div className="chart-placeholderHH">
              <PieChart size={32} />
              <p>No status data available</p>
            </div>
          )}
        </div>
        
        <div className="chart-containerHH">
          <div className="chart-headerHH">
            <BarChart3 size={20} />
            <h3>Top Performers (Hours)</h3>
          </div>
          {filteredData.length > 0 && hoursChart.datasets[0].data.length > 0 ? (
            <Bar 
              data={hoursChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours'
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="chart-placeholderHH">
              <BarChart3 size={32} />
              <p>Insufficient hours data</p>
            </div>
          )}
        </div>
      </div>

      <div className="records-sectionHH">
        <div className="section-headerHH">
          <div className="section-titleHH">
            <FileText size={24} />
            <h2>Department Attendance Records</h2>
            {departmentData?.name && (
              <span className="badge-departmentHH">{departmentData.name}</span>
            )}
          </div>
          <div className="hours-summaryHH">
            <Clock size={16} />
            <span>Total Hours: <strong>{totalHours.hours}h {totalHours.minutes}m</strong></span>
            <span className="dividerHH">|</span>
            <span>Records: <strong>{filteredData.length}</strong></span>
            <span className="dividerHH">|</span>
            <span>Overtime: <strong>{Math.floor(stats.overtime)}h {Math.round((stats.overtime % 1) * 60)}m</strong></span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-recordsHH">
            <div className="spinnerHH smallHH"></div>
            <p>Loading department records...</p>
          </div>
        ) : (
          <div className="records-table-containerHH">
            {filteredData.length > 0 ? (
              <table className="records-tableHH">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Auto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => {
                    const { hours, minutes, totalHours: recordHours } = calculateHoursWorked(record.clockIn, record.clockOut);
                    const hoursWorked = `${hours}h ${minutes}m`;
                    const overtime = recordHours > 8 ? `${(recordHours - 8).toFixed(1)}h` : '0h';
                    
                    return (
                      <tr key={record._id} className={record.clockIn && !record.clockOut ? 'row-pendingHH' : ''}>
                        <td>
                          <div className="employee-infoHH">
                            <div className="employee-nameHH">
                              <User size={14} />
                              {record.employee?.firstname} {record.employee?.lastname}
                            </div>
                            <div className="employee-detailsHH">
                              {record.employee?.employeeCode} • {record.employee?.position || 'Employee'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="date-cellHH">
                            <Calendar size={14} />
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="time-cellHH">
                            <Clock size={14} />
                            {record.clockIn ? formatTime(record.clockIn) : '--:--'}
                          </div>
                        </td>
                        <td>
                          <div className="time-cellHH">
                            <Clock size={14} />
                            {record.clockOut ? formatTime(record.clockOut) : '--:--'}
                          </div>
                        </td>
                        <td>
                          <div className={`hours-cellHH ${recordHours >= 8 ? 'hours-goodHH' : recordHours >= 4 ? 'hours-fairHH' : 'hours-lowHH'}`}>
                            <Clock size={14} />
                            {record.clockIn && record.clockOut ? hoursWorked : '--:--'}
                          </div>
                        </td>
                        <td>
                          <div className={`overtime-cellHH ${recordHours > 8 ? 'overtime-yesHH' : 'overtime-noHH'}`}>
                            <TrendingUp size={14} />
                            {overtime}
                          </div>
                        </td>
                        <td>
                          <div className={`status-badgeHH ${getStatusBadgeClass(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {record.status?.toUpperCase() || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="auto-badgeHH">
                            {record.autoMarked ? (
                              <span className="auto-yesHH">
                                <CheckCircle size={12} />
                                Auto
                              </span>
                            ) : (
                              <span className="auto-noHH">Manual</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-recordsHH">
                <Users size={48} />
                <h3>No Attendance Records Found</h3>
                <p>No attendance records match your current filters in the {departmentData?.name || 'your'} department.</p>
                <button 
                  onClick={() => {
                    setDateFilter('all');
                    setStatusFilter('all');
                    setEmployeeFilter('all');
                    setSearchTerm('');
                  }} 
                  className="btn-clear-filtersHH"
                >
                  <Filter size={16} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHod;