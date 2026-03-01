// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Users, Building, FileText, Calendar, Clock, 
  CheckCircle, AlertCircle, XCircle, Coffee, 
  RefreshCw, Filter, ChevronDown, ChevronUp, Eye, EyeOff,
  User
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  // ========== STATE DEFINITIONS ==========
  
  // Count states for dashboard metrics
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  
  // Statistics states for attendance and leave data
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  
  // Today's summary banner data
  const [todaySummary, setTodaySummary] = useState(null);
  
  // Loading and UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  
  // Date filtering states
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Attendance and leave data storage
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  
  // UI visibility state for filter section
  const [showFilters, setShowFilters] = useState(true);

  // ========== EFFECT HOOKS ==========
  
  useEffect(() => {
    const checkAuthorization = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          setUnauthorized(true);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Only HR can access this dashboard
        if (!parsedUser.role || parsedUser.role.toLowerCase() !== 'hr') {
          setUnauthorized(true);
          return;
        }

        fetchAllData();
      } catch (err) {
        console.error('Authorization error:', err);
        setUnauthorized(true);
      }
    };

    checkAuthorization();
  }, []);

  useEffect(() => {
    // Apply filters whenever the data or filter criteria change
    filterAttendanceData();
    filterLeaveData();
  }, [attendanceData, leaveData, dateFilter, customStartDate, customEndDate]);

  // ========== AUTHENTICATION UTILITY ==========
  
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

  // ========== DATE UTILITY FUNCTIONS ==========
  
  const normalizeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Convert to local date string in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ========== DATA FETCHING FUNCTIONS ==========
  
 // Alternative - Force 0 if API structure is unexpected
const fetchAllData = async (isRefresh = false) => {
  try {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    const token = localStorage.getItem('token');
    
    try {
      const [
        departRes,
        empRes,
        docsRes,
        attendanceRes,
        leaveRes,
        todaySummaryRes
      ] = await Promise.all([
        axios.get("/api/depart/Departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/employees/allEmployees", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/doc/all", {
          headers: { Authorization: `Bearer ${token}` },
          params: { type: 'all', search: '' }
        }),
        axios.get("/api/attend/attend", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/leave/allLeave", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/attend/summary/today", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      // Reset all counts to 0 before processing
      let departmentsCount = 0;
      let employeesCount = 0;
      let documentsCount = 0;
      let attendanceData = [];
      let leaveData = [];
      let todaySummaryData = null;

      if (Array.isArray(departRes.data)) {
        departmentsCount = departRes.data.length <= 100 ? departRes.data.length : 0;
      } else if (departRes.data?.departments && Array.isArray(departRes.data.departments)) {
        departmentsCount = departRes.data.departments.length <= 100 ? departRes.data.departments.length : 0;
      }

      // Employees
      if (empRes.data?.employees && Array.isArray(empRes.data.employees)) {
        employeesCount = empRes.data.employees.length;
      }

      // Documents
      if (docsRes.data.success && docsRes.data.data && Array.isArray(docsRes.data.data)) {
        documentsCount = docsRes.data.data.length;
      }

      // Attendance
      if (attendanceRes.data.success && attendanceRes.data.data?.attendance) {
        attendanceData = attendanceRes.data.data.attendance;
      }

      // Leaves
      if (leaveRes.data.success && leaveRes.data.data) {
        leaveData = leaveRes.data.data;
      }

      // Today's summary
      if (todaySummaryRes.data.success) {
        todaySummaryData = todaySummaryRes.data.data;
      }

      setDepartmentsCount(departmentsCount);
      setEmployeesCount(employeesCount);
      setDocumentsCount(documentsCount);
      setAttendanceData(attendanceData);
      setLeaveData(leaveData);
      setTodaySummary(todaySummaryData);
      setError("");
      
    } catch (apiError) {
      console.error('API Error:', apiError);
      // On any API error, set all to 0
      setDepartmentsCount(0);
      setEmployeesCount(0);
      setDocumentsCount(0);
      setAttendanceData([]);
      setLeaveData([]);
      setTodaySummary(null);
      calculateAttendanceStats([]);
      calculateLeaveStats([]);
    }
    
  } catch (err) {
    console.error('Error in fetchAllData:', err);
    setError('Failed to load dashboard data.');
    setDepartmentsCount(0);
    setEmployeesCount(0);
    setDocumentsCount(0);
    setAttendanceData([]);
    setLeaveData([]);
    setTodaySummary(null);
    calculateAttendanceStats([]);
    calculateLeaveStats([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  // ========== FILTERING FUNCTIONS ==========
  
  const filterAttendanceData = () => {
    let filtered = [...attendanceData];

    const todayNormalized = normalizeDate(new Date());
    
    // Date filtering logic based on selected filter
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(record => {
          if (!record.date) return false;
          const recordDateNormalized = normalizeDate(record.date);
          return recordDateNormalized === todayNormalized;
        });
        break;
      case 'last5':
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= fiveDaysAgo;
        });
        break;
      case 'last15':
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= fifteenDaysAgo;
        });
        break;
      case 'last30':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= thirtyDaysAgo;
        });
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            const startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            
            return recordDate >= startDate && recordDate <= endDate;
          });
        }
        break;
      default:
        // Show all records if no specific filter
        break;
    }

    setFilteredAttendance(filtered);
    
    // Recalculate statistics with the filtered data
    if (filtered.length > 0 || attendanceData.length > 0) {
      calculateAttendanceStats(filtered);
    }
  };

  const filterLeaveData = () => {
    let filtered = [...leaveData];
    const today = new Date();
    const todayNormalized = normalizeDate(today);
    today.setHours(0, 0, 0, 0); // Start of today

    switch (dateFilter) {
      case 'today':
        // Show leaves that were CREATED/APPLIED today
        filtered = filtered.filter(leave => {
          if (!leave.createdAt) return false;
          
          const leaveCreated = new Date(leave.createdAt);
          const leaveCreatedNormalized = normalizeDate(leaveCreated);
          
          // Check if leave was created/applied today
          return leaveCreatedNormalized === todayNormalized;
        });
        break;
        
      case 'last5':
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);
        filtered = filtered.filter(leave => {
          const leaveDate = leave.createdAt ? new Date(leave.createdAt) : 
                           leave.startDate ? new Date(leave.startDate) : null;
          
          if (!leaveDate) return false;
          
          return leaveDate >= fiveDaysAgo;
        });
        break;
        
      case 'last15':
        const fifteenDaysAgo = new Date(today);
        fifteenDaysAgo.setDate(today.getDate() - 15);
        filtered = filtered.filter(leave => {
          const leaveDate = leave.createdAt ? new Date(leave.createdAt) : 
                           leave.startDate ? new Date(leave.startDate) : null;
          
          if (!leaveDate) return false;
          
          return leaveDate >= fifteenDaysAgo;
        });
        break;
        
      case 'last30':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        filtered = filtered.filter(leave => {
          const leaveDate = leave.createdAt ? new Date(leave.createdAt) : 
                           leave.startDate ? new Date(leave.startDate) : null;
          
          if (!leaveDate) return false;
          
          return leaveDate >= thirtyDaysAgo;
        });
        break;
        
      case 'custom':
        if (customStartDate && customEndDate) {
          const startFilterDate = new Date(customStartDate);
          const endFilterDate = new Date(customEndDate);
          endFilterDate.setHours(23, 59, 59, 999);
          
          filtered = filtered.filter(leave => {
            const leaveDate = leave.createdAt ? new Date(leave.createdAt) : 
                             leave.startDate ? new Date(leave.startDate) : null;
            
            if (!leaveDate) return false;
            
            // Check if leave date is within custom range
            return leaveDate >= startFilterDate && leaveDate <= endFilterDate;
          });
        }
        break;
        
      default:
        // Show all leaves
        break;
    }

    setFilteredLeaves(filtered);
    
    // Recalculate leave statistics with filtered data
    if (filtered.length > 0 || leaveData.length > 0) {
      calculateLeaveStats(filtered);
    }
  };

  // ========== FILTER HANDLERS ==========
  
  const handleDateFilterChange = (filterType) => {
    setDateFilter(filterType);
    
    // Reset custom dates if switching away from custom filter
    if (filterType !== 'custom') {
      setCustomStartDate("");
      setCustomEndDate("");
    }
  };

  // ========== STATISTICS CALCULATION FUNCTIONS ==========
  
  const calculateAttendanceStats = (attendanceData = []) => {
    // Default stats object with all values set to 0
    const defaultStats = {
      present: 0,
      late: 0,
      absent: 0,
      on_leave: 0,
      pendingClockOut: 0,
      total: 0,
      autoAbsent: 0,
      manualAbsent: 0,
      today: 0
    };

    // If no data, set default stats and return
    if (!attendanceData || attendanceData.length === 0) {
      setAttendanceStats(defaultStats);
      return;
    }

    const stats = { ...defaultStats };
    stats.total = attendanceData.length;

    const todayNormalized = normalizeDate(new Date());
    
    // Count employees on leave today from ALL leave data (not just filtered)
    let employeesOnLeaveToday = new Set();
    
    if (leaveData.length > 0) {
      leaveData.forEach(leave => {
        if (leave.status === 'approved') {
          const startDate = new Date(leave.startDate);
          const startDateNormalized = normalizeDate(startDate);
          
          const endDate = new Date(leave.endDate);
          const endDateNormalized = normalizeDate(endDate);
          
          // Check if today is within leave period
          if (todayNormalized >= startDateNormalized && todayNormalized <= endDateNormalized) {
            const employeeId = leave.employee?._id || leave.employee;
            if (employeeId) {
              employeesOnLeaveToday.add(employeeId);
            }
          }
        }
      });
      
      stats.on_leave = employeesOnLeaveToday.size;
    }

    // Process each attendance record
    attendanceData.forEach(record => {
      const recordDateNormalized = normalizeDate(record.date);
      
      // Count today's records
      if (recordDateNormalized === todayNormalized) {
        stats.today++;
      }
      
      // Count status
      if (record.status) {
        if (stats[record.status] !== undefined) {
          stats[record.status]++;
        }
      }
      
      // Count auto-marked vs manual absent
      if (record.status === 'absent') {
        if (record.autoMarked) {
          stats.autoAbsent++;
        } else {
          stats.manualAbsent++;
        }
      }
      
      // Count today's pending clock out
      if (recordDateNormalized === todayNormalized && record.clockIn && !record.clockOut) {
        stats.pendingClockOut++;
      }
    });

    setAttendanceStats(stats);
  };

  const calculateLeaveStats = (leaveData = []) => {
    // Default stats object with all values set to 0
    const defaultStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: 0,
      activeToday: 0
    };

    // If no data, set default stats and return
    if (!leaveData || leaveData.length === 0) {
      setLeaveStats(defaultStats);
      return;
    }

    const stats = { ...defaultStats };
    stats.total = leaveData.length;

    const todayNormalized = normalizeDate(new Date());

    // Process each leave record
    leaveData.forEach(leave => {
      if (stats[leave.status] !== undefined) {
        stats[leave.status]++;
      }
      
      // Count active leaves today
      if (leave.status === 'approved') {
        const startDateNormalized = normalizeDate(leave.startDate);
        const endDateNormalized = normalizeDate(leave.endDate);
        
        // Check if today is within leave period
        if (todayNormalized >= startDateNormalized && todayNormalized <= endDateNormalized) {
          stats.activeToday++;
        }
      }
    });

    setLeaveStats(stats);
  };

  // ========== UI UTILITY FUNCTIONS ==========
  
  const getStatusBadgeClassDS = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'approved':
      case 'active': 
        return 'status-badge-present-ds';
      case 'late': 
        return 'status-badge-late-ds';
      case 'absent':
      case 'rejected':
      case 'inactive': 
        return 'status-badge-absent-ds';
      case 'on_leave':
      case 'pending': 
        return 'status-badge-leave-ds';
      case 'cancelled': 
        return 'status-badge-cancelled-ds';
      default: 
        return 'status-badge-pending-ds';
    }
  };

  const getStatusIconDS = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'approved':
      case 'active': 
        return <CheckCircle size={16} />;
      case 'late': 
        return <AlertCircle size={16} />;
      case 'absent':
      case 'rejected':
      case 'inactive': 
        return <XCircle size={16} />;
      case 'on_leave':
      case 'pending': 
        return <Coffee size={16} />;
      case 'cancelled': 
        return <XCircle size={16} />;
      default: 
        return <Clock size={16} />;
    }
  };

  const getDateFilterLabel = () => {
    switch(dateFilter) {
      case 'today': return 'Today';
      case 'last5': return 'Last 5 Days';
      case 'last15': return 'Last 15 Days';
      case 'last30': return 'Last 30 Days';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  // ========== EVENT HANDLERS ==========
  
  const handleApplyCustomFilter = () => {
    if (customStartDate && customEndDate) {
      filterAttendanceData();
      filterLeaveData();
    }
  };

  const toggleFiltersVisibility = () => {
    setShowFilters(!showFilters);
  };

  const clearAllFilters = () => {
    setDateFilter("today");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // ========== RENDER LOGIC ==========
  
  // Render unauthorized access message
  if (unauthorized) return <h2 className="unauth-ds">Unauthorized - HR Access Only</h2>;
  
  // Render loading spinner
  if (loading && !refreshing) {
    return (
      <div className="dashboard-loading-ds">
        <div className="spinner-ds"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Main render return
  return (
    <div className="dashboard-ds">
      {/* Dashboard Header */}
      <div className="dashboard-header-ds">
        <div className="header-left-ds">
          <p className="dashboard-subtitle-ds">Welcome back, {user?.fullname || 'HR Manager'}</p>
        </div>
        <div className="header-right-ds">
          <button 
            className="toggle-filters-btn-ds"
            onClick={toggleFiltersVisibility}
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            {showFilters ? <EyeOff size={18} /> : <Eye size={18} />}
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          <button 
            className="refresh-btn-ds"
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`refresh-icon-ds ${refreshing ? 'spinning-ds' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert-ds">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Today's Summary Banner */}
      {todaySummary && (
        <div className="today-summary-banner-ds dashboard-card-ds">
          <div className="summary-content-ds">
            <div className="summary-icon-ds">
              <Calendar size={24} />
            </div>
            <div className="summary-details-ds">
              <h3>Today's Attendance Summary ({todaySummary.today})</h3>
              <div className="summary-stats-ds">
                <span className={`summary-stat-ds ${getStatusBadgeClassDS('present')}`}>
                  <CheckCircle size={14} />
                  Present: {todaySummary.summary?.present || 0}
                </span>
                <span className={`summary-stat-ds ${getStatusBadgeClassDS('late')}`}>
                  <AlertCircle size={14} />
                  Late: {todaySummary.summary?.late || 0}
                </span>
                <span className={`summary-stat-ds ${getStatusBadgeClassDS('absent')}`}>
                  <XCircle size={14} />
                  Absent: {todaySummary.summary?.absent || 0}
                </span>
                {todaySummary.summary?.autoMarkedAbsent > 0 && (
                  <span className={`summary-stat-ds ${getStatusBadgeClassDS('absent')}`}>
                    <Clock size={14} />
                    Auto-Marked: {todaySummary.summary?.autoMarkedAbsent || 0}
                  </span>
                )}
                <span className={`summary-stat-ds ${getStatusBadgeClassDS('pending')}`}>
                  <Clock size={14} />
                  Pending Clock Out: {todaySummary.summary?.pendingClockOut || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Date Filter Section */}
      {showFilters && (
        <div className="date-filter-section-ds dashboard-card-ds">
          <div className="filter-header-ds">
            <div className="filter-header-left-ds">
              <Filter size={20} />
              <h3>Date Filters</h3>
            </div>
            <div className="filter-header-right-ds">
              <button 
                className="clear-filters-btn-ds"
                onClick={clearAllFilters}
                title="Clear all filters"
              >
                Clear Filters
              </button>
              <button 
                className="collapse-filters-btn-ds"
                onClick={toggleFiltersVisibility}
                title="Hide filters"
              >
                <ChevronUp size={20} />
              </button>
            </div>
          </div>
          <div className="filter-controls-ds">
            <div className="quick-filters-ds">
              <button 
                className={`quick-filter-btn-ds ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => handleDateFilterChange('today')}
              >
                Today
              </button>
              <button 
                className={`quick-filter-btn-ds ${dateFilter === 'last5' ? 'active' : ''}`}
                onClick={() => handleDateFilterChange('last5')}
              >
                Last 5 Days
              </button>
              <button 
                className={`quick-filter-btn-ds ${dateFilter === 'last15' ? 'active' : ''}`}
                onClick={() => handleDateFilterChange('last15')}
              >
                Last 15 Days
              </button>
              <button 
                className={`quick-filter-btn-ds ${dateFilter === 'last30' ? 'active' : ''}`}
                onClick={() => handleDateFilterChange('last30')}
              >
                Last 30 Days
              </button>
              <button 
                className={`quick-filter-btn-ds ${dateFilter === 'custom' ? 'active' : ''}`}
                onClick={() => handleDateFilterChange('custom')}
              >
                Custom Range
              </button>
            </div>
            
            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="custom-date-range-ds">
                <div className="date-input-group-ds">
                  <label>From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="date-input-ds"
                    max={customEndDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="date-input-group-ds">
                  <label>To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="date-input-ds"
                    min={customStartDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <button 
                  className="apply-custom-filter-ds"
                  onClick={handleApplyCustomFilter}
                  disabled={!customStartDate || !customEndDate}
                >
                  Apply Filter
                </button>
              </div>
            )}
            
            {/* Active Filter Information */}
            <div className="current-filter-info-ds">
              <div className="filter-info-left-ds">
                <span className="filter-label-ds">Active Filter:</span>
                <span className="filter-value-ds">{getDateFilterLabel()}</span>
              </div>
              <div className="filter-info-right-ds">
                <Users size={14} /> {filteredAttendance.length} attendance
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Filters Button (when filters are hidden) */}
      {!showFilters && (
        <div className="show-filters-container-ds">
          <button 
            className="show-filters-btn-ds"
            onClick={toggleFiltersVisibility}
          >
            <ChevronDown size={18} />
            Show Filters
            <span className="current-filter-badge-ds">{getDateFilterLabel()}</span>
          </button>
        </div>
      )}

      {/* Main Statistics Cards */}
      <div className="statistics-cards-ds">
        <div className="stat-card-ds stat-card-employees-ds">
          <div className="stat-icon-ds">
            <Users size={24} />
          </div>
          <div className="stat-content-ds">
            <h3>Total Employees</h3>
            <p className="stat-value-ds">{employeesCount}</p>
            <p className="stat-subtext-ds">Active workforce</p>
          </div>
        </div>
        
        <div className="stat-card-ds stat-card-departments-ds">
          <div className="stat-icon-ds">
            <Building size={24} />
          </div>
          <div className="stat-content-ds">
            <h3>Departments</h3>
            <p className="stat-value-ds">{departmentsCount}</p>
            <p className="stat-subtext-ds">Organizational units</p>
          </div>
        </div>
        
        <div className="stat-card-ds stat-card-documents-ds">
          <div className="stat-icon-ds">
            <FileText size={24} />
          </div>
          <div className="stat-content-ds">
            <h3>Documents</h3>
            <p className="stat-value-ds">{documentsCount}</p>
            <p className="stat-subtext-ds">Policy files & records</p>
          </div>
        </div>
        
        <div className="stat-card-ds stat-card-attendance-ds">
          <div className="stat-icon-ds">
            <Clock size={24} />
          </div>
          <div className="stat-content-ds">
            <h3>Filtered Attendance</h3>
            <p className="stat-value-ds">{filteredAttendance.length}</p>
            <p className="stat-subtext-ds">{getDateFilterLabel()}</p>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Grid */}
      <div className="detailed-stats-grid-ds">
        {/* Attendance Statistics Section - Always render with stats */}
        <div className="stats-section-ds dashboard-card-ds">
          <div className="section-header-ds">
            <div className="section-title-ds">
              <Clock size={20} />
              <h3>Attendance Overview ({getDateFilterLabel()})</h3>
            </div>
            <div className="section-total-ds">
              Total: {attendanceStats?.total || 0}
            </div>
          </div>
          <div className="stats-grid-ds">
            {/* Present Stat */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('present')}`}>
                {getStatusIconDS('present')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Present</span>
                <span className="stat-number-ds">{attendanceStats?.present || 0}</span>
              </div>
            </div>
            
            {/* Late Stat */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('late')}`}>
                {getStatusIconDS('late')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Late</span>
                <span className="stat-number-ds">{attendanceStats?.late || 0}</span>
              </div>
            </div>
            
            {/* Absent Stat */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('absent')}`}>
                {getStatusIconDS('absent')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Absent</span>
                <span className="stat-number-ds">{attendanceStats?.absent || 0}</span>
              </div>
            </div>
            
            {/* Auto-Marked Absent Stat (if any) */}
            {(attendanceStats?.autoAbsent || 0) > 0 && (
              <div className="stat-item-ds">
                <div className={`stat-badge-ds ${getStatusBadgeClassDS('absent')}`}>
                  <Clock size={16} />
                </div>
                <div className="stat-info-ds">
                  <span className="stat-label-ds">Auto-Marked</span>
                  <span className="stat-number-ds">{attendanceStats?.autoAbsent || 0}</span>
                </div>
              </div>
            )}
            
            {/* Manual Absent Stat (if any) */}
            {(attendanceStats?.manualAbsent || 0) > 0 && (
              <div className="stat-item-ds">
                <div className={`stat-badge-ds ${getStatusBadgeClassDS('absent')}`}>
                  <User size={16} />
                </div>
                <div className="stat-info-ds">
                  <span className="stat-label-ds">Manual Absent</span>
                  <span className="stat-number-ds">{attendanceStats?.manualAbsent || 0}</span>
                </div>
              </div>
            )}
            
            {/* Pending Clock Out Stat (today filter only) */}
            {dateFilter === 'today' && (attendanceStats?.pendingClockOut || 0) > 0 && (
              <div className="stat-item-ds">
                <div className={`stat-badge-ds ${getStatusBadgeClassDS('pending')}`}>
                  <Clock size={16} />
                </div>
                <div className="stat-info-ds">
                  <span className="stat-label-ds">Pending Clock Out</span>
                  <span className="stat-number-ds">{attendanceStats?.pendingClockOut || 0}</span>
                </div>
              </div>
            )}
          </div>
          {/* Filter Note */}
          {dateFilter !== 'today' && (attendanceStats?.pendingClockOut || 0) > 0 && (
            <div className="filter-note-ds">
              <small>Note: "Pending Clock Out" only shows for today's records when "Today" filter is selected</small>
            </div>
          )}
        </div>

        {/* Leave Statistics Section - Always render with stats */}
        <div className="stats-section-ds dashboard-card-ds">
          <div className="section-header-ds">
            <div className="section-title-ds">
              <Calendar size={20} />
              <h3>Leave Management ({getDateFilterLabel()})</h3>
            </div>
            <div className="section-total-ds">
              Total: {leaveStats?.total || 0}
            </div>
          </div>
          <div className="stats-grid-ds">
            {/* Pending Leaves */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('pending')}`}>
                {getStatusIconDS('pending')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Pending</span>
                <span className="stat-number-ds">{leaveStats?.pending || 0}</span>
              </div>
            </div>
            
            {/* Approved Leaves */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('approved')}`}>
                {getStatusIconDS('approved')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Approved</span>
                <span className="stat-number-ds">{leaveStats?.approved || 0}</span>
              </div>
            </div>
            
            {/* Rejected Leaves */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('rejected')}`}>
                {getStatusIconDS('rejected')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Rejected</span>
                <span className="stat-number-ds">{leaveStats?.rejected || 0}</span>
              </div>
            </div>
            
            {/* Cancelled Leaves */}
            <div className="stat-item-ds">
              <div className={`stat-badge-ds ${getStatusBadgeClassDS('cancelled')}`}>
                {getStatusIconDS('cancelled')}
              </div>
              <div className="stat-info-ds">
                <span className="stat-label-ds">Cancelled</span>
                <span className="stat-number-ds">{leaveStats?.cancelled || 0}</span>
              </div>
            </div>
            
            {/* Active Leaves Today */}
            {(leaveStats?.activeToday || 0) > 0 && (
              <div className="stat-item-ds">
                <div className={`stat-badge-ds ${getStatusBadgeClassDS('on_leave')}`}>
                  <Coffee size={16} />
                </div>
                <div className="stat-info-ds">
                  <span className="stat-label-ds">Active Today</span>
                  <span className="stat-number-ds">{leaveStats?.activeToday || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;