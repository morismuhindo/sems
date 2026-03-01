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
  FileText
} from 'lucide-react';
import './AttendanceDashboard.css';

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

const AttendanceDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  const [todaySummary, setTodaySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
    status: ''
  });

  const [autoMarkModalOpen, setAutoMarkModalOpen] = useState(false);
  const [rangeMarkModalOpen, setRangeMarkModalOpen] = useState(false);
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [autoMarkLoading, setAutoMarkLoading] = useState(false);
  const [rangeMarkLoading, setRangeMarkLoading] = useState(false);
  const [markResult, setMarkResult] = useState(null);

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

        if (!parsedUser.role || parsedUser.role.toLowerCase() !== 'hr') {
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
    if (authorized) {
      fetchAllAttendance();
      fetchTodaySummary();
    }
  }, [authorized]);

  useEffect(() => {
    filterData();
  }, [attendanceData, dateFilter, statusFilter, searchTerm, customStartDate, customEndDate]);

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

  const fetchAllAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        '/api/attend/attend',
        getAuthHeaders()
      );

      if (response.data.success) {
        setAttendanceData(response.data.data.attendance || []);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Error loading attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await axios.get(
        '/api/attend/summary/today',
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

  const handleAutoMarkAbsent = async () => {
  try {
    setAutoMarkLoading(true);
    const response = await axios.post(
      '/api/attend/auto-mark-absent',
      { date: new Date().toISOString().split('T')[0] },
      getAuthHeaders()
    );

    if (response.data.success) {
      setMarkResult({
        success: true,
        message: `Successfully marked ${response.data.data?.newlyMarkedAbsent || 0} employees as absent.`,
        count: response.data.data?.newlyMarkedAbsent || 0
      });
      fetchAllAttendance();
      fetchTodaySummary();
   
      setTimeout(() => {
        closeAutoMarkModal();
      }, 3000);
    }
  } catch (err) {
    setMarkResult({
      success: false,
      message: 'Error auto-marking absent employees.'
    });
  } finally {
    setAutoMarkLoading(false);
  }
};

const handleMarkAbsentRange = async () => {
  if (!rangeStartDate || !rangeEndDate) {
    setMarkResult({
      success: false,
      message: 'Please select both start and end dates.'
    });
    return;
  }

  try {
    setRangeMarkLoading(true);
    const response = await axios.post(
      '/api/attend/mark-range',
      { startDate: rangeStartDate, endDate: rangeEndDate, excludeWeekends },
      getAuthHeaders()
    );

    if (response.data.success) {
      setMarkResult({
        success: true,
        message: `Successfully marked ${response.data.data?.totalAbsentMarked || 0} absent records for the date range.`,
        count: response.data.data?.totalAbsentMarked || 0
      });
      fetchAllAttendance();
      
      setTimeout(() => {
        closeRangeMarkModal();
      }, 2000);
    }
  } catch (err) {
    setMarkResult({
      success: false,
      message: 'Error marking absent for date range.'
    });
  } finally {
    setRangeMarkLoading(false);
  }
};

  const filterData = () => {
    let filtered = [...attendanceData];

    const normalizeDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const todayNormalized = normalizeDate(now);
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(record => {
          if (!record.date) return false;
          const recordDateNormalized = normalizeDate(record.date);
          return recordDateNormalized === todayNormalized;
        });
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

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const employee = record.employee || {};
        const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.toLowerCase();
        const employeeCode = (employee.employeeCode || '').toLowerCase();
        const department = (employee.department?.name || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               employeeCode.includes(searchLower) || 
               department.includes(searchLower);
      });
    }

    setFilteredData(filtered);
  };

  const openEditModal = (record) => {
    setCurrentRecord(record);
    setEditForm({
      clockIn: record.clockIn ? new Date(record.clockIn).toISOString().slice(0, 16) : '',
      clockOut: record.clockOut ? new Date(record.clockOut).toISOString().slice(0, 16) : '',
      status: record.status || ''
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setCurrentRecord(null);
    setEditForm({
      clockIn: '',
      clockOut: '',
      status: ''
    });
  };

  const openAutoMarkModal = () => {
    setAutoMarkModalOpen(true);
    setMarkResult(null);
  };

  const closeAutoMarkModal = () => {
    setAutoMarkModalOpen(false);
    setMarkResult(null);
  };

  const openRangeMarkModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setRangeStartDate(today);
    setRangeEndDate(today);
    setRangeMarkModalOpen(true);
    setMarkResult(null);
  };

  const closeRangeMarkModal = () => {
    setRangeMarkModalOpen(false);
    setMarkResult(null);
    setRangeStartDate('');
    setRangeEndDate('');
    setExcludeWeekends(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!currentRecord) return;

    try {
      const response = await axios.put(
        `/api/attend/${currentRecord._id}`,
        editForm,
        getAuthHeaders()
      );

      if (response.data.success) {
        const updatedData = attendanceData.map(record =>
          record._id === currentRecord._id ? response.data.data : record
        );
        setAttendanceData(updatedData);
        closeEditModal();
      }
    } catch (err) {
      if (err.response?.data?.message?.includes('Invalid attendance ID')) {
        setError('Invalid record ID. Please refresh the page and try again.');
      } else {
        setError('Error updating attendance record.');
      }
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const response = await axios.delete(
        `/api/attend/${id}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        const updatedData = attendanceData.filter(record => record._id !== id);
        setAttendanceData(updatedData);
      }
    } catch (err) {
      if (err.response?.data?.message?.includes('Invalid attendance ID')) {
        setError('Invalid record ID. Please refresh the page and try again.');
      } else {
        setError('Error deleting attendance record.');
      }
    }
  };

  const calculateHoursWorked = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return { hours: 0, minutes: 0, totalHours: 0 };
    
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = hours + (minutes / 60);
    
    return { hours, minutes, totalHours };
  };

  const calculateTotalHoursWorked = () => {
    let totalHours = 0;
    
    filteredData.forEach(record => {
      const { totalHours: recordHours } = calculateHoursWorked(record.clockIn, record.clockOut);
      totalHours += recordHours;
    });
    
    return {
      total: totalHours,
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours % 1) * 60)
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
      manualAbsent: 0,
      pendingClockOut: 0,
      overtime: 0  
    };

    const normalizeDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayNormalized = normalizeDate(new Date());
    let totalHoursAll = 0;
    let completedRecords = 0;
    
    filteredData.forEach(record => {
      if (record.status) {
        if (stats[record.status] !== undefined) {
          stats[record.status]++;
        }
      }
      
      if (record.status === 'absent') {
        if (record.autoMarked) {
          stats.autoAbsent++;
        } else {
          stats.manualAbsent++;
        }
      }
      
      if (normalizeDate(record.date) === todayNormalized) {
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

    stats.totalHours = parseFloat(totalHoursAll.toFixed(1));
    stats.avgHours = completedRecords > 0 ? parseFloat((totalHoursAll / completedRecords).toFixed(1)) : 0;
    stats.overtime = calculateOvertime();  

    return stats;
  };

  const getChartData = () => {
    const stats = getStats();
    
    const statusChart = {
      labels: ['Present', 'Late', 'Auto-Marked Absent', 'Manual Absent', 'On Leave'],
      datasets: [{
        data: [
          stats.present, 
          stats.late, 
          stats.autoAbsent, 
          stats.manualAbsent, 
          stats.on_leave
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#FF5722', '#2196F3'],
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
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
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
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 1
      }]
    };

    return { statusChart, dailyChart, hoursChart };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'status-badge-present';
      case 'late': return 'status-badge-late';
      case 'absent': return 'status-badge-absent';
      case 'on_leave': return 'status-badge-leave';
      default: return 'status-badge-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return <CheckCircle size={16} />;
      case 'late': return <AlertCircle size={16} />;
      case 'absent': return <XCircle size={16} />;
      case 'on_leave': return <Coffee size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee Code', 'Department', 'Date', 'Clock In', 'Clock Out', 'Hours Worked', 'Overtime', 'Status', 'Auto Marked'];
    const csvData = filteredData.map(record => {
      const { hours, minutes, totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
      const hoursWorked = `${hours}h ${minutes}m`;
      const overtime = totalHours > 8 ? `${(totalHours - 8).toFixed(1)}h` : '0h';
      
      return [
        `${record.employee?.firstname || ''} ${record.employee?.lastname || ''}`,
        record.employee?.employeeCode || '',
        record.employee?.department?.name || '',
        new Date(record.date).toLocaleDateString(),
        record.clockIn ? formatTime(record.clockIn) : '',
        record.clockOut ? formatTime(record.clockOut) : '',
        hoursWorked,
        overtime,
        record.status || '',
        record.autoMarked ? 'Yes' : 'No'
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
    link.setAttribute('download', `attendance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authorized) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  const stats = getStats();
  const totalHours = calculateTotalHoursWorked();
  const overtimeTotal = calculateOvertime();
  const { statusChart, dailyChart, hoursChart } = getChartData();

  return (
    <div className="attendance-dashboard">
           
      {todaySummary && (
        <div className="today-summary-banner">
          <div className="summary-content">
            <div className="summary-icon">
              <Calendar size={24} />
            </div>
            <div className="summary-details">
              <h3>Today's Summary ({todaySummary.today})</h3>
              <div className="summary-stats">
                <span className="summary-stat present">
                  <CheckCircle size={14} />
                  Present: {todaySummary.summary?.present || 0}
                </span>
                <span className="summary-stat late">
                  <AlertCircle size={14} />
                  Late: {todaySummary.summary?.late || 0}
                </span>
                <span className="summary-stat absent">
                  <XCircle size={14} />
                  Absent: {todaySummary.summary?.absent || 0}
                </span>
                <span className="summary-stat auto-absent">
                  <Clock size={14} />
                  Auto-Marked: {todaySummary.summary?.autoMarkedAbsent || 0}
                </span>
                <span className="summary-stat pending">
                  <Clock size={14} />
                  Pending Clock Out: {todaySummary.summary?.pendingClockOut || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="summary-actions">
            <button 
              onClick={openAutoMarkModal} 
              className="btn-auto-mark"
              disabled={loading}
            >
              <CheckCircle size={16} />
              Auto-Mark Absent
            </button>
            <button 
              onClick={openRangeMarkModal} 
              className="btn-mark-range"
              disabled={loading}
            >
              <Calendar size={16} />
              Mark Absent Range
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-controls">
        <div className="filters-section">
          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Time Period:
            </label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="custom-date-range">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
                placeholder="Start Date"
              />
              <span>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
                placeholder="End Date"
              />
            </div>
          )}

          <div className="filter-group">
            <label>
              <Filter size={16} />
              Status:
            </label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Search size={16} />
              Search:
            </label>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={fetchAllAttendance} className="btn-refresh" disabled={loading}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={exportToCSV} className="btn-export">
            <Download size={18} />
            Export CSV
          </button>
          <div className="record-count">
            <FileText size={16} />
            {filteredData.length} of {attendanceData.length} records
          </div>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <div className="error-content">
            <span className="error-icon"><XCircle size={20} /></span>
            <p>{error}</p>
            <button onClick={() => setError('')} className="close-error">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="statistics-cards">
        <div className="stat-card total">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Records</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        
        <div className="stat-card present">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Present</h3>
            <p className="stat-value">{stats.present}</p>
          </div>
        </div>
        
        <div className="stat-card late">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Late</h3>
            <p className="stat-value">{stats.late}</p>
          </div>
        </div>
        
        <div className="stat-card hours">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Hours</h3>
            <p className="stat-value">{stats.totalHours}</p>
            <p className="stat-subtext">{totalHours.hours}h {totalHours.minutes}m</p>
          </div>
        </div>
        
        <div className="stat-card auto-absent">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Auto-Marked Absent</h3>
            <div className="stat-value">{stats.autoAbsent}</div>
          </div>
        </div>

        {/* Add Overtime Stat Card */}
        <div className="stat-card overtime">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Overtime</h3>
            <p className="stat-value">
              {Math.floor(stats.overtime)}h {Math.round((stats.overtime % 1) * 60)}m
            </p>
            <p className="stat-subtext">Extra hours worked</p>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <TrendingUp size={20} />
            <h3>Daily Attendance Trend</h3>
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
                }
              }}
            />
          ) : (
            <div className="chart-placeholder">No data available</div>
          )}
        </div>
        
        <div className="chart-container">
          <div className="chart-header">
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
            <div className="chart-placeholder">No data available</div>
          )}
        </div>
        
        <div className="chart-container">
          <div className="chart-header">
            <BarChart3 size={20} />
            <h3>Top Hours Worked</h3>
          </div>
          {filteredData.length > 0 ? (
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
            <div className="chart-placeholder">No data available</div>
          )}
        </div>
      </div>

      <div className="records-section">
        <div className="section-header">
          <div className="section-title">
            <FileText size={24} />
            <h2>Attendance Records</h2>
          </div>
          <div className="hours-summary">
            <Clock size={16} />
            <span>Total Hours: <strong>{totalHours.hours}h {totalHours.minutes}m</strong></span>
            <span className="divider">|</span>
            <span>Overtime: <strong>{Math.floor(stats.overtime)}h {Math.round((stats.overtime % 1) * 60)}m</strong></span>
          </div>
        </div>
        
        {loading ? (
          <div className="loading-records">
            <div className="spinner small"></div>
            <p>Loading records...</p>
          </div>
        ) : (
          <div className="records-table-container">
            {filteredData.length > 0 ? (
              <table className="records-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours Worked</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Auto</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record) => {
                    const { hours, minutes, totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
                    const hoursWorked = `${hours}h ${minutes}m`;
                    const overtime = totalHours > 8 ? `${(totalHours - 8).toFixed(1)}h` : '0h';
                    
                    return (
                      <tr key={record._id}>
                        <td>
                          <div className="employee-info">
                            <div className="employee-name">
                              <User size={14} />
                              {record.employee?.firstname} {record.employee?.lastname}
                            </div>
                            <div className="employee-details">
                              {record.employee?.employeeCode} • {record.employee?.department?.name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <Calendar size={14} />
                            {new Date(record.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="time-cell">
                            <Clock size={14} />
                            {formatTime(record.clockIn)}
                          </div>
                        </td>
                        <td>
                          <div className="time-cell">
                            <Clock size={14} />
                            {formatTime(record.clockOut)}
                          </div>
                        </td>
                        <td>
                          <div className={`hours-cell ${totalHours >= 8 ? 'hours-good' : totalHours >= 4 ? 'hours-fair' : 'hours-low'}`}>
                            <Clock size={14} />
                            {hoursWorked}
                          </div>
                        </td>
                        <td>
                          <div className={`overtime-cell ${totalHours > 8 ? 'overtime-yes' : 'overtime-no'}`}>
                            <TrendingUp size={14} />
                            {overtime}
                          </div>
                        </td>
                        <td>
                          <div className={`status-badge ${getStatusBadgeClass(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {record.status?.toUpperCase() || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="auto-badge">
                            {record.autoMarked ? (
                              <span className="auto-yes">
                                <CheckCircle size={12} />
                                Auto
                              </span>
                            ) : (
                              <span className="auto-no">Manual</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            <button 
                              onClick={() => openEditModal(record)}
                              className="btn-edit"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRecord(record._id)}
                              className="btn-delete"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-records">
                <p>No attendance records found for the selected filters.</p>
                <button onClick={() => {
                  setDateFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }} className="btn-clear-filters">
                  <Filter size={16} />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editModalOpen && currentRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Edit size={20} />
                Edit Attendance Record
              </h3>
              <button onClick={closeEditModal} className="modal-close">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="record-info">
                <p><strong>Employee:</strong> {currentRecord.employee?.firstname} {currentRecord.employee?.lastname}</p>
                <p><strong>Employee Code:</strong> {currentRecord.employee?.employeeCode}</p>
                <p><strong>Date:</strong> {new Date(currentRecord.date).toLocaleDateString()}</p>
                <p><strong>Auto-Marked:</strong> {currentRecord.autoMarked ? 'Yes' : 'No'}</p>
              </div>
              
              <form onSubmit={handleEditSubmit} className="edit-form">
                <div className="form-group">
                  <label><Clock size={16} /> Clock In:</label>
                  <input
                    type="datetime-local"
                    value={editForm.clockIn}
                    onChange={(e) => setEditForm({...editForm, clockIn: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label><Clock size={16} /> Clock Out:</label>
                  <input
                    type="datetime-local"
                    value={editForm.clockOut}
                    onChange={(e) => setEditForm({...editForm, clockOut: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label><Filter size={16} /> Status:</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={closeEditModal} className="btn-cancel">
                    <X size={16} />
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    <CheckCircle size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {autoMarkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-headerAMB">
              <h3>
                <CheckCircle size={20} />
                Auto-Mark Absent Employees
              </h3>
              <button onClick={closeAutoMarkModal} className="modal-closeAMB">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-bodyAMB">
              <div className="modal-warningAMB">
                <AlertCircle size={24} />
                <p>This will mark all employees who haven't clocked in today as absent.</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              
              {markResult && (
                <div className={`modal-resultAMB ${markResult.success ? 'successAMB' : 'errorAMB'}`}>
                  {markResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  <p>{markResult.message}</p>
                </div>
              )}
              
              <div className="form-actionsAMB">
                <button type="button" onClick={closeAutoMarkModal} className="btn-cancelAMB">
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleAutoMarkAbsent} 
                  className="btn-confirmAMB"
                  disabled={autoMarkLoading}
                >
                  {autoMarkLoading ? (
                    <>
                      <div className="spinner small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirm Auto-Mark
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rangeMarkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-headerAMB">
              <h3>
                <Calendar size={20} />
                Mark Absent Range
              </h3>
              <button onClick={closeRangeMarkModal} className="modal-closeAMB">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-bodyAMB">
              <div className="modal-warningAMB">
                <AlertCircle size={24} />
                <p>This will mark absent employees for the selected date range.</p>
              </div>
              
              <form className="edit-formAMB">
                <div className="form-groupAMB">
                  <label><Calendar size={16} /> Start Date:</label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-groupAMB">
                  <label><Calendar size={16} /> End Date:</label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-groupAMB checkbox-groupAMB">
                  <label>
                    <input
                      type="checkbox"
                      checked={excludeWeekends}
                      onChange={(e) => setExcludeWeekends(e.target.checked)}
                    />
                    Exclude weekends
                  </label>
                </div>
              </form>
              
              {markResult && (
                <div className={`modal-resultAMB ${markResult.success ? 'successAMB' : 'errorAMB'}`}>
                  {markResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  <p>{markResult.message}</p>
                </div>
              )}
              
              <div className="form-actionsAMB">
                <button type="button" onClick={closeRangeMarkModal} className="btn-cancelAMB">
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleMarkAbsentRange} 
                  className="btn-confirmAMB"
                  disabled={rangeMarkLoading}
                >
                  {rangeMarkLoading ? (
                    <>
                      <div className="spinner small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Mark Absent Range
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;