import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Search, Filter,
  Calendar, X, CheckCircle, AlertTriangle, AlertCircle,
  Eye, User, Building, FileText,
  RefreshCw, Clock as ClockIcon, User as UserIcon
} from 'lucide-react';
import './Announcements.css';

const AnnouncementsEm = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingEMM, setLoadingEMM] = useState(true);
  const [errorEMM, setErrorEMM] = useState('');
  
  const [searchTermEMM, setSearchTermEMM] = useState('');
  const [typeFilterEMM, setTypeFilterEMM] = useState('all');
  const [priorityFilterEMM, setPriorityFilterEMM] = useState('all');
  
  const [showModalEMM, setShowModalEMM] = useState(false);
  const [currentAnnouncementEMM, setCurrentAnnouncementEMM] = useState(null);
  
  const [sortConfigEMM, setSortConfigEMM] = useState({ key: 'createdAt', direction: 'desc' });

  const [formDataEMM, setFormDataEMM] = useState({
    title: '',
    content: '',
    priority: 'medium',
    isSystemWide: true,
    department: '',
    status: 'active'
  });

  const priorityOptionsEMM = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const typeOptionsEMM = [
    { value: 'system', label: 'System-wide' },
    { value: 'department', label: 'Department' }
  ];

  // Get current user info
  const [currentUser, setCurrentUser] = useState(null);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userDepartmentName, setUserDepartmentName] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (user.department) {
      setUserDepartment(user.department);
    }
    
    fetchAnnouncementsEMM();
    fetchDepartmentsEMM();
  }, []);

  const fetchAnnouncementsEMM = async () => {
    try {
      setLoadingEMM(true);
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
      setErrorEMM('');
    } catch (err) {
      setErrorEMM('Failed to load announcements. Please try again.');
    } finally {
      setLoadingEMM(false);
    }
  };

  const fetchDepartmentsEMM = async () => {
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
      
      // Find user's department name
      if (userDepartment) {
        const foundDept = deptsArray.find(d => 
          d._id === userDepartment || 
          d.departmentId === userDepartment
        );
        if (foundDept) {
          setUserDepartmentName(foundDept.name);
        }
      }
    } catch (err) {
      setDepartments([]);
    }
  };

  const handleSearchEMM = (e) => {
    setSearchTermEMM(e.target.value);
  };

  const handleSortEMM = (key) => {
    let direction = 'asc';
    if (sortConfigEMM.key === key && sortConfigEMM.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigEMM({ key, direction });
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

  // Filter announcements for employee: system-wide OR employee's department
  const getFilteredAnnouncements = () => {
    let filtered = announcements;
    
    // Show system-wide OR announcements from employee's department
    if (userDepartment) {
      filtered = announcements.filter(announcement => {
        const isSystemWide = announcement.isSystemWide;
        const isUserDepartment = announcement.department?._id === userDepartment || 
                                 announcement.department === userDepartment ||
                                 announcement.departmentId === userDepartment;
        
        return isSystemWide || isUserDepartment;
      });
    }
    
    // Apply search filter
    if (searchTermEMM) {
      filtered = filtered.filter(announcement => 
        announcement.title?.toLowerCase().includes(searchTermEMM.toLowerCase()) ||
        announcement.content?.toLowerCase().includes(searchTermEMM.toLowerCase()) ||
        announcement.author?.fullname?.toLowerCase().includes(searchTermEMM.toLowerCase()) ||
        getDepartmentName(announcement)?.toLowerCase().includes(searchTermEMM.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilterEMM !== 'all') {
      filtered = filtered.filter(announcement => 
        (typeFilterEMM === 'system' && announcement.isSystemWide) ||
        (typeFilterEMM === 'department' && !announcement.isSystemWide)
      );
    }
    
    // Apply priority filter
    if (priorityFilterEMM !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilterEMM);
    }
    
    return filtered;
  };

  const filteredAnnouncementsEMM = getFilteredAnnouncements();

  const sortedAnnouncementsEMM = [...filteredAnnouncementsEMM].sort((a, b) => {
    if (sortConfigEMM.key) {
      const aValue = a[sortConfigEMM.key];
      const bValue = b[sortConfigEMM.key];
      
      if (aValue < bValue) {
        return sortConfigEMM.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfigEMM.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const openViewModalEMM = (announcement) => {
    setFormDataEMM({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'medium',
      isSystemWide: announcement.isSystemWide || true,
      department: announcement.department?._id || announcement.department || announcement.departmentId || '',
      status: announcement.status || 'active'
    });
    setCurrentAnnouncementEMM(announcement);
    setShowModalEMM(true);
  };

  const clearFiltersEMM = () => {
    setSearchTermEMM('');
    setTypeFilterEMM('all');
    setPriorityFilterEMM('all');
  };

  const getPriorityBadgeEMM = (priority) => {
    const priorityMap = {
      high: { className: 'priority-badge-highEMM', icon: <AlertCircle size={14} /> },
      medium: { className: 'priority-badge-mediumEMM', icon: <AlertTriangle size={14} /> },
      low: { className: 'priority-badge-lowEMM', icon: <CheckCircle size={14} /> }
    };
    
    const priorityInfo = priorityMap[priority] || priorityMap.medium;
    
    return (
      <span className={`priority-badgeEMM ${priorityInfo.className}`}>
        {priorityInfo.icon}
        <span className="ml-1EMM capitalize">{priority}</span>
      </span>
    );
  };

  const getTypeBadgeEMM = (isSystemWide) => {
    return (
      <span className={`type-badgeEMM ${isSystemWide ? 'type-badge-systemEMM' : 'type-badge-departmentEMM'}`}>
        {isSystemWide ? <User size={14} /> : <Building size={14} />}
        <span className="ml-1EMM">
          {isSystemWide ? 'System-wide' : 'Department'}
        </span>
      </span>
    );
  };

  const formatDateEMM = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTimeEMM = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeModalEMM = () => {
    setShowModalEMM(false);
    setFormDataEMM({
      title: '',
      content: '',
      priority: 'medium',
      isSystemWide: true,
      department: '',
      status: 'active'
    });
    setCurrentAnnouncementEMM(null);
  };

  const getDepartmentNameForView = () => {
    if (formDataEMM.isSystemWide) {
      return 'System-wide';
    }
    
    if (!formDataEMM.department) {
      return 'No Department Assigned';
    }
    
    const foundDept = findDepartmentById(formDataEMM.department);
    return foundDept?.name || 'No Department Assigned';
  };

  if (loadingEMM && announcements.length === 0) {
    return (
      <div className="announcements-containerEMM">
        <div className="loading-spinnerEMM">Loading announcements...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="announcements-containerEMM">
        <div className="unauthorized-messageEMM">
          <AlertCircle size={48} />
          <h2>Unauthorized Access</h2>
          <p>Please log in to view announcements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-containerEMM">
      {/* Welcome Header for Employee */}
      <div className="dashboard-headerEMM">
        <div className="employee-welcomeEMM">
          <h2><Bell size={24} /> Company Announcements</h2>
          <p className="welcome-subtitleEMM">
            {userDepartmentName 
              ? `Viewing announcements for ${userDepartmentName}`
              : 'Viewing all announcements'}
          </p>
        </div>
      </div>

      {/* Global Error Message */}
      {errorEMM && <div className="errorEMM">{errorEMM}</div>}

      {/* Filters Section */}
      <div className="filters-sectionEMM">
        <div className="filters-gridEMM">
          {/* Type filter - Only show if employee has a department */}
          {userDepartment && (
            <div className="filter-groupEMM">
              <label><Filter size={16} /> Type</label>
              <select 
                value={typeFilterEMM}
                onChange={(e) => setTypeFilterEMM(e.target.value)}
                className="filter-selectEMM"
              >
                <option value="all">All Types</option>
                {typeOptionsEMM.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority filter */}
          <div className="filter-groupEMM">
            <label><AlertTriangle size={16} /> Priority</label>
            <select 
              value={priorityFilterEMM}
              onChange={(e) => setPriorityFilterEMM(e.target.value)}
              className="filter-selectEMM"
            >
              <option value="all">All Priorities</option>
              {priorityOptionsEMM.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="filter-groupEMM search-groupEMM">
            <label><Search size={16} /> Search</label>
            <input
              type="text"
              className="search-inputEMM"
              placeholder="Search announcements..."
              value={searchTermEMM}
              onChange={handleSearchEMM}
            />
            {searchTermEMM && (
              <button className="clear-search-btnEMM" onClick={() => setSearchTermEMM('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-actionsEMM">
          <button onClick={clearFiltersEMM} className="btn-clearEMM" type="button">
            Clear Filters
          </button>
          <button onClick={fetchAnnouncementsEMM} className="btn-refreshEMM" type="button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summaryEMM">
        <div className="results-countEMM">
          <span className="results-count-numberEMM">{filteredAnnouncementsEMM.length}</span>
          <span className="results-count-textEMM">announcements found</span>
          {searchTermEMM && (
            <span className="filter-textEMM">
              filtered by: "{searchTermEMM}"
            </span>
          )}
          {typeFilterEMM !== 'all' && (
            <span className="filter-textEMM">
              • Type: {typeFilterEMM}
            </span>
          )}
          {priorityFilterEMM !== 'all' && (
            <span className="filter-textEMM">
              • Priority: {priorityFilterEMM}
            </span>
          )}
          {userDepartment && (
            <span className="filter-textEMM">
              • Showing: System-wide & Your Department
            </span>
          )}
        </div>
      </div>

      {/* Announcements Cards Grid */}
      <div className="announcements-gridEMM">
        {sortedAnnouncementsEMM.length > 0 ? (
          sortedAnnouncementsEMM.map((announcement) => (
            <div key={announcement._id} className="announcement-cardEMM">
              <div className="card-headerEMM">
                <div className="card-header-leftEMM">
                  {getPriorityBadgeEMM(announcement.priority)}
                  {getTypeBadgeEMM(announcement.isSystemWide)}
                </div>
                <div className="card-header-rightEMM">
                  <div className="card-actionsEMM">
                    <button 
                      className="action-btnEMM view-btnEMM"
                      onClick={() => openViewModalEMM(announcement)}
                      title="View Details"
                      type="button"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-titleEMM">
                <FileText size={18} />
                <h3 title={announcement.title}>{announcement.title}</h3>
              </div>

              <div className="card-contentEMM">
                <p>{announcement.content.substring(0, 150)}...</p>
                {announcement.content.length > 150 && (
                  <button 
                    className="read-moreEMM"
                    onClick={() => openViewModalEMM(announcement)}
                    type="button"
                  >
                    Read more
                  </button>
                )}
              </div>

              <div className="card-footerEMM">
                <div className="footer-infoEMM">
                  <div className="footer-itemEMM">
                    <Building size={14} />
                    <span>{getDepartmentName(announcement)}</span>
                  </div>
                  <div className="footer-itemEMM">
                    <UserIcon size={14} />
                    <span>{announcement.author?.fullname || 'HR'}</span>
                  </div>
                  <div className="footer-itemEMM">
                    <Calendar size={14} />
                    <span title={formatDateTimeEMM(announcement.createdAt)}>
                      {formatDateEMM(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results-cardEMM">
            <div className="no-results-contentEMM">
              <Bell size={64} />
              <h3>No announcements found</h3>
              <p>Try adjusting your filters</p>
              <div className="no-results-actionsEMM">
                <button 
                  className="reset-filters-btnEMM"
                  onClick={clearFiltersEMM}
                  type="button"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Announcement Modal - Clean White Background */}
      {showModalEMM && (
        <div className="modal-overlayEMM" onClick={closeModalEMM}>
          <div className="modal-contentEMM modal-content-cleanEMM" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-cleanEMM">
              <h2 className="modal-title-cleanEMM">
                {formDataEMM.title}
              </h2>
              <button 
                className="modal-close-btn-cleanEMM"
                onClick={closeModalEMM}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body-cleanEMM">
              {/* Priority and Type Badges */}
              <div className="modal-badges-cleanEMM">
                <div className="modal-badge-groupEMM">
                  <span className="modal-badge-labelEMM">Priority:</span>
                  {getPriorityBadgeEMM(formDataEMM.priority)}
                </div>
                <div className="modal-badge-groupEMM">
                  <span className="modal-badge-labelEMM">Type:</span>
                  <span className={`type-badgeEMM ${formDataEMM.isSystemWide ? 'type-badge-systemEMM' : 'type-badge-departmentEMM'}`}>
                    {formDataEMM.isSystemWide ? <User size={14} /> : <Building size={14} />}
                    <span className="ml-1EMM">
                      {formDataEMM.isSystemWide ? 'System-wide' : 'Department'}
                    </span>
                  </span>
                </div>
                {!formDataEMM.isSystemWide && (
                  <div className="modal-badge-groupEMM">
                    <span className="modal-badge-labelEMM">Department:</span>
                    <span className="department-badge-cleanEMM">
                      <Building size={14} />
                      {getDepartmentNameForView()}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="modal-content-text-cleanEMM">
                <div className="content-text-cleanEMM">{formDataEMM.content}</div>
              </div>

              {/* Footer Info */}
              <div className="modal-footer-cleanEMM">
                <div className="modal-footer-infoEMM">
                  <div className="modal-footer-itemEMM">
                    <UserIcon size={14} />
                    <span>{currentAnnouncementEMM?.author?.fullname || 'HR'}</span>
                  </div>
                  <div className="modal-footer-itemEMM">
                    <Calendar size={14} />
                    <span title={formatDateTimeEMM(currentAnnouncementEMM?.createdAt || new Date())}>
                      {formatDateEMM(currentAnnouncementEMM?.createdAt || new Date())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions-cleanEMM">
              <button
                type="button"
                className="close-btn-cleanEMM"
                onClick={closeModalEMM}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsEm;