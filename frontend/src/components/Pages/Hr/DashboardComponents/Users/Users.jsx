import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Hash,
  AlertCircle,
  Check,
  X,
  Loader2,
  Users as UsersIcon,
  AlertTriangle,
  Info,
  Ban,
  Calendar,
  Building,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './Users.css';

const Users = () => {
  // State for users data and loading
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // State for statistics
  const [stats, setStats] = useState({
    total: 0,
    hr: 0,
    hod: 0,
    attendancemanager: 0,
    employee: 0,
    active: 0,
    inactive: 0
  });
  
  // Dialog states for modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Selected user states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [currentError, setCurrentError] = useState({ 
    title: '', 
    message: '', 
    type: 'error' 
  });
  
  // Form state for editing user
  const [editForm, setEditForm] = useState({
    fullname: '',
    email: '',
    role: '',
    status: 'active',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State for showing/hiding filters section
  const [showFilters, setShowFilters] = useState(false);

  // Role options for filtering (matching enum exactly)
  const roles = [
    { value: 'all', label: 'All Roles', icon: UsersIcon, color: 'gray' },
    { value: 'hr', label: 'HR', icon: Shield, color: 'blue' },
    { value: 'hod', label: 'HOD', icon: User, color: 'purple' },
    { value: 'attendancemanager', label: 'Attendance Manager', icon: Calendar, color: 'orange' },
    { value: 'employee', label: 'Employee', icon: Briefcase, color: 'green' }
  ];

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: UsersIcon, color: 'gray' },
    { value: 'active', label: 'Active', icon: CheckCircle, color: 'green' },
    { value: 'inactive', label: 'Inactive', icon: XCircle, color: 'red' }
  ];

  // Enhanced error handler for API calls
  const handleError = (error, customMessage = 'An error occurred') => {
    let title = 'Error';
    let message = customMessage;
    let type = 'error';
    
    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      
      switch(status) {
        case 401:
          title = 'Unauthorized';
          message = 'Your session has expired. Please login again.';
          type = 'warning';
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }, 2000);
          break;
        case 403:
          title = 'Access Denied';
          message = 'You do not have permission to perform this action.';
          type = 'error';
          break;
        case 404:
          title = 'Not Found';
          message = error.response.data?.message || 'The requested resource was not found.';
          type = 'info';
          break;
        case 409:
          title = 'Conflict';
          message = error.response.data?.message || 'A conflict occurred with the current data.';
          type = 'warning';
          break;
        case 500:
          title = 'Server Error';
          message = 'Internal server error. Please try again later.';
          type = 'error';
          break;
        default:
          message = error.response.data?.message || customMessage;
      }
    } else if (error.request) {
      title = 'Network Error';
      message = 'Unable to connect to server. Please check your internet connection.';
      type = 'error';
    } else {
      title = 'Error';
      message = error.message || customMessage;
    }
    
    setCurrentError({ title, message, type });
    setShowErrorModal(true);
  };

  // Success handler - reloads data without showing toast
  const handleSuccess = (message) => {
    fetchAllUsers();
  };

  // Fetch all users from API
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check for authentication token
      if (!token) {
        handleError(new Error('No authentication token found'), 'Please login to continue');
        return;
      }
      
      const response = await axios.get('/api/', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        const fetchedUsers = response.data.data || [];
        setUsers(fetchedUsers);
        
        // Calculate statistics
        const total = fetchedUsers.length;
        const hr = fetchedUsers.filter(u => u.role === 'hr').length;
        const hod = fetchedUsers.filter(u => u.role === 'hod').length;
        const attendancemanager = fetchedUsers.filter(u => u.role === 'attendancemanager').length;
        const employee = fetchedUsers.filter(u => u.role === 'employee').length;
        const active = fetchedUsers.filter(u => u.status === 'active').length;
        const inactive = fetchedUsers.filter(u => u.status === 'inactive').length;
        
        setStats({ total, hr, hod, attendancemanager, employee, active, inactive });
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      handleError(error, 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Apply filters and sorting to users
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = [...users];

    // Apply role filter
    if (filterRole !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === filterRole);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === filterStatus);
    }

    // Apply combined search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.fullname?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        (user.employee?.firstname?.toLowerCase().includes(query)) ||
        (user.employee?.lastname?.toLowerCase().includes(query)) ||
        (user.employee?.employeeCode?.toLowerCase().includes(query)) ||
        (user.employee?.department?.name?.toLowerCase().includes(query))
      );
    }

    // Apply sorting based on selected field and order
    filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case 'name':
          aValue = a.fullname?.toLowerCase() || '';
          bValue = b.fullname?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.fullname?.toLowerCase() || '';
          bValue = b.fullname?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filteredUsers;
  };

  // Fetch and display single user details
  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setShowViewModal(true);
      } else {
        throw new Error(response.data.message || 'Failed to load user details');
      }
    } catch (error) {
      handleError(error, 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with user data
  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      fullname: user.fullname || '',
      email: user.email || '',
      role: user.role || 'employee',
      status: user.status || 'active',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const handleOpenDelete = (user) => {
    const currentUserId = localStorage.getItem('userId');
    
    // Prevent users from deleting their own account
    if (user._id === currentUserId) {
      handleError(new Error('Self deletion'), 'Cannot delete your own account');
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Update user information
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Validate password changes if provided
    if (editForm.newPassword || editForm.confirmPassword) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        handleError(new Error('Password mismatch'), 'New passwords do not match');
        return;
      }
      if (editForm.newPassword.length < 6) {
        handleError(new Error('Password too short'), 'Password must be at least 6 characters long');
        return;
      }
      if (!editForm.currentPassword) {
        handleError(new Error('Current password required'), 'Please enter current password to change password');
        return;
      }
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const updateData = {
        fullname: editForm.fullname,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status
      };
      
      // Include password data if being changed
      if (editForm.currentPassword && editForm.newPassword) {
        updateData.currentPassword = editForm.currentPassword;
        updateData.newPassword = editForm.newPassword;
      }
      
      const response = await axios.put(
        `/api/${selectedUser._id}`,
        updateData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        handleSuccess('User updated successfully');
        setShowEditModal(false);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      handleError(error, 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `/api/${userToDelete._id}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        handleSuccess('User deleted successfully');
        setShowDeleteModal(false);
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      handleError(error, 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Export filtered data to CSV
  const handleExportData = () => {
    try {
      const filteredUsers = getFilteredAndSortedUsers();
      
      // Prepare CSV headers
      const headers = ['Name', 'Email', 'Role', 'Status', 'Employee Code', 'Department', 'Created At'];
      
      // Prepare CSV rows with proper escaping
      const rows = filteredUsers.map(user => [
        `"${user.fullname || ''}"`,
        `"${user.email || ''}"`,
        `"${user.role || ''}"`,
        `"${user.status || ''}"`,
        `"${user.employee?.employeeCode || ''}"`,
        `"${user.employee?.department?.name || ''}"`,
        `"${formatDate(user.createdAt)}"`
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      handleError(error, 'Failed to export data');
    }
  };

  // Get CSS class for role badge color
  const getRoleColor = (role) => {
    switch(role) {
      case 'hr': return 'role-hr-UU';
      case 'hod': return 'role-hod-UU';
      case 'attendancemanager': return 'role-attendancemanager-UU';
      case 'employee': return 'role-employee-UU';
      default: return 'role-default-UU';
    }
  };

  // Get status display configuration
  const getStatusDisplay = (status) => {
    if (status === 'active') {
      return {
        icon: <CheckCircle className="status-icon-UU" />,
        color: 'status-active-UU',
        bg: 'status-bg-active-UU',
        border: 'status-border-active-UU'
      };
    }
    return {
      icon: <XCircle className="status-icon-UU" />,
      color: 'status-inactive-UU',
      bg: 'status-bg-inactive-UU',
      border: 'status-border-inactive-UU'
    };
  };

  // Reset all filters to default values
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
    setFilterStatus('all');
    setSortBy('name');
    setSortOrder('asc');
    setShowFilters(false);
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time to readable string
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get filtered and sorted users
  const filteredUsers = getFilteredAndSortedUsers();

  // Calculate number of active filters for display
  const activeFilterCount = (filterRole !== 'all' ? 1 : 0) + 
                           (filterStatus !== 'all' ? 1 : 0) + 
                           (searchQuery ? 1 : 0);

  return (
    <div className="users-dashboard-UU">
      {/* Top Navigation */}
      <div className="dashboard-header-UU">
        <div className="header-left-UU"></div>
        <div className="header-right-UU">
          {/* Refresh button */}
          <button
            onClick={fetchAllUsers}
            disabled={loading}
            className="refresh-btn-UU"
          >
            <RefreshCw className={`refresh-icon-UU ${loading ? 'spinning-UU' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Export CSV button */}
          <button 
            onClick={handleExportData}
            className="export-btn-UU"
            disabled={loading || filteredUsers.length === 0}
          >
            <Download className="export-icon-UU" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="dashboard-content-UU">
        {/* Statistics Cards */}
        <div className="stats-grid-UU">
          {/* Total Users card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">Total Users</p>
                <h3 className="stat-value-UU">{stats.total}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-total-UU">
                <UsersIcon className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* HR Staff card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">HR Staff</p>
                <h3 className="stat-value-UU">{stats.hr}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-hr-UU">
                <Shield className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* HODs card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">HODs</p>
                <h3 className="stat-value-UU">{stats.hod}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-hod-UU">
                <User className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* Attendance Managers card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">Attendance Managers</p>
                <h3 className="stat-value-UU">{stats.attendancemanager}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-attendancemanager-UU">
                <Calendar className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* Employees card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">Employees</p>
                <h3 className="stat-value-UU">{stats.employee}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-employee-UU">
                <Briefcase className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* Active Users card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">Active Users</p>
                <h3 className="stat-value-UU">{stats.active}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-active-UU">
                <CheckCircle className="icon-medium-UU" />
              </div>
            </div>
          </div>

          {/* Inactive Users card */}
          <div className="stat-card-UU">
            <div className="stat-content-UU">
              <div>
                <p className="stat-label-UU">Inactive Users</p>
                <h3 className="stat-value-UU">{stats.inactive}</h3>
              </div>
              <div className="stat-icon-UU stat-icon-inactive-UU">
                <Ban className="icon-medium-UU" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section-UU">
          <div className="filter-section-UU">
            {/* Search input */}
            <div className="search-container-UU">
              <div className="search-input-group-UU">
                <Search className="search-icon-UU" />
                <input
                  type="text"
                  placeholder="Search users by name, email, employee code, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-UU"
                  disabled={loading}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="clear-search-btn-UU"
                  >
                    <X className="clear-icon-UU" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle-btn-UU"
              disabled={loading}
            >
              <Filter className="filter-toggle-icon-UU" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeFilterCount > 0 && (
                <span className="active-filter-count-UU">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Filter Controls (shown when toggled) */}
          {showFilters && (
            <div className="filter-controls-UU">
              {/* Role filter */}
              <div className="filter-group-UU">
                <label className="filter-label-UU">
                  <Shield className="filter-label-icon-UU" />
                  Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="filter-select-UU"
                  disabled={loading}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="filter-group-UU">
                <label className="filter-label-UU">
                  <CheckCircle className="filter-label-icon-UU" />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select-UU"
                  disabled={loading}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort controls */}
              <div className="filter-group-UU">
                <label className="filter-label-UU">
                  <ChevronUp className="filter-label-icon-UU" />
                  Sort By
                </label>
                <div className="sort-controls-UU">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select-UU"
                    disabled={loading}
                  >
                    <option value="name">Name</option>
                    <option value="role">Role</option>
                    <option value="status">Status</option>
                    <option value="createdAt">Date Created</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="sort-order-btn-UU"
                    disabled={loading}
                  >
                    {sortOrder === 'asc' ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
              </div>

              {/* Filter actions */}
              <div className="filter-actions-UU">
                <button
                  onClick={handleResetFilters}
                  disabled={loading}
                  className="clear-filters-btn-UU"
                >
                  <X className="clear-filters-icon-UU" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="results-summary-UU">
            <span className="results-count-UU">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            {activeFilterCount > 0 && (
              <span className="active-filters-UU">
                <Filter className="active-filters-icon-UU" />
                Filters active: 
                {filterRole !== 'all' && ` ${filterRole.toUpperCase()}`}
                {filterStatus !== 'all' && ` • ${filterStatus}`}
                {searchQuery && ` • Search: "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container-UU">
          <div className="table-header-UU">
            <h2 className="table-title-UU">Users List</h2>
            <div className="table-count-UU">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </div>
          </div>

          {loading ? (
            // Loading state
            <div className="loading-container-UU">
              <Loader2 className="loading-spinner-UU" />
              <p className="loading-text-UU">Loading users...</p>
              <p className="loading-subtext-UU">Please wait while we fetch the data</p>
            </div>
          ) : (
            <div className="table-wrapper-UU">
              {filteredUsers.length > 0 ? (
                // Users table
                <table className="users-table-UU">
                  <thead>
                    <tr className="table-header-row-UU">
                      <th className="table-header-cell-UU">User</th>
                      <th className="table-header-cell-UU">Role</th>
                      <th className="table-header-cell-UU">Email</th>
                      <th className="table-header-cell-UU">Status</th>
                      <th className="table-header-cell-UU">Employee Code</th>
                      <th className="table-header-cell-UU">Created</th>
                      <th className="table-header-cell-UU">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const statusDisplay = getStatusDisplay(user.status);
                      return (
                        <tr key={user._id} className="table-row-UU">
                          <td className="table-cell-UU">
                            <div className="user-info-UU">
                              <div className="user-avatar-UU">
                                <User className="avatar-icon-UU" />
                              </div>
                              <div className="user-details-UU">
                                <div className="user-name-UU">{user.fullname}</div>
                                {user.employee?.department && (
                                  <div className="user-department-UU">
                                    {user.employee.department.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="table-cell-UU">
                            <span className={`role-badge-UU ${getRoleColor(user.role)}`}>
                              {user.role === 'attendancemanager' ? 'ATTENDANCE MANAGER' : user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="table-cell-UU">
                            <div className="email-cell-UU">
                              <Mail className="email-icon-UU" />
                              <span className="email-text-UU">{user.email}</span>
                            </div>
                          </td>
                          <td className="table-cell-UU">
                            <div className={`status-badge-UU ${statusDisplay.bg} ${statusDisplay.border}`}>
                              {statusDisplay.icon}
                              <span className={`status-text-UU ${statusDisplay.color}`}>
                                {user.status}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell-UU">
                            {user.employee?.employeeCode ? (
                              <span className="employee-code-badge-UU">
                                <Hash className="code-icon-UU" />
                                {user.employee.employeeCode}
                              </span>
                            ) : (
                              <span className="no-code-UU">—</span>
                            )}
                          </td>
                          <td className="table-cell-UU">
                            <div className="created-date-UU">
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="table-cell-UU">
                            <div className="action-buttons-UU">
                              {/* View button */}
                              <button
                                onClick={() => handleViewUser(user._id)}
                                disabled={loading}
                                className="action-btn-UU view-btn-UU"
                                title="View Details"
                              >
                                <Eye className="action-icon-UU" />
                              </button>
                              {/* Edit button */}
                              <button
                                onClick={() => handleOpenEdit(user)}
                                disabled={loading}
                                className="action-btn-UU edit-btn-UU"
                                title="Edit User"
                              >
                                <Edit className="action-icon-UU" />
                              </button>
                              {/* Delete button */}
                              <button
                                onClick={() => handleOpenDelete(user)}
                                disabled={loading || user._id === localStorage.getItem('userId')}
                                className="action-btn-UU delete-btn-UU"
                                title={user._id === localStorage.getItem('userId') 
                                  ? "Cannot delete your own account" 
                                  : "Delete User"}
                              >
                                <Trash2 className="action-icon-UU" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                // No results state
                <div className="no-results-UU">
                  <div className="no-results-content-UU">
                    <UsersIcon className="no-results-icon-UU" />
                    <h3 className="no-results-title-UU">No users found</h3>
                    <p className="no-results-text-UU">Try adjusting your search or filter criteria</p>
                    <button
                      onClick={handleResetFilters}
                      className="reset-filters-btn-UU"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay-UU">
          <div className="modal-container-UU view-modal-UU">
            <div className="modal-header-UU">
              <h3 className="modal-title-UU">User Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="modal-close-btn-UU"
                disabled={loading}
              >
                <X className="close-icon-UU" />
              </button>
            </div>
            
            <div className="modal-body-UU">
              <div className="user-profile-header-UU">
                <div className="user-profile-avatar-UU">
                  <User className="profile-avatar-icon-UU" />
                </div>
                <div className="user-profile-info-UU">
                  <h4 className="profile-name-UU">{selectedUser.fullname}</h4>
                  <div className="profile-badges-UU">
                    <span className={`role-badge-UU ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role === 'attendancemanager' 
                        ? 'ATTENDANCE MANAGER' 
                        : selectedUser.role.toUpperCase()}
                    </span>
                    <span className={`status-badge-UU ${getStatusDisplay(selectedUser.status).bg} ${getStatusDisplay(selectedUser.status).border}`}>
                      {getStatusDisplay(selectedUser.status).icon}
                      <span className={`status-text-UU ${getStatusDisplay(selectedUser.status).color}`}>
                        {selectedUser.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-details-grid-UU">
                <div className="details-column-UU">
                  <div className="detail-item-UU">
                    <label className="detail-label-UU">Email</label>
                    <div className="detail-value-UU">
                      <Mail className="detail-icon-UU" />
                      <span>{selectedUser.email}</span>
                    </div>
                  </div>
                  
                  {selectedUser.employee?.employeeCode && (
                    <div className="detail-item-UU">
                      <label className="detail-label-UU">Employee Code</label>
                      <div className="detail-value-UU">
                        <Hash className="detail-icon-UU" />
                        <span>{selectedUser.employee.employeeCode}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.createdAt && (
                    <div className="detail-item-UU">
                      <label className="detail-label-UU">Account Created</label>
                      <div className="detail-value-UU">
                        <Calendar className="detail-icon-UU" />
                        {formatDateTime(selectedUser.createdAt)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="details-column-UU">
                  {selectedUser.employee?.phone && (
                    <div className="detail-item-UU">
                      <label className="detail-label-UU">Phone</label>
                      <div className="detail-value-UU">
                        <Phone className="detail-icon-UU" />
                        <span>{selectedUser.employee.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.employee?.department && (
                    <div className="detail-item-UU">
                      <label className="detail-label-UU">Department</label>
                      <div className="detail-value-UU">
                        <Building className="detail-icon-UU" />
                        <span>{selectedUser.employee.department.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.updatedAt && (
                    <div className="detail-item-UU">
                      <label className="detail-label-UU">Last Updated</label>
                      <div className="detail-value-UU">
                        <Calendar className="detail-icon-UU" />
                        {formatDateTime(selectedUser.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay-UU">
          <div className="modal-container-UU edit-modal-UU">
            <div className="modal-header-UU">
              <h3 className="modal-title-UU">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close-btn-UU"
                disabled={loading}
              >
                <X className="close-icon-UU" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body-UU">
                <div className="form-group-UU">
                  <label className="form-label-UU">Full Name *</label>
                  <input
                    type="text"
                    value={editForm.fullname}
                    onChange={(e) => setEditForm({...editForm, fullname: e.target.value})}
                    className="form-input-UU"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group-UU">
                  <label className="form-label-UU">Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="form-input-UU"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group-UU">
                  <label className="form-label-UU">Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="form-select-UU"
                    required
                    disabled={loading}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="hod">HOD</option>
                    <option value="attendancemanager">Attendance Manager</option>
                  </select>
                </div>
                
                <div className="form-group-UU">
                  <label className="form-label-UU">Status *</label>
                  <div className="radio-group-UU">
                    <label className="radio-label-UU">
                      <input
                        type="radio"
                        value="active"
                        checked={editForm.status === 'active'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="radio-input-UU"
                        disabled={loading}
                      />
                      <span className="radio-text-UU">Active</span>
                    </label>
                    <label className="radio-label-UU">
                      <input
                        type="radio"
                        value="inactive"
                        checked={editForm.status === 'inactive'}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="radio-input-UU"
                        disabled={loading}
                      />
                      <span className="radio-text-UU">Inactive</span>
                    </label>
                  </div>
                </div>
                
                {/* Password Change Section */}
                <div className="password-section-UU">
                  <h4 className="section-title-UU">Change Password (Optional)</h4>
                  
                  <div className="password-fields-UU">
                    <div className="form-group-UU">
                      <label className="form-label-UU">Current Password</label>
                      <input
                        type="password"
                        value={editForm.currentPassword}
                        onChange={(e) => setEditForm({...editForm, currentPassword: e.target.value})}
                        className="form-input-UU"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group-UU">
                      <label className="form-label-UU">New Password</label>
                      <input
                        type="password"
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({...editForm, newPassword: e.target.value})}
                        className="form-input-UU"
                        disabled={loading}
                      />
                      <p className="input-hint-UU">Minimum 6 characters</p>
                    </div>
                    
                    <div className="form-group-UU">
                      <label className="form-label-UU">Confirm New Password</label>
                      <input
                        type="password"
                        value={editForm.confirmPassword}
                        onChange={(e) => setEditForm({...editForm, confirmPassword: e.target.value})}
                        className="form-input-UU"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer-UU">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="cancel-btn-UU"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="update-btn-UU"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading-UU">
                      <Loader2 className="btn-spinner-UU" />
                      Updating...
                    </span>
                  ) : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay-UU">
          <div className="modal-container-UU delete-modal-UU">
            <div className="modal-header-UU">
              <h3 className="modal-title-UU">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-close-btn-UU"
                disabled={loading}
              >
                <X className="close-icon-UU" />
              </button>
            </div>
            
            <div className="modal-body-UU">
              <div className="delete-icon-container-UU">
                <div className="delete-icon-wrapper-UU">
                  <AlertCircle className="delete-icon-UU" />
                </div>
              </div>
              
              <p className="delete-message-UU">
                Are you sure you want to delete this user?
              </p>
              <div className="delete-user-info-UU">
                <p className="delete-user-name-UU">{userToDelete.fullname}</p>
                <p className="delete-user-email-UU">{userToDelete.email}</p>
              </div>
              
              <p className="delete-warning-UU">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              
              <div className="modal-footer-UU">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="cancel-btn-UU"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="delete-confirm-btn-UU"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-loading-UU">
                      <Loader2 className="btn-spinner-UU" />
                      Deleting...
                    </span>
                  ) : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay-UU">
          <div className="modal-container-UU error-modal-UU">
            <div className={`modal-header-UU ${currentError.type}`}>
              <div className="error-header-content-UU">
                <div className="error-icon-wrapper-UU">
                  {currentError.type === 'error' && <AlertCircle className="error-icon-UU" />}
                  {currentError.type === 'warning' && <AlertTriangle className="error-icon-UU" />}
                  {currentError.type === 'info' && <Info className="error-icon-UU" />}
                  <h3 className="modal-title-UU">{currentError.title}</h3>
                </div>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="modal-close-btn-UU"
                >
                  <X className="close-icon-UU" />
                </button>
              </div>
            </div>
            
            <div className="modal-body-UU">
              <p className="error-message-UU">{currentError.message}</p>
              
              <div className="modal-footer-UU">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className={`ok-btn-UU ${currentError.type}`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;