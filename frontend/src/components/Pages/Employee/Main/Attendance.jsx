import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  AreaChart, Area
} from 'recharts';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  TrendingUp, User, Download, Search, RefreshCw, 
  Filter, ChevronDown, ChevronUp, BarChart3, PieChart as PieChartIcon,
  LineChart as LineChartIcon, Users, FileSpreadsheet, Users as UsersIcon
} from 'lucide-react';
import "./Attendance.css";

const Attendance = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userAttendance, setUserAttendance] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalHours: 0,
    averageHours: 0,
    overtime: 0,
    attendanceRate: 0,
    consecutiveDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeChart, setActiveChart] = useState('bar');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [timeRangeFilter, setTimeRangeFilter] = useState('today');

  // Memoized user extraction
  const getLoggedInUser = useCallback(() => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;

      const userData = JSON.parse(userString);
      
      return {
        _id: userData.id,
        employeeCode: userData.employeeCode || 'N/A',
        firstname: userData.fullname?.split(' ')[0] || 'User',
        lastname: userData.fullname?.split(' ')[1] || '',
        fullname: userData.fullname || 'User',
        email: userData.email || 'N/A',
        role: userData.role || 'employee',
      };
    } catch (error) {
      console.error('Error getting logged-in user:', error);
      return null;
    }
  }, []);

  // Calculate hours worked with proper logic
  const calculateHoursWorked = useCallback((clockIn, clockOut) => {
    if (!clockIn || !clockOut) return { hours: 0, minutes: 0, totalHours: 0 };
    
    try {
      const start = new Date(clockIn);
      const end = new Date(clockOut);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { hours: 0, minutes: 0, totalHours: 0 };
      }
      
      const diffMs = end - start;
      
      // Check if end is after start
      if (diffMs < 0) {
        return { hours: 0, minutes: 0, totalHours: 0 };
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHours = hours + (minutes / 60);
      
      return { hours, minutes, totalHours };
    } catch (error) {
      console.error('Error calculating hours:', error);
      return { hours: 0, minutes: 0, totalHours: 0 };
    }
  }, []);

  // Format hours for display
  const formatHours = useCallback((clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 'N/A';
    const { hours, minutes } = calculateHoursWorked(clockIn, clockOut);
    if (hours === 0 && minutes === 0) return 'N/A';
    return `${hours}h ${minutes}m`;
  }, [calculateHoursWorked]);

  // Calculate total hours worked for filtered data
  const calculateTotalHoursWorked = useCallback((attendanceRecords) => {
    let totalHoursAll = 0;
    let completedRecords = 0;
    
    attendanceRecords.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        totalHoursAll += totalHours;
        completedRecords++;
      }
    });
    
    return {
      total: parseFloat(totalHoursAll.toFixed(2)),
      hours: Math.floor(totalHoursAll),
      minutes: Math.round((totalHoursAll % 1) * 60),
      average: completedRecords > 0 ? parseFloat((totalHoursAll / completedRecords).toFixed(2)) : 0
    };
  }, [calculateHoursWorked]);

  // Calculate overtime
  const calculateOvertime = useCallback((attendanceRecords) => {
    let overtime = 0;
    
    attendanceRecords.forEach(record => {
      if (record.clockIn && record.clockOut) {
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        if (totalHours > 8) {
          overtime += totalHours - 8;
        }
      }
    });
    
    return parseFloat(overtime.toFixed(2));
  }, [calculateHoursWorked]);

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!loggedInUser || !loggedInUser._id) {
        throw new Error('User not authenticated');
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/attend/attend', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const allRecords = data.data.attendance || [];
        
        // Filter records for current user by employeeCode
        const userRecords = allRecords.filter(record => 
          record.employee?.employeeCode === loggedInUser.employeeCode
        );

        if (userRecords.length === 0) {
          setError('No attendance records found for your account.');
        }

        setUserAttendance(userRecords);
        setFilteredAttendance(userRecords);
      } else {
        throw new Error(data.message || 'Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(error.message);
      setUserAttendance([]);
      setFilteredAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser]);

  // Calculate statistics with memoization
  const calculateStats = useCallback((attendanceRecords) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let consecutiveDays = 0;
    let currentConsecutive = 0;

    const sortedRecords = [...attendanceRecords].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    let lastPresentDate = null;
    
    sortedRecords.forEach(record => {
      if (record.status === 'present') {
        present++;
        const currentDate = new Date(record.date).toDateString();
        
        if (lastPresentDate) {
          const lastDate = new Date(lastPresentDate);
          const current = new Date(record.date);
          const diffTime = Math.abs(current - lastDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentConsecutive++;
            consecutiveDays = Math.max(consecutiveDays, currentConsecutive);
          } else {
            currentConsecutive = 1;
          }
        } else {
          currentConsecutive = 1;
          consecutiveDays = 1;
        }
        lastPresentDate = record.date;
      }
      
      if (record.status === 'absent') absent++;
      if (record.status === 'late') late++;
    });

    const totalDays = attendanceRecords.length;
    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;
    
    // Calculate hours using helper functions
    const hoursData = calculateTotalHoursWorked(attendanceRecords);
    const overtime = calculateOvertime(attendanceRecords);

    return {
      present,
      absent,
      late,
      totalHours: hoursData.total,
      averageHours: hoursData.average,
      overtime: overtime,
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      consecutiveDays
    };
  }, [calculateTotalHoursWorked, calculateOvertime]);

  // Update stats when filteredAttendance changes
  useEffect(() => {
    if (filteredAttendance.length > 0) {
      setStats(calculateStats(filteredAttendance));
    } else {
      setStats({
        present: 0,
        absent: 0,
        late: 0,
        totalHours: 0,
        averageHours: 0,
        overtime: 0,
        attendanceRate: 0,
        consecutiveDays: 0
      });
    }
  }, [filteredAttendance, calculateStats]);

  // Prepare chart data with memoization
  const chartData = useMemo(() => {
    if (filteredAttendance.length === 0) return { weeklyData: [], monthlyData: [], statusData: [] };

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = daysOfWeek.map(day => ({
      name: day,
      hours: 0,
      present: 0,
      late: 0,
      absent: 0
    }));

    const monthlyDataMap = new Map();
    
    filteredAttendance.forEach(record => {
      const date = new Date(record.date);
      const dayIndex = date.getDay();
      const monthDay = date.getDate();
      const monthKey = `${date.getMonth() + 1}/${monthDay}`;
      
      if (record.status === 'present') weeklyData[dayIndex].present++;
      if (record.status === 'late') weeklyData[dayIndex].late++;
      if (record.status === 'absent') weeklyData[dayIndex].absent++;
      
      if (record.clockIn && record.clockOut) {
        const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
        weeklyData[dayIndex].hours += totalHours;
        
        if (!monthlyDataMap.has(monthKey)) {
          monthlyDataMap.set(monthKey, { date: monthKey, hours: 0, count: 0 });
        }
        const monthData = monthlyDataMap.get(monthKey);
        monthData.hours += totalHours;
        monthData.count++;
      }
    });

    // Calculate average hours for monthly data
    const monthlyData = Array.from(monthlyDataMap.values())
      .map(item => ({
        date: item.date,
        hours: parseFloat((item.hours / item.count).toFixed(2)),
        total: parseFloat(item.hours.toFixed(2))
      }))
      .sort((a, b) => {
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);
        return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
      });

    const statusData = [
      { name: 'Present', value: stats.present, color: '#10B981' },
      { name: 'Late', value: stats.late, color: '#F59E0B' },
      { name: 'Absent', value: stats.absent, color: '#EF4444' }
    ].filter(item => item.value > 0);

    return { weeklyData, monthlyData, statusData };
  }, [filteredAttendance, stats, calculateHoursWorked]);

  // Handle table sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort filtered attendance with proper hours calculation
  const sortedAttendance = useMemo(() => {
    const sortableItems = [...filteredAttendance];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'date') {
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        if (sortConfig.key === 'hours') {
          const aHours = calculateHoursWorked(a.clockIn, a.clockOut).totalHours;
          const bHours = calculateHoursWorked(b.clockIn, b.clockOut).totalHours;
          return sortConfig.direction === 'asc' ? aHours - bHours : bHours - aHours;
        }
        if (sortConfig.key === 'status') {
          return sortConfig.direction === 'asc' 
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAttendance, sortConfig, calculateHoursWorked]);

  // Format functions
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'N/A';
    }
  }, []);

  // Apply time range filter
  const applyTimeRangeFilter = useCallback((range) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last5':
        startDate.setDate(startDate.getDate() - 5);
        break;
      case 'last20':
        startDate.setDate(startDate.getDate() - 20);
        break;
      case 'last30':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'custom':
        setTimeRangeFilter('custom');
        return;
      default:
        startDate.setHours(0, 0, 0, 0);
        range = 'today';
    }
    
    startDate.setHours(0, 0, 0, 0);
    
    setDateFilter({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
    
    setTimeRangeFilter(range);
  }, []);

  // Export data to CSV with proper hours calculation
  const exportToCSV = useCallback(() => {
    if (filteredAttendance.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Day', 'Clock In', 'Clock Out', 'Hours Worked', 'Status', 'Method', 'Overtime'];
    
    const csvData = filteredAttendance.map(record => {
      const date = new Date(record.date);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const { totalHours } = calculateHoursWorked(record.clockIn, record.clockOut);
      const overtime = totalHours > 8 ? (totalHours - 8).toFixed(2) : '0';
      
      return [
        formatDate(record.date),
        day,
        formatTime(record.clockIn),
        record.clockOut ? formatTime(record.clockOut) : 'N/A',
        totalHours > 0 ? `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m` : 'N/A',
        record.status,
        record.method || 'Manual',
        overtime
      ];
    });

    // Add stats summary
    csvData.unshift([]); // Empty row
    csvData.unshift(['Summary', '', '', '', '', '', '', '']);
    csvData.unshift(['Present Days', stats.present, 'Absent Days', stats.absent, 'Late Arrivals', stats.late, '', '']);
    csvData.unshift([
      'Total Hours', 
      `${Math.floor(stats.totalHours)}h ${Math.round((stats.totalHours % 1) * 60)}m`, 
      'Average Hours/Day', 
      `${Math.floor(stats.averageHours)}h ${Math.round((stats.averageHours % 1) * 60)}m`, 
      'Overtime', 
      `${Math.floor(stats.overtime)}h ${Math.round((stats.overtime % 1) * 60)}m`, 
      'Attendance Rate', 
      `${stats.attendanceRate}%`
    ]);
    csvData.unshift([]); // Empty row
    csvData.unshift(['Generated on', new Date().toLocaleString(), 'Employee', loggedInUser?.fullname || 'User', 'Employee Code', loggedInUser?.employeeCode || 'N/A', '', '']);
    csvData.unshift([]); // Empty row
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${loggedInUser?.employeeCode || 'user'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAttendance, loggedInUser, calculateHoursWorked, formatDate, formatTime, stats]);

  // Get status badge class
  const getStatusBadgeClass = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'statusPresentE';
      case 'late': return 'statusLateE';
      case 'absent': return 'statusAbsentE';
      default: return 'statusDefaultE';
    }
  }, []);

  // Initialize
  useEffect(() => {
    const user = getLoggedInUser();
    if (user) {
      setLoggedInUser(user);
    } else {
      setError('Please login to view your attendance records.');
      setLoading(false);
    }
  }, [getLoggedInUser]);

  // Fetch data when loggedInUser is available
  useEffect(() => {
    if (loggedInUser && loggedInUser._id) {
      fetchAttendanceData();
    }
  }, [loggedInUser, fetchAttendanceData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...userAttendance];

    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        (record.method && record.method.toLowerCase().includes(query)) ||
        (record.status && record.status.toLowerCase().includes(query)) ||
        formatDate(record.date).toLowerCase().includes(query)
      );
    }

    setFilteredAttendance(filtered);
  }, [dateFilter, searchQuery, userAttendance, formatDate]);

  // Apply default time range filter on initial load
  useEffect(() => {
    if (userAttendance.length > 0) {
      applyTimeRangeFilter('today');
    }
  }, [userAttendance, applyTimeRangeFilter]);

  if (loading) {
    return (
      <div className="loadingContainerE">
        <div className="loadingSpinnerE"></div>
        <p className="loadingTextE">Loading your attendance data...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="loginRequiredContainerE">
        <div className="loginRequiredCardE">
          <User size={48} className="loginIconE" />
          <h2 className="loginTitleE">Authentication Required</h2>
          <p className="loginMessageE">Please login to access your attendance dashboard.</p>
          <button 
            className="loginButtonE"
            onClick={() => window.location.href = '/login'}
          >
            <User size={16} /> Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendanceContainerE">
      {/* Header */}
      <div className="attendanceHeaderE">
        <div className="headerLeftE">
          <h1 className="headerTitleE">
            <Calendar className="headerIconE" /> My Attendance
          </h1>
          <p className="headerSubtitleE">
            <span className="userNameHighlightE">{loggedInUser.fullname}</span>
            {loggedInUser.employeeCode && ` (${loggedInUser.employeeCode})`}<br/>
            <UsersIcon size={12} /> {loggedInUser.role}
          </p>
        </div>
       </div>

      {/* Error Display */}
      {error && (
        <div className="errorBannerE">
          <AlertCircle size={20} />
          <p className="errorMessageE">{error}</p>
          <button 
            className="refreshButtonE"
            onClick={fetchAttendanceData}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      )}
      
      {/* Controls */}
      <div className="controlsSectionE">
        <div className="searchContainerE">
          <div className="searchBoxE">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by status, method, or date..."
              value={searchQuery}
              onChange={(e) => setSearchText(e.target.value)}
              className="searchInputE"
              disabled={userAttendance.length === 0}
            />
          </div>
          
          <button 
            className="filterToggleE"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={16} />
            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Filters
          </button>
        </div>

        {isFilterOpen && (
          <div className="filtersContainerE">
            <div className="timeRangeFiltersE">
              <div className="timeRangeButtonsE">
                <button 
                  className={`timeRangeButtonE ${timeRangeFilter === 'today' ? 'activeE' : ''}`}
                  onClick={() => applyTimeRangeFilter('today')}
                  disabled={userAttendance.length === 0}
                >
                  Today
                </button>
                <button 
                  className={`timeRangeButtonE ${timeRangeFilter === 'last5' ? 'activeE' : ''}`}
                  onClick={() => applyTimeRangeFilter('last5')}
                  disabled={userAttendance.length === 0}
                >
                  Last 5 Days
                </button>
                <button 
                  className={`timeRangeButtonE ${timeRangeFilter === 'last20' ? 'activeE' : ''}`}
                  onClick={() => applyTimeRangeFilter('last20')}
                  disabled={userAttendance.length === 0}
                >
                  Last 20 Days
                </button>
                <button 
                  className={`timeRangeButtonE ${timeRangeFilter === 'last30' ? 'activeE' : ''}`}
                  onClick={() => applyTimeRangeFilter('last30')}
                  disabled={userAttendance.length === 0}
                >
                  Last 30 Days
                </button>
                <button 
                  className={`timeRangeButtonE ${timeRangeFilter === 'custom' ? 'activeE' : ''}`}
                  onClick={() => applyTimeRangeFilter('custom')}
                  disabled={userAttendance.length === 0}
                >
                  Custom Range
                </button>
              </div>
              
              {timeRangeFilter === 'custom' && (
                <div className="customDateRangeE">
                  <div className="dateInputGroupE">
                    <label className="dateLabelE">From Date:</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      className="dateInputE"
                      disabled={userAttendance.length === 0}
                    />
                  </div>
                  <div className="dateInputGroupE">
                    <label className="dateLabelE">To Date:</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      className="dateInputE"
                      disabled={userAttendance.length === 0}
                    />
                  </div>
                </div>
              )}
              
              <div className="filterActionsE">
                <button 
                  className="clearFiltersButtonE"
                  onClick={() => {
                    setDateFilter({ startDate: '', endDate: '' });
                    setSearchQuery('');
                    setTimeRangeFilter('today');
                    applyTimeRangeFilter('today');
                  }}
                  disabled={userAttendance.length === 0}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="actionButtonsE">
          <div className="recordCountE">
            Showing {filteredAttendance.length} of {userAttendance.length} records
          </div>
          
          <div className="actionButtonsGroupE">
            <button 
              className="refreshButtonE"
              onClick={fetchAttendanceData}
              title="Refresh Data"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            
            {filteredAttendance.length > 0 && (
              <button 
                className="downloadButtonE"
                onClick={exportToCSV}
                title="Export to CSV"
              >
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="statsGridE">
        <div className="statCardE statPresentE">
          <div className="statIconE">
            <CheckCircle size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Present Days</h3>
            <p className="statValueE">{stats.present}</p>
            <p className="statSubtextE">{stats.attendanceRate}% attendance rate</p>
          </div>
        </div>
        
        <div className="statCardE statAbsentE">
          <div className="statIconE">
            <XCircle size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Absent Days</h3>
            <p className="statValueE">{stats.absent}</p>
          </div>
        </div>
        
        <div className="statCardE statLateE">
          <div className="statIconE">
            <AlertCircle size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Late Arrivals</h3>
            <p className="statValueE">{stats.late}</p>
          </div>
        </div>
        
        <div className="statCardE statHoursE">
          <div className="statIconE">
            <Clock size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Total Hours</h3>
            <p className="statValueE">
              {Math.floor(stats.totalHours)}h {Math.round((stats.totalHours % 1) * 60)}m
            </p>
            <p className="statSubtextE">
              Avg: {Math.floor(stats.averageHours)}h {Math.round((stats.averageHours % 1) * 60)}m/day
            </p>
          </div>
        </div>

        <div className="statCardE statOvertimeE">
          <div className="statIconE">
            <TrendingUp size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Overtime</h3>
            <p className="statValueE">
              {Math.floor(stats.overtime)}h {Math.round((stats.overtime % 1) * 60)}m
            </p>
            <p className="statSubtextE">Extra hours worked</p>
          </div>
        </div>

        <div className="statCardE statConsecutiveE">
          <div className="statIconE">
            <Calendar size={24} />
          </div>
          <div className="statContentE">
            <h3 className="statTitleE">Consecutive Days</h3>
            <p className="statValueE">{stats.consecutiveDays}</p>
            <p className="statSubtextE">Days present in a row</p>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="chartSelectorE">
        <button 
          className={`chartTypeButtonE ${activeChart === 'bar' ? 'activeE' : ''}`}
          onClick={() => setActiveChart('bar')}
        >
          <BarChart3 size={16} /> Bar Chart
        </button>
        <button 
          className={`chartTypeButtonE ${activeChart === 'line' ? 'activeE' : ''}`}
          onClick={() => setActiveChart('line')}
        >
          <LineChartIcon size={16} /> Line Chart
        </button>
        <button 
          className={`chartTypeButtonE ${activeChart === 'pie' ? 'activeE' : ''}`}
          onClick={() => setActiveChart('pie')}
        >
          <PieChartIcon size={16} /> Pie Chart
        </button>
      </div>

      {/* Charts Section */}
      {userAttendance.length > 0 && (
        <div className="chartsSectionE">
          <div className="chartCardE">
            <div className="chartHeaderE">
              <h3 className="chartTitleE">
                <TrendingUp size={20} /> Work Hours Analysis
              </h3>
            </div>
            <div className="chartContainerE">
              {activeChart === 'bar' && chartData.weeklyData.some(day => day.hours > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'hours') return [`${parseFloat(value).toFixed(1)} hours`, 'Hours Worked'];
                        return [value, name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="hours" name="Hours Worked" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : activeChart === 'line' && chartData.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'hours' || name === 'total') {
                          return [`${parseFloat(value).toFixed(1)} hours`, name === 'hours' ? 'Avg Hours/Day' : 'Total Hours'];
                        }
                        return [value, name];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="hours" 
                      name="Avg Hours/Day" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="Total Hours" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : activeChart === 'pie' && chartData.statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="noDataChartE">
                  <p>No chart data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Chart - Attendance Trend */}
          <div className="chartCardE">
            <div className="chartHeaderE">
              <h3 className="chartTitleE">
                <TrendingUp size={20} /> Attendance Trend
              </h3>
            </div>
            <div className="chartContainerE">
              {chartData.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value) => [`${parseFloat(value).toFixed(1)} hours`, 'Average Hours']}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      name="Average Hours" 
                      stroke="#3B82F6" 
                      fill="#93C5FD" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="noDataChartE">
                  <p>No trend data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {userAttendance.length > 0 && (
        <div className="attendanceTableSectionE">
          <div className="sectionHeaderE">
            <h3 className="sectionTitleE">Your Attendance Records</h3>
            <div className="currentFilterE">
              {timeRangeFilter === 'today' ? 'Today'
                : timeRangeFilter === 'custom' && dateFilter.startDate && dateFilter.endDate 
                ? `Custom Range: ${dateFilter.startDate} to ${dateFilter.endDate}`
                : timeRangeFilter === 'last5' ? 'Last 5 Days'
                : timeRangeFilter === 'last20' ? 'Last 20 Days'
                : timeRangeFilter === 'last30' ? 'Last 30 Days'
                : 'All Records'}
            </div>
          </div>
          
          {filteredAttendance.length === 0 ? (
            <div className="noDataMessageE">
              <p>No attendance records match your search filters.</p>
            </div>
          ) : (
            <div className="tableContainerE">
              <table className="attendanceTableE">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')} className="sortableHeaderE">
                      Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th onClick={() => handleSort('hours')} className="sortableHeaderE">
                      Hours {sortConfig.key === 'hours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('status')} className="sortableHeaderE">
                      Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttendance.map((record) => {
                    const { hours, minutes } = calculateHoursWorked(record.clockIn, record.clockOut);
                    const hoursWorked = hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : 'N/A';
                    
                    return (
                      <tr 
                        key={record._id} 
                        className={`statusRowE ${getStatusBadgeClass(record.status)}`}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <td>{formatDate(record.date)}</td>
                        <td>{formatTime(record.clockIn)}</td>
                        <td>{record.clockOut ? formatTime(record.clockOut) : 'N/A'}</td>
                        <td>{hoursWorked}</td>
                        <td>
                          <span className={`statusBadgeE ${getStatusBadgeClass(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <span className="methodBadgeE">
                            {record.method || 'Manual'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* No Data Message */}
      {userAttendance.length === 0 && !error && (
        <div className="noDataSectionE">
          <div className="noDataCardE">
            <Calendar size={48} className="noDataIconE" />
            <h3 className="noDataTitleE">No Attendance Records Found</h3>
            <p className="noDataMessageE">Start tracking your attendance to see your statistics here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;