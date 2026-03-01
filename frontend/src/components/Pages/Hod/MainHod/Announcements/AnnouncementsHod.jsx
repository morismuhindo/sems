
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Plus, Pencil, Trash2, Search, Filter,
  Calendar, X, CheckCircle, AlertTriangle, AlertCircle,
  Eye, User, Building, FileText,
  RefreshCw, Clock as ClockIcon, User as UserIcon, AlertOctagon
} from 'lucide-react';
import './Announcements.css';

const AnnouncementsHod = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingHOD, setLoadingHOD] = useState(true);
  const [errorHOD, setErrorHOD] = useState('');
  const [successHOD, setSuccessHOD] = useState('');
  
  const [searchTermHOD, setSearchTermHOD] = useState('');
  const [typeFilterHOD, setTypeFilterHOD] = useState('all');
  const [priorityFilterHOD, setPriorityFilterHOD] = useState('all');
  
  const [showModalHOD, setShowModalHOD] = useState(false);
  const [modalTypeHOD, setModalTypeHOD] = useState('add');
  const [currentAnnouncementHOD, setCurrentAnnouncementHOD] = useState(null);
  const [uploadingHOD, setUploadingHOD] = useState(false);
  
  const [showDeleteConfirmHOD, setShowDeleteConfirmHOD] = useState(false);
  const [announcementToDeleteHOD, setAnnouncementToDeleteHOD] = useState(null);
  
  const [sortConfigHOD, setSortConfigHOD] = useState({ key: 'createdAt', direction: 'desc' });
  
  const [modalErrorHOD, setModalErrorHOD] = useState('');
  const [modalSuccessHOD, setModalSuccessHOD] = useState('');

  const [formDataHOD, setFormDataHOD] = useState({
    title: '',
    content: '',
    priority: 'medium',
    department: '',
    status: 'active'
  });

  // User state from LeaveHod logic
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [userDepartmentId, setUserDepartmentId] = useState(null);
  const [userDepartmentName, setUserDepartmentName] = useState('');

  const priorityOptionsHOD = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  // Get current user info - Updated with LeaveHod logic
  useEffect(() => {
    fetchUserData();
    checkAuthorizationHOD();
    fetchAnnouncementsHOD();
  }, []);

  // Fetch user data like in LeaveHod
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return null;
      }
      
      const response = await axios.get('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        const user = response.data.data;
        setUserData(user);
        
        if (user.employee) {
          setEmployeeData(user.employee);
          
          // Get department ID from employee
          if (user.employee.department) {
            let deptId = null;
            let deptName = null;
            
            if (typeof user.employee.department === 'object') {
              deptId = user.employee.department._id;
              deptName = user.employee.department.name;
            } else {
              deptId = user.employee.department;
              // We'll get the name from fetchDepartmentsHOD
            }
            
            setUserDepartmentId(deptId);
            if (deptName) {
              setUserDepartmentName(deptName);
            }
            
            // Set department in form data for new announcements
            setFormDataHOD(prev => ({
              ...prev,
              department: deptId
            }));
          }
        }
        else if (user.department) {
          // Fallback to user.department if employee.department not available
          let deptId = null;
          let deptName = null;
          
          if (typeof user.department === 'object') {
            deptId = user.department._id;
            deptName = user.department.name;
          } else {
            deptId = user.department;
          }
          
          setUserDepartmentId(deptId);
          if (deptName) {
            setUserDepartmentName(deptName);
          }
          
          setFormDataHOD(prev => ({
            ...prev,
            department: deptId
          }));
        }
        
        localStorage.setItem('userData', JSON.stringify(user));
        return user;
      }
    } catch (err) {
      // Fallback to localStorage if API fails
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (storedUserData && Object.keys(storedUserData).length > 0) {
        setUserData(storedUserData);
        if (storedUserData.employee) {
          setEmployeeData(storedUserData.employee);
        }
        
        // Get department from stored data
        const userDept = storedUserData.employee?.department || storedUserData.department;
        if (userDept) {
          let deptId = null;
          let deptName = null;
          
          if (typeof userDept === 'object') {
            deptId = userDept._id;
            deptName = userDept.name;
          } else {
            deptId = userDept;
          }
          
          setUserDepartmentId(deptId);
          if (deptName) {
            setUserDepartmentName(deptName);
          }
          
          setFormDataHOD(prev => ({
            ...prev,
            department: deptId
          }));
        }
        return storedUserData;
      }
    }
    return null;
  };

  // Fetch departments to get department names
  const fetchDepartmentsHOD = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/depart/Departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let deptsArray = [];
      
      if (Array.isArray(response.data)) {
        deptsArray = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        deptsArray = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        deptsArray = response.data.data;
      } else if (response.data && typeof response.data.data === 'object') {
        deptsArray = Object.values(response.data.data);
      }
      
      setDepartments(deptsArray || []);
      
      // Update department name if we only have ID
      if (userDepartmentId && !userDepartmentName) {
        const foundDept = deptsArray.find(d => 
          d._id === userDepartmentId || 
          d.departmentId === userDepartmentId
        );
        if (foundDept) {
          setUserDepartmentName(foundDept.name);
        }
      }
      
      return deptsArray;
    } catch (err) {
      setDepartments([]);
      return [];
    }
  };

  // Get department name for display
  const getUserDepartmentName = () => {
    if (userDepartmentName) {
      return userDepartmentName;
    }
    
    if (employeeData && employeeData.department) {
      if (typeof employeeData.department === 'object') {
        return employeeData.department.name || 'N/A';
      }
      
      // Try to find from departments array
      const foundDept = departments.find(d => 
        d._id === employeeData.department || 
        d.departmentId === employeeData.department
      );
      return foundDept?.name || 'N/A';
    }
    
    if (userData && userData.department) {
      if (typeof userData.department === 'object') {
        return userData.department.name || 'N/A';
      }
      
      const foundDept = departments.find(d => 
        d._id === userData.department || 
        d.departmentId === userData.department
      );
      return foundDept?.name || 'N/A';
    }
    
    return 'N/A';
  };

  // Get HOD's full name
  const getUserFullName = () => {
    if (employeeData) {
      if (employeeData.firstname && employeeData.lastname) {
        return `${employeeData.firstname} ${employeeData.lastname}`;
      }
    }
    
    if (userData) {
      if (userData.fullname) {
        return userData.fullname;
      }
      
      if (userData.firstname && userData.lastname) {
        return `${userData.firstname} ${userData.lastname}`;
      }
      
      if (userData.email) {
        return userData.email.split('@')[0];
      }
    }
    
    return 'HOD User';
  };

  useEffect(() => {
    let timer;
    if (modalErrorHOD) {
      timer = setTimeout(() => {
        setModalErrorHOD('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [modalErrorHOD]);

  useEffect(() => {
    let timer;
    if (modalSuccessHOD) {
      timer = setTimeout(() => {
        setModalSuccessHOD('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [modalSuccessHOD]);

  const checkAuthorizationHOD = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || (user.role.toLowerCase() !== 'hod' && user.role.toLowerCase() !== 'hr')) {
      setErrorHOD('Unauthorized access. Only HOD or HR personnel can access this page.');
      setLoadingHOD(false);
      return false;
    }
    return true;
  };

  const fetchAnnouncementsHOD = async () => {
    try {
      setLoadingHOD(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/announcement/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let announcementsArray = [];
      if (Array.isArray(response.data)) {
        announcementsArray = response.data;
      } else if (response.data && response.data.data) {
        announcementsArray = Array.isArray(response.data.data) ? response.data.data : Object.values(response.data.data);
      } else if (response.data && response.data.success && response.data.data) {
        announcementsArray = Array.isArray(response.data.data) ? response.data.data : Object.values(response.data.data);
      }
      
      setAnnouncements(announcementsArray || []);
      setErrorHOD('');
      
      // Fetch departments after announcements
      await fetchDepartmentsHOD();
    } catch (err) {
      setErrorHOD('Failed to load announcements. Please try again.');
    } finally {
      setLoadingHOD(false);
    }
  };

  const handleSearchHOD = (e) => {
    setSearchTermHOD(e.target.value);
  };

  const handleSortHOD = (key) => {
    let direction = 'asc';
    if (sortConfigHOD.key === key && sortConfigHOD.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigHOD({ key, direction });
  };

  const findDepartmentById = (id) => {
    if (!id) return null;
    
    return departments.find(d => 
      d._id === id || 
      d.departmentId === id ||
      (d._id && d._id.toString() === id.toString())
    );
  };

  const getDepartmentName = (announcement) => {
    if (!announcement) return 'N/A';
    
    if (announcement.isSystemWide) {
      return 'System-wide';
    }
    
    if (announcement.department && typeof announcement.department === 'object') {
      if (announcement.department.name) {
        return announcement.department.name;
      }
      
      if (announcement.department._id) {
        const foundDept = findDepartmentById(announcement.department._id);
        return foundDept?.name || 'N/A';
      }
    }
    
    if (typeof announcement.department === 'string' && announcement.department.trim()) {
      const foundDept = findDepartmentById(announcement.department);
      return foundDept?.name || 'N/A';
    }
    
    if (announcement.departmentId && typeof announcement.departmentId === 'string' && announcement.departmentId.trim()) {
      const foundDept = findDepartmentById(announcement.departmentId);
      return foundDept?.name || 'N/A';
    }
    
    return 'No Department Assigned';
  };

  // Filter announcements for HOD: only their department's announcements and system-wide
  const getFilteredAnnouncements = () => {
    let filtered = announcements;
    
    // Show system-wide AND announcements from HOD's department
    if (userDepartmentId) {
      filtered = announcements.filter(announcement => {
        const isSystemWide = announcement.isSystemWide;
        const isUserDepartment = announcement.department?._id === userDepartmentId || 
                                 announcement.department === userDepartmentId ||
                                 announcement.departmentId === userDepartmentId;
        
        return isSystemWide || isUserDepartment;
      });
    }
    
    // Apply search filter
    if (searchTermHOD) {
      filtered = filtered.filter(announcement => 
        announcement.title?.toLowerCase().includes(searchTermHOD.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchTermHOD.toLowerCase()) ||
        announcement.author?.name?.toLowerCase().includes(searchTermHOD.toLowerCase()) ||
        getDepartmentName(announcement)?.toLowerCase().includes(searchTermHOD.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilterHOD !== 'all') {
      filtered = filtered.filter(announcement => 
        (typeFilterHOD === 'system' && announcement.isSystemWide) ||
        (typeFilterHOD === 'department' && !announcement.isSystemWide)
      );
    }
    
    // Apply priority filter
    if (priorityFilterHOD !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilterHOD);
    }
    
    return filtered;
  };

  const filteredAnnouncementsHOD = getFilteredAnnouncements();

  const sortedAnnouncementsHOD = [...filteredAnnouncementsHOD].sort((a, b) => {
    if (sortConfigHOD.key) {
      const aValue = a[sortConfigHOD.key];
      const bValue = b[sortConfigHOD.key];
      
      if (aValue < bValue) {
        return sortConfigHOD.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfigHOD.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const handleInputChangeHOD = (e) => {
    const { name, value } = e.target;
    setFormDataHOD(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitHOD = async (e) => {
    e.preventDefault();
    setUploadingHOD(true);
    setModalErrorHOD('');
    setModalSuccessHOD('');

    try {
      const token = localStorage.getItem('token');
      
      // Use HOD's department ID from state
      if (!userDepartmentId) {
        setModalErrorHOD('Unable to determine your department. Please try again.');
        setUploadingHOD(false);
        return;
      }
      
      const submissionData = {
        title: formDataHOD.title.trim(),
        content: formDataHOD.content.trim(),
        priority: formDataHOD.priority,
        department: userDepartmentId // Always use HOD's department
      };

      if (modalTypeHOD === 'edit') {
        // Check if HOD can edit this announcement
        if (currentAnnouncementHOD.author?._id !== userData?._id && currentAnnouncementHOD.author !== userData?._id) {
          setModalErrorHOD('You can only edit announcements created by you');
          setUploadingHOD(false);
          return;
        }
        
        await axios.put(`/api/announcement/${currentAnnouncementHOD._id}`, submissionData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalSuccessHOD('Announcement updated successfully!');
        
        setTimeout(() => {
          setShowModalHOD(false);
          resetFormHOD();
          fetchAnnouncementsHOD();
        }, 1500);
      } else {
        // HOD can only create department announcements
        await axios.post('/api/announcement/hod', submissionData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalSuccessHOD('Announcement created successfully!');
        
        setTimeout(() => {
          setShowModalHOD(false);
          resetFormHOD();
          fetchAnnouncementsHOD();
        }, 1500);
      }
    } catch (err) {
      setModalErrorHOD(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setUploadingHOD(false);
    }
  };

  const openAddModalHOD = () => {
    resetFormHOD();
    // Auto-set department to HOD's department
    if (userDepartmentId) {
      setFormDataHOD(prev => ({
        ...prev,
        department: userDepartmentId
      }));
    }
    setModalTypeHOD('add');
    setShowModalHOD(true);
    setModalErrorHOD('');
    setModalSuccessHOD('');
  };

  const openEditModalHOD = (announcement) => {
    // Check if HOD can edit this announcement
    if (announcement.author?._id !== userData?._id && announcement.author !== userData?._id) {
      setErrorHOD('You can only edit announcements created by you');
      return;
    }
    
    let departmentId = '';
    if (announcement.department?._id) {
      departmentId = announcement.department._id;
    } else if (announcement.department && typeof announcement.department === 'string') {
      departmentId = announcement.department;
    } else if (announcement.departmentId) {
      departmentId = announcement.departmentId;
    }
    
    setFormDataHOD({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'medium',
      department: departmentId || userDepartmentId || '',
      status: announcement.status || 'active'
    });
    setCurrentAnnouncementHOD(announcement);
    setModalTypeHOD('edit');
    setShowModalHOD(true);
    setModalErrorHOD('');
    setModalSuccessHOD('');
  };

  const openViewModalHOD = (announcement) => {
    setFormDataHOD({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'medium',
      department: announcement.department?._id || announcement.department || announcement.departmentId || '',
      status: announcement.status || 'active'
    });
    setCurrentAnnouncementHOD(announcement);
    setModalTypeHOD('view');
    setShowModalHOD(true);
    setModalErrorHOD('');
    setModalSuccessHOD('');
  };

  const handleDeleteHOD = (announcement) => {
    // Check if HOD can delete this announcement
    if (announcement.author?._id !== userData?._id && announcement.author !== userData?._id) {
      setErrorHOD('You can only delete announcements created by you');
      return;
    }
    
    setAnnouncementToDeleteHOD(announcement);
    setShowDeleteConfirmHOD(true);
    setModalErrorHOD('');
    setModalSuccessHOD('');
  };

  const confirmDeleteHOD = async () => {
    if (!announcementToDeleteHOD) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/announcement/${announcementToDeleteHOD._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessHOD('Announcement deleted successfully!');
      setShowDeleteConfirmHOD(false);
      setAnnouncementToDeleteHOD(null);
      fetchAnnouncementsHOD();
      
      setTimeout(() => {
        setSuccessHOD('');
      }, 3000);
    } catch (err) {
      setErrorHOD(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const resetFormHOD = () => {
    setFormDataHOD({
      title: '',
      content: '',
      priority: 'medium',
      department: userDepartmentId || '',
      status: 'active'
    });
    setCurrentAnnouncementHOD(null);
  };

  const clearFiltersHOD = () => {
    setSearchTermHOD('');
    setTypeFilterHOD('all');
    setPriorityFilterHOD('all');
  };

  const getPriorityBadgeHOD = (priority) => {
    const priorityMap = {
      high: { className: 'priority-badge-highHOD', icon: <AlertCircle size={14} /> },
      medium: { className: 'priority-badge-mediumHOD', icon: <AlertTriangle size={14} /> },
      low: { className: 'priority-badge-lowHOD', icon: <CheckCircle size={14} /> }
    };
    
    const priorityInfo = priorityMap[priority] || priorityMap.medium;
    
    return (
      <span className={`priority-badgeHOD ${priorityInfo.className}`}>
        {priorityInfo.icon}
        <span className="ml-1HOD capitalize">{priority}</span>
      </span>
    );
  };

  const getTypeBadgeHOD = (isSystemWide) => {
    return (
      <span className={`type-badgeHOD ${isSystemWide ? 'type-badge-systemHOD' : 'type-badge-departmentHOD'}`}>
        {isSystemWide ? <User size={14} /> : <Building size={14} />}
        <span className="ml-1HOD">
          {isSystemWide ? 'System-wide' : 'Department'}
        </span>
      </span>
    );
  };

  const formatDateHOD = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTimeHOD = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeModalHOD = () => {
    setShowModalHOD(false);
    resetFormHOD();
    setModalErrorHOD('');
    setModalSuccessHOD('');
  };

  const getDepartmentNameForView = () => {
    if (!formDataHOD.department) {
      return 'No Department Assigned';
    }
    
    const foundDept = findDepartmentById(formDataHOD.department);
    return foundDept?.name || 'No Department Assigned';
  };

  // Check if current user is author of announcement
  const isAuthor = (announcement) => {
    return announcement.author?._id === userData?._id || announcement.author === userData?._id;
  };

  if (loadingHOD && announcements.length === 0) {
    return (
      <div className="announcements-containerHOD">
        <div className="loading-spinnerHOD">Loading announcements...</div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthorized = user.role && (user.role.toLowerCase() === 'hod' || user.role.toLowerCase() === 'hr');

  if (!isAuthorized) {
    return (
      <div className="announcements-containerHOD">
        <div className="unauthorized-messageHOD">
          <AlertCircle size={48} />
          <h2>Unauthorized Access</h2>
          <p>Only HOD or HR personnel can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-containerHOD">
      {/* Welcome Header for HOD */}
      <div className="dashboard-headerHOD">
        <div className="hod-welcomeHOD">
          <h2><Bell size={24} /> Announcements Dashboard</h2>
          <p className="welcome-subtitleHOD">
            {getUserFullName()} - HOD  {getUserDepartmentName()} Department
          </p>
        </div>
        <div className="header-actionsHOD">
          <button 
            className="btn-primaryHOD"
            onClick={openAddModalHOD}
            type="button"
            title="Create departmental announcement"
          >
            <Plus size={18} /> 
            Add
          </button>
        </div>
      </div>

      {errorHOD && <div className="errorHOD">{errorHOD}</div>}
      {successHOD && <div className="successHOD">{successHOD}</div>}

      {/* Filters Section */}
      <div className="filters-sectionHOD">
        <div className="filters-gridHOD">
          <div className="filter-groupHOD">
            <label><Filter size={16} /> Type</label>
            <select 
              value={typeFilterHOD}
              onChange={(e) => setTypeFilterHOD(e.target.value)}
              className="filter-selectHOD"
            >
              <option value="all">All Types</option>
              <option value="system">System-wide</option>
              <option value="department">Department</option>
            </select>
          </div>

          <div className="filter-groupHOD">
            <label><AlertTriangle size={16} /> Priority</label>
            <select 
              value={priorityFilterHOD}
              onChange={(e) => setPriorityFilterHOD(e.target.value)}
              className="filter-selectHOD"
            >
              <option value="all">All Priorities</option>
              {priorityOptionsHOD.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupHOD search-groupHOD">
            <label><Search size={16} /> Search</label>
            <input
              type="text"
              className="search-inputHOD"
              placeholder="Search announcements..."
              value={searchTermHOD}
              onChange={handleSearchHOD}
              autoComplete="off"
            />
            {searchTermHOD && (
              <button className="clear-search-btnHOD" onClick={() => setSearchTermHOD('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-actionsHOD">
          <button onClick={clearFiltersHOD} className="btn-clearHOD" type="button">
            Clear Filters
          </button>
          <button onClick={() => { 
            fetchAnnouncementsHOD(); 
          }} className="btn-refreshHOD" type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summaryHOD">
        <div className="results-countHOD">
          <span className="results-count-numberHOD">{filteredAnnouncementsHOD.length}</span>
          <span className="results-count-textHOD">announcements found</span>
          {searchTermHOD && (
            <span className="filter-textHOD">
              filtered by: "{searchTermHOD}"
            </span>
          )}
          {typeFilterHOD !== 'all' && (
            <span className="filter-textHOD">
              • Type: {typeFilterHOD}
            </span>
          )}
          {priorityFilterHOD !== 'all' && (
            <span className="filter-textHOD">
              • Priority: {priorityFilterHOD}
            </span>
          )}
          {userDepartmentId && (
            <span className="filter-textHOD">
              • Showing: System-wide & {getUserDepartmentName()} Department
            </span>
          )}
        </div>
      </div>

      {/* Announcements Cards Grid */}
      <div className="announcements-gridHOD">
        {sortedAnnouncementsHOD.length > 0 ? (
          sortedAnnouncementsHOD.map((announcement) => (
            <div key={announcement._id} className="announcement-cardHOD">
              <div className="card-headerHOD">
                <div className="card-header-leftHOD">
                  {getPriorityBadgeHOD(announcement.priority)}
                  {getTypeBadgeHOD(announcement.isSystemWide)}
                  {isAuthor(announcement) && !announcement.isSystemWide && (
                    <span className="author-badgeHOD">
                      <UserIcon size={12} />
                      <span>Your Post</span>
                    </span>
                  )}
                </div>
                <div className="card-header-rightHOD">
                  <div className="card-actionsHOD">
                    <button 
                      className="action-btnHOD view-btnHOD"
                      onClick={() => openViewModalHOD(announcement)}
                      title="View Details"
                      type="button"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* Only show edit/delete for announcements created by this HOD */}
                    {isAuthor(announcement) && !announcement.isSystemWide && (
                      <>
                        <button 
                          className="action-btnHOD edit-btnHOD"
                          onClick={() => openEditModalHOD(announcement)}
                          title="Edit Announcement"
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="action-btnHOD delete-btnHOD"
                          onClick={() => handleDeleteHOD(announcement)}
                          title="Delete Announcement"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-titleHOD">
                <FileText size={18} />
                <h3 title={announcement.title}>{announcement.title}</h3>
              </div>

              <div className="card-contentHOD">
                <p>{announcement.content.substring(0, 150)}...</p>
                {announcement.content.length > 150 && (
                  <button 
                    className="read-moreHOD"
                    onClick={() => openViewModalHOD(announcement)}
                    type="button"
                  >
                    Read more
                  </button>
                )}
              </div>

              <div className="card-footerHOD">
                <div className="footer-infoHOD">
                  <div className="footer-itemHOD">
                    <Building size={14} />
                    <span>{getDepartmentName(announcement)}</span>
                  </div>
                  <div className="footer-itemHOD">
                    <UserIcon size={14} />
                    <span>{announcement.author?.fullname || 'Unknown'}</span>
                  </div>
                  <div className="footer-itemHOD">
                    <Calendar size={14} />
                    <span title={formatDateTimeHOD(announcement.createdAt)}>
                      {formatDateHOD(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results-cardHOD">
            <div className="no-results-contentHOD">
              <Bell size={64} />
              <h3>No announcements found</h3>
              <p>Try adjusting your filters or create a new announcement</p>
              <div className="no-results-actionsHOD">
                <button 
                  className="reset-filters-btnHOD"
                  onClick={clearFiltersHOD}
                  type="button"
                >
                  Clear Filters
                </button>
                <button 
                  className="create-new-btnHOD"
                  onClick={openAddModalHOD}
                  type="button"
                >
                  <Plus size={16} />
                  Create Announcement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit/View Announcement Modal */}
      {showModalHOD && (
        <div className="modal-overlayHOD" onClick={closeModalHOD}>
          <div className="modal-contentHOD" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerHOD">
              <h2 className={`modal-titleHOD modal-title-${modalTypeHOD}HOD`}>
                {modalTypeHOD === 'add' && <Plus size={24} />}
                {modalTypeHOD === 'edit' && <Pencil size={24} />}
                {modalTypeHOD === 'view' && <Eye size={24} />}
                <span>
                  {modalTypeHOD === 'add' && 'Create Department Announcement'}
                  {modalTypeHOD === 'edit' && 'Edit Announcement'}
                  {modalTypeHOD === 'view' && 'Announcement Details'}
                </span>
              </h2>
              <button 
                className="modal-close-btnHOD"
                onClick={closeModalHOD}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-messages-containerHOD">
              {modalErrorHOD && (
                <div className="modal-errorHOD">
                  <AlertCircle size={16} />
                  <span>{modalErrorHOD}</span>
                </div>
              )}
              {modalSuccessHOD && (
                <div className="modal-successHOD">
                  <CheckCircle size={16} />
                  <span>{modalSuccessHOD}</span>
                </div>
              )}
            </div>

            <form onSubmit={modalTypeHOD === 'view' ? (e) => { e.preventDefault(); } : handleSubmitHOD} className="announcement-formHOD">
              {/* Department field - read-only for HOD */}
              <div className="form-groupHOD">
                <label><Building size={16} /> Department *</label>
                {modalTypeHOD === 'view' ? (
                  <div className="view-fieldHOD">
                    {getDepartmentNameForView()}
                  </div>
                ) : (
                  <div className="view-fieldHOD department-viewHOD">
                    <Building size={16} />
                    <span>{getUserDepartmentName()}</span>
                    <span className="department-noteHOD">(Your department - read only)</span>
                  </div>
                )}
                <input
                  type="hidden"
                  name="department"
                  value={userDepartmentId || ''}
                  readOnly
                />
              </div>

              <div className="form-groupHOD">
                <label><FileText size={16} /> Title {modalTypeHOD !== 'view' && '*'}</label>
                {modalTypeHOD === 'view' ? (
                  <div className="view-fieldHOD title-viewHOD">{formDataHOD.title}</div>
                ) : (
                  <input
                    type="text"
                    name="title"
                    value={formDataHOD.title}
                    onChange={handleInputChangeHOD}
                    autoComplete="off"
                    required
                    placeholder="Enter announcement title"
                    className={modalTypeHOD === 'view' ? 'read-only-inputHOD' : ''}
                  />
                )}
              </div>

              <div className="form-groupHOD">
                <label><AlertTriangle size={16} /> Priority</label>
                {modalTypeHOD === 'view' ? (
                  <div className="view-fieldHOD priority-viewHOD">
                    {getPriorityBadgeHOD(formDataHOD.priority)}
                  </div>
                ) : (
                  <select
                    name="priority"
                    value={formDataHOD.priority}
                    onChange={handleInputChangeHOD}
                    disabled={modalTypeHOD === 'view'}
                    className={modalTypeHOD === 'view' ? 'read-only-selectHOD' : ''}
                  >
                    {priorityOptionsHOD.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-groupHOD">
                <label><FileText size={16} /> Content {modalTypeHOD !== 'view' && '*'}</label>
                {modalTypeHOD === 'view' ? (
                  <div className="view-fieldHOD content-viewHOD">
                    <div className="content-textHOD">{formDataHOD.content}</div>
                  </div>
                ) : (
                  <textarea
                    name="content"
                    value={formDataHOD.content}
                    onChange={handleInputChangeHOD}
                    required
                    rows="8"
                    placeholder="Write your announcement content here..."
                    className={modalTypeHOD === 'view' ? 'read-only-textareaHOD' : ''}
                  />
                )}
              </div>

              <div className="form-actionsHOD">
                <button
                  type="button"
                  className="cancel-btnHOD"
                  onClick={closeModalHOD}
                  disabled={uploadingHOD}
                >
                  {modalTypeHOD === 'view' ? 'Close' : 'Cancel'}
                </button>
                
                {modalTypeHOD !== 'view' && (
                  <button
                    type="submit"
                    className={`submit-btnHOD ${modalTypeHOD === 'edit' ? 'submit-edit-btnHOD' : 'submit-add-btnHOD'}`}
                    disabled={uploadingHOD}
                  >
                    {uploadingHOD ? (
                      <>
                        <span className="spinnerHOD"></span>
                        Saving...
                      </>
                    ) : modalTypeHOD === 'edit' ? (
                      'Update Announcement'
                    ) : (
                      'Publish Announcement'
                    )}
                  </button>
                )}
                
                {modalTypeHOD === 'view' && currentAnnouncementHOD && isAuthor(currentAnnouncementHOD) && (
                  <button
                    type="button"
                    className="edit-from-view-btnHOD"
                    onClick={() => {
                      closeModalHOD();
                      openEditModalHOD(currentAnnouncementHOD);
                    }}
                  >
                    <Pencil size={16} />
                    Edit Announcement
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmHOD && (
        <div className="modal-overlayHOD" onClick={() => setShowDeleteConfirmHOD(false)}>
          <div className="delete-confirm-contentHOD" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-headerHOD">
              <AlertCircle size={32} className="delete-warning-iconHOD" />
              <h3>Confirm Delete</h3>
            </div>
            <p className="delete-confirm-messageHOD">
              Are you sure you want to delete the announcement "<strong>{announcementToDeleteHOD?.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actionsHOD">
              <button className="cancel-delete-btnHOD" onClick={() => setShowDeleteConfirmHOD(false)} type="button">
                Cancel
              </button>
              <button className="confirm-delete-btnHOD" onClick={confirmDeleteHOD} type="button">
                <Trash2 size={16} />
                Delete Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsHod;