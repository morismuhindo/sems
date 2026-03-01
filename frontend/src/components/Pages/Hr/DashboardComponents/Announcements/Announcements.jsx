import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Plus, Pencil, Trash2, Search, Filter,
  Calendar, X, CheckCircle, AlertTriangle, AlertCircle,
  Download, Eye, User, Building, FileText, Megaphone,
  RefreshCw, ChevronDown, ChevronUp, ArrowUpDown, Globe,
  BarChart3, PieChart, TrendingUp, Users, Clock, AlertOctagon,
  MoreVertical, Clock as ClockIcon, User as UserIcon
} from 'lucide-react';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingANN, setLoadingANN] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [errorANN, setErrorANN] = useState('');
  const [successANN, setSuccessANN] = useState('');
  
  const [searchTermANN, setSearchTermANN] = useState('');
  const [typeFilterANN, setTypeFilterANN] = useState('all');
  const [priorityFilterANN, setPriorityFilterANN] = useState('all');
  
  const [showModalANN, setShowModalANN] = useState(false);
  const [modalTypeANN, setModalTypeANN] = useState('add');
  const [currentAnnouncementANN, setCurrentAnnouncementANN] = useState(null);
  const [uploadingANN, setUploadingANN] = useState(false);
  
  const [showDeleteConfirmANN, setShowDeleteConfirmANN] = useState(false);
  const [announcementToDeleteANN, setAnnouncementToDeleteANN] = useState(null);
  
  const [sortConfigANN, setSortConfigANN] = useState({ key: 'createdAt', direction: 'desc' });
  
  const [modalErrorANN, setModalErrorANN] = useState('');
  const [modalSuccessANN, setModalSuccessANN] = useState('');

  const [formDataANN, setFormDataANN] = useState({
    title: '',
    content: '',
    priority: 'medium',
    isSystemWide: true,
    department: '',
    status: 'active'
  });

  const priorityOptionsANN = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const typeOptionsANN = [
    { value: 'system', label: 'System-wide' },
    { value: 'department', label: 'Department' }
  ];

  useEffect(() => {
    checkAuthorizationANN();
    fetchAnnouncementsANN();
    fetchDepartmentsANN();
    fetchStatsANN();
  }, []);

  useEffect(() => {
    let timer;
    if (modalErrorANN) {
      timer = setTimeout(() => {
        setModalErrorANN('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [modalErrorANN]);

  useEffect(() => {
    let timer;
    if (modalSuccessANN) {
      timer = setTimeout(() => {
        setModalSuccessANN('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [modalSuccessANN]);

  const checkAuthorizationANN = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || user.role.toLowerCase() !== 'hr') {
      setErrorANN('Unauthorized access. Only HR personnel can access this page.');
      setLoadingANN(false);
      return false;
    }
    return true;
  };

  const fetchAnnouncementsANN = async () => {
    try {
      setLoadingANN(true);
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
      setErrorANN('');
    } catch (err) {
      setErrorANN('Failed to load announcements. Please try again.');
    } finally {
      setLoadingANN(false);
    }
  };

  const fetchStatsANN = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/announcement/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDepartmentsANN = async () => {
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
    } catch (err) {
      setDepartments([]);
    }
  };

  const handleSearchANN = (e) => {
    setSearchTermANN(e.target.value);
  };

  const handleSortANN = (key) => {
    let direction = 'asc';
    if (sortConfigANN.key === key && sortConfigANN.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigANN({ key, direction });
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
    
    if (announcement.departmentId === undefined && announcement.department === undefined) {
      const possibleDeptFields = ['dept', 'deptId', 'dept_id', 'department_id', 'departmentID'];
      for (const field of possibleDeptFields) {
        if (announcement[field]) {
          const foundDept = findDepartmentById(announcement[field]);
          if (foundDept) {
            return foundDept.name;
          }
        }
      }
    }
    
    return 'No Department Assigned';
  };

  const filteredAnnouncementsANN = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title?.toLowerCase().includes(searchTermANN.toLowerCase()) ||
      announcement.content?.toLowerCase().includes(searchTermANN.toLowerCase()) ||
      announcement.author?.fullname?.toLowerCase().includes(searchTermANN.toLowerCase()) ||
      getDepartmentName(announcement)?.toLowerCase().includes(searchTermANN.toLowerCase());
    
    const matchesType = 
      typeFilterANN === 'all' ||
      (typeFilterANN === 'system' && announcement.isSystemWide) ||
      (typeFilterANN === 'department' && !announcement.isSystemWide);
    
    const matchesPriority = 
      priorityFilterANN === 'all' || announcement.priority === priorityFilterANN;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const sortedAnnouncementsANN = [...filteredAnnouncementsANN].sort((a, b) => {
    if (sortConfigANN.key) {
      const aValue = a[sortConfigANN.key];
      const bValue = b[sortConfigANN.key];
      
      if (aValue < bValue) {
        return sortConfigANN.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfigANN.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const handleInputChangeANN = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = e.target.checked;
      setFormDataANN(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'isSystemWide' && checked && { department: '' })
      }));
    } else {
      setFormDataANN(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmitANN = async (e) => {
    e.preventDefault();
    setUploadingANN(true);
    setModalErrorANN('');
    setModalSuccessANN('');

    try {
      const token = localStorage.getItem('token');
      
      if (!formDataANN.isSystemWide && !formDataANN.department) {
        setModalErrorANN('Please select a department for department announcements');
        setUploadingANN(false);
        return;
      }
      
      const submissionData = {
        title: formDataANN.title.trim(),
        content: formDataANN.content.trim(),
        priority: formDataANN.priority,
        ...(formDataANN.isSystemWide 
          ? { isSystemWide: true }
          : { 
              isSystemWide: false,
              department: formDataANN.department 
            }
        )
      };

      if (modalTypeANN === 'edit') {
        await axios.put(`/api/announcement/${currentAnnouncementANN._id}`, submissionData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalSuccessANN('Announcement updated successfully!');
        
        setTimeout(() => {
          setShowModalANN(false);
          resetFormANN();
          fetchAnnouncementsANN();
          fetchStatsANN();
        }, 1500);
      } else {
        const endpoint = formDataANN.isSystemWide 
          ? '/api/announcement/system'
          : '/api/announcement/department';
        
        await axios.post(endpoint, submissionData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModalSuccessANN('Announcement created successfully!');
        
        setTimeout(() => {
          setShowModalANN(false);
          resetFormANN();
          fetchAnnouncementsANN();
          fetchStatsANN();
        }, 1500);
      }
    } catch (err) {
      setModalErrorANN(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setUploadingANN(false);
    }
  };

  const openAddModalANN = (type = 'system') => {
    resetFormANN();
    setFormDataANN(prev => ({
      ...prev,
      isSystemWide: type === 'system'
    }));
    setModalTypeANN('add');
    setShowModalANN(true);
    setModalErrorANN('');
    setModalSuccessANN('');
  };

  const openEditModalANN = (announcement) => {
    let departmentId = '';
    if (announcement.department?._id) {
      departmentId = announcement.department._id;
    } else if (announcement.department && typeof announcement.department === 'string') {
      departmentId = announcement.department;
    } else if (announcement.departmentId) {
      departmentId = announcement.departmentId;
    }
    
    setFormDataANN({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'medium',
      isSystemWide: announcement.isSystemWide || true,
      department: departmentId,
      status: announcement.status || 'active'
    });
    setCurrentAnnouncementANN(announcement);
    setModalTypeANN('edit');
    setShowModalANN(true);
    setModalErrorANN('');
    setModalSuccessANN('');
  };

  const openViewModalANN = (announcement) => {
    setFormDataANN({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'medium',
      isSystemWide: announcement.isSystemWide || true,
      department: announcement.department?._id || announcement.department || announcement.departmentId || '',
      status: announcement.status || 'active'
    });
    setCurrentAnnouncementANN(announcement);
    setModalTypeANN('view');
    setShowModalANN(true);
    setModalErrorANN('');
    setModalSuccessANN('');
  };

  const handleDeleteANN = (announcement) => {
    setAnnouncementToDeleteANN(announcement);
    setShowDeleteConfirmANN(true);
    setModalErrorANN('');
    setModalSuccessANN('');
  };

  const confirmDeleteANN = async () => {
    if (!announcementToDeleteANN) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/announcement/${announcementToDeleteANN._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessANN('Announcement deleted successfully!');
      setShowDeleteConfirmANN(false);
      setAnnouncementToDeleteANN(null);
      fetchAnnouncementsANN();
      fetchStatsANN();
      
      setTimeout(() => {
        setSuccessANN('');
      }, 3000);
    } catch (err) {
      setErrorANN(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const resetFormANN = () => {
    setFormDataANN({
      title: '',
      content: '',
      priority: 'medium',
      isSystemWide: true,
      department: '',
      status: 'active'
    });
    setCurrentAnnouncementANN(null);
  };

  const clearFiltersANN = () => {
    setSearchTermANN('');
    setTypeFilterANN('all');
    setPriorityFilterANN('all');
  };

  const getPriorityBadgeANN = (priority) => {
    const priorityMap = {
      high: { className: 'priority-badge-highANN', icon: <AlertCircle size={14} /> },
      medium: { className: 'priority-badge-mediumANN', icon: <AlertTriangle size={14} /> },
      low: { className: 'priority-badge-lowANN', icon: <CheckCircle size={14} /> }
    };
    
    const priorityInfo = priorityMap[priority] || priorityMap.medium;
    
    return (
      <span className={`priority-badgeANN ${priorityInfo.className}`}>
        {priorityInfo.icon}
        <span className="ml-1ANN capitalize">{priority}</span>
      </span>
    );
  };

  const getTypeBadgeANN = (isSystemWide) => {
    return (
      <span className={`type-badgeANN ${isSystemWide ? 'type-badge-systemANN' : 'type-badge-departmentANN'}`}>
        {isSystemWide ? <User size={14} /> : <Building size={14} />}
        <span className="ml-1ANN">
          {isSystemWide ? 'System-wide' : 'Department'}
        </span>
      </span>
    );
  };

  const formatDateANN = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTimeANN = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closeModalANN = () => {
    setShowModalANN(false);
    resetFormANN();
    setModalErrorANN('');
    setModalSuccessANN('');
  };

  const getPriorityCount = (priority) => {
    if (!stats?.priority) return 0;
    const priorityStat = stats.priority.find(p => p._id === priority);
    return priorityStat ? priorityStat.count : 0;
  };

  const getDepartmentNameForView = () => {
    if (formDataANN.isSystemWide) {
      return 'System-wide';
    }
    
    if (!formDataANN.department) {
      return 'No Department Assigned';
    }
    
    const foundDept = findDepartmentById(formDataANN.department);
    return foundDept?.name || 'No Department Assigned';
  };

  if (loadingANN && announcements.length === 0) {
    return (
      <div className="announcements-containerANN">
        <div className="loading-spinnerANN">Loading announcements...</div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthorized = user.role && user.role.toLowerCase() === 'hr';

  if (!isAuthorized) {
    return (
      <div className="announcements-containerANN">
        <div className="unauthorized-messageANN">
          <AlertCircle size={48} />
          <h2>Unauthorized Access</h2>
          <p>Only HR personnel can access the announcements management system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-containerANN">
      <div className="dashboard-headerANN">
        <div className="header-actionsANN">
          <button 
            className="btn-primaryANN"
            onClick={() => openAddModalANN('system')}
            type="button"
          >
            <Plus size={18} />
            System Announcement
          </button>
          <button 
            className="btn-secondaryANN"
            onClick={() => openAddModalANN('department')}
            type="button"
          >
            <Building size={18} />
            Department Announcement
          </button>
        </div>
      </div>

      {errorANN && <div className="errorANN">{errorANN}</div>}
      {successANN && <div className="successANN">{successANN}</div>}

      {stats && (
        <div className="stats-sectionANN">
          <div className="stats-headerANN">
            <h3><BarChart3 size={20} /> Announcement Statistics</h3>
            <button 
              onClick={fetchStatsANN} 
              className="btn-refresh-statsANN"
              disabled={statsLoading}
              type="button"
            >
              <RefreshCw size={16} />
              {statsLoading ? 'Refreshing...' : 'Refresh Stats'}
            </button>
          </div>
          
          <div className="stats-gridANN">
            <div className="stat-cardANN total-statANN">
              <div className="stat-iconANN">
                <Users size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>Total Announcements</h4>
                <p className="stat-valueANN">{stats.total || 0}</p>
              </div>
            </div>
            
            <div className="stat-cardANN system-statANN">
              <div className="stat-iconANN">
                <Globe size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>System-wide</h4>
                <p className="stat-valueANN">{stats.system || 0}</p>
              </div>
            </div>
            
            <div className="stat-cardANN department-statANN">
              <div className="stat-iconANN">
                <Building size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>Department</h4>
                <p className="stat-valueANN">{stats.department || 0}</p>
              </div>
            </div>
            
            <div className="stat-cardANN recent-statANN">
              <div className="stat-iconANN">
                <Clock size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>Last 7 Days</h4>
                <p className="stat-valueANN">{stats.recent || 0}</p>
              </div>
            </div>
            
            <div className="stat-cardANN high-priority-statANN">
              <div className="stat-iconANN">
                <AlertOctagon size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>High Priority</h4>
                <p className="stat-valueANN">{getPriorityCount('high')}</p>
              </div>
            </div>
            
            <div className="stat-cardANN medium-priority-statANN">
              <div className="stat-iconANN">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-contentANN">
                <h4>Medium Priority</h4>
                <p className="stat-valueANN">{getPriorityCount('medium')}</p>
              </div>
            </div>
          </div>
          
          {stats.priority && stats.priority.length > 0 && (
            <div className="priority-distributionANN">
              <h4><PieChart size={18} /> Priority Distribution</h4>
              <div className="priority-barsANN">
                {stats.priority.map((priorityStat) => (
                  <div key={priorityStat._id} className="priority-barANN">
                    <div className="priority-labelANN">
                      <span className={`priority-dotANN priority-dot-${priorityStat._id}ANN`}></span>
                      {priorityStat._id.charAt(0).toUpperCase() + priorityStat._id.slice(1)} Priority
                    </div>
                    <div className="priority-countANN">
                      {priorityStat.count} ({((priorityStat.count / stats.total) * 100).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="filters-sectionANN">
        <div className="filters-gridANN">
          <div className="filter-groupANN">
            <label><Filter size={16} /> Type</label>
            <select 
              value={typeFilterANN}
              onChange={(e) => setTypeFilterANN(e.target.value)}
              className="filter-selectANN"
            >
              <option value="all">All Types</option>
              {typeOptionsANN.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupANN">
            <label><AlertTriangle size={16} /> Priority</label>
            <select 
              value={priorityFilterANN}
              onChange={(e) => setPriorityFilterANN(e.target.value)}
              className="filter-selectANN"
            >
              <option value="all">All Priorities</option>
              {priorityOptionsANN.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupANN search-groupANN">
            <label><Search size={16} /> Search</label>
            <input
              type="text"
              className="search-inputANN"
              placeholder="Search announcements..."
              value={searchTermANN}
              onChange={handleSearchANN}
              autoComplete="off"
            />
            {searchTermANN && (
              <button className="clear-search-btnANN" onClick={() => setSearchTermANN('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-actionsANN">
          <button onClick={clearFiltersANN} className="btn-clearANN" type="button">
            Clear Filters
          </button>
          <button onClick={() => { 
            fetchAnnouncementsANN(); 
            fetchStatsANN(); 
            fetchDepartmentsANN(); 
          }} className="btn-refreshANN" type="button">
            <RefreshCw size={16} />
            Refresh All
          </button>
        </div>
      </div>

      <div className="results-summaryANN">
        <div className="results-countANN">
          <span className="results-count-numberANN">{filteredAnnouncementsANN.length}</span>
          <span className="results-count-textANN">announcements found</span>
          {searchTermANN && (
            <span className="filter-textANN">
              filtered by: "{searchTermANN}"
            </span>
          )}
          {typeFilterANN !== 'all' && (
            <span className="filter-textANN">
              • Type: {typeFilterANN}
            </span>
          )}
          {priorityFilterANN !== 'all' && (
            <span className="filter-textANN">
              • Priority: {priorityFilterANN}
            </span>
          )}
        </div>
      </div>

      <div className="announcements-gridANN">
        {sortedAnnouncementsANN.length > 0 ? (
          sortedAnnouncementsANN.map((announcement) => (
            <div key={announcement._id} className="announcement-cardANN">
              <div className="card-headerANN">
                <div className="card-header-leftANN">
                  {getPriorityBadgeANN(announcement.priority)}
                  {getTypeBadgeANN(announcement.isSystemWide)}
                </div>
                <div className="card-header-rightANN">
                  <div className="card-actionsANN">
                    <button 
                      className="action-btnANN view-btnANN"
                      onClick={() => openViewModalANN(announcement)}
                      title="View Details"
                      type="button"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="action-btnANN edit-btnANN"
                      onClick={() => openEditModalANN(announcement)}
                      title="Edit Announcement"
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="action-btnANN delete-btnANN"
                      onClick={() => handleDeleteANN(announcement)}
                      title="Delete Announcement"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-titleANN">
                <FileText size={18} />
                <h3 title={announcement.title}>{announcement.title}</h3>
              </div>

              <div className="card-contentANN">
                <p>{announcement.content.substring(0, 150)}...</p>
                {announcement.content.length > 150 && (
                  <button 
                    className="read-moreANN"
                    onClick={() => openViewModalANN(announcement)}
                    type="button"
                  >
                    Read more
                  </button>
                )}
              </div>

              <div className="card-footerANN">
                <div className="footer-infoANN">
                  <div className="footer-itemANN">
                    <Building size={14} />
                    <span>{getDepartmentName(announcement)}</span>
                  </div>
                  <div className="footer-itemANN">
                    <UserIcon size={14} />
                    <span>{announcement.author?.fullname || 'HR'}</span>
                  </div>
                  <div className="footer-itemANN">
                    <Calendar size={14} />
                    <span title={formatDateTimeANN(announcement.createdAt)}>
                      {formatDateANN(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results-cardANN">
            <div className="no-results-contentANN">
              <Bell size={64} />
              <h3>No announcements found</h3>
              <p>Try adjusting your filters or create a new announcement</p>
              <div className="no-results-actionsANN">
                <button 
                  className="reset-filters-btnANN"
                  onClick={clearFiltersANN}
                  type="button"
                >
                  Clear Filters
                </button>
                <button 
                  className="create-new-btnANN"
                  onClick={() => openAddModalANN('system')}
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

      {showModalANN && (
        <div className="modal-overlayANN" onClick={closeModalANN}>
          <div className="modal-contentANN" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerANN">
              <h2 className={`modal-titleANN modal-title-${modalTypeANN}ANN`}>
                {modalTypeANN === 'add' && <Plus size={24} />}
                {modalTypeANN === 'edit' && <Pencil size={24} />}
                {modalTypeANN === 'view' && <Eye size={24} />}
                <span>
                  {modalTypeANN === 'add' && (formDataANN.isSystemWide ? 'Create System Announcement' : 'Create Department Announcement')}
                  {modalTypeANN === 'edit' && 'Edit Announcement'}
                  {modalTypeANN === 'view' && 'Announcement Details'}
                </span>
              </h2>
              <button 
                className="modal-close-btnANN"
                onClick={closeModalANN}
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-messages-containerANN">
              {modalErrorANN && (
                <div className="modal-errorANN">
                  <AlertCircle size={16} />
                  <span>{modalErrorANN}</span>
                </div>
              )}
              {modalSuccessANN && (
                <div className="modal-successANN">
                  <CheckCircle size={16} />
                  <span>{modalSuccessANN}</span>
                </div>
              )}
            </div>

            <form onSubmit={modalTypeANN === 'view' ? (e) => { e.preventDefault(); } : handleSubmitANN} className="announcement-formANN">
              {modalTypeANN !== 'view' && (
                <div className="type-selectionANN">
                  <label className="type-optionANN">
                    <input
                      type="radio"
                      name="isSystemWide"
                      checked={formDataANN.isSystemWide}
                      onChange={() => setFormDataANN(prev => ({ ...prev, isSystemWide: true, department: '' }))}
                    />
                    <User size={20} />
                    <div>
                      <h4>System-wide</h4>
                      <p>Visible to all employees</p>
                    </div>
                  </label>
                  
                  <label className="type-optionANN">
                    <input
                      type="radio"
                      name="isSystemWide"
                      checked={!formDataANN.isSystemWide}
                      onChange={() => setFormDataANN(prev => ({ ...prev, isSystemWide: false }))}
                    />
                    <Building size={20} />
                    <div>
                      <h4>Department</h4>
                      <p>Visible to selected department only</p>
                    </div>
                  </label>
                </div>
              )}

              {(!formDataANN.isSystemWide || modalTypeANN === 'view') && (
                <div className="form-groupANN">
                  <label><Building size={16} /> Department {modalTypeANN !== 'view' && '*'}</label>
                  {modalTypeANN === 'view' ? (
                    <div className="view-fieldANN">
                      {getDepartmentNameForView()}
                    </div>
                  ) : (
                    <select
                      name="department"
                      value={formDataANN.department}
                      onChange={handleInputChangeANN}
                      required={!formDataANN.isSystemWide}
                      disabled={modalTypeANN === 'view' || formDataANN.isSystemWide}
                      className={modalTypeANN === 'view' ? 'read-only-selectANN' : ''}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="form-groupANN">
                <label><FileText size={16} /> Title {modalTypeANN !== 'view' && '*'}</label>
                {modalTypeANN === 'view' ? (
                  <div className="view-fieldANN title-viewANN">{formDataANN.title}</div>
                ) : (
                  <input
                    type="text"
                    name="title"
                    autoComplete="off"
                    value={formDataANN.title}
                    onChange={handleInputChangeANN}
                    required
                    placeholder="Enter announcement title"
                    className={modalTypeANN === 'view' ? 'read-only-inputANN' : ''}
                  />
                )}
              </div>

              <div className="form-groupANN">
                <label><AlertTriangle size={16} /> Priority</label>
                {modalTypeANN === 'view' ? (
                  <div className="view-fieldANN priority-viewANN">
                    {getPriorityBadgeANN(formDataANN.priority)}
                  </div>
                ) : (
                  <select
                    name="priority"
                    value={formDataANN.priority}
                    onChange={handleInputChangeANN}
                    disabled={modalTypeANN === 'view'}
                    className={modalTypeANN === 'view' ? 'read-only-selectANN' : ''}
                  >
                    {priorityOptionsANN.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-groupANN">
                <label><FileText size={16} /> Content {modalTypeANN !== 'view' && '*'}</label>
                {modalTypeANN === 'view' ? (
                  <div className="view-fieldANN content-viewANN">
                    <div className="content-textANN">{formDataANN.content}</div>
                  </div>
                ) : (
                  <textarea
                    name="content"
                    value={formDataANN.content}
                    autoComplete="off"
                    onChange={handleInputChangeANN}
                    required
                    rows="8"
                    placeholder="Write your announcement content here..."
                    className={modalTypeANN === 'view' ? 'read-only-textareaANN' : ''}
                  />
                )}
              </div>

              <div className="form-actionsANN">
                <button
                  type="button"
                  className="cancel-btnANN"
                  onClick={closeModalANN}
                  disabled={uploadingANN}
                >
                  {modalTypeANN === 'view' ? 'Close' : 'Cancel'}
                </button>
                
                {modalTypeANN !== 'view' && (
                  <button
                    type="submit"
                    className={`submit-btnANN ${modalTypeANN === 'edit' ? 'submit-edit-btnANN' : 'submit-add-btnANN'}`}
                    disabled={uploadingANN}
                  >
                    {uploadingANN ? (
                      <>
                        <span className="spinnerANN"></span>
                        Saving...
                      </>
                    ) : modalTypeANN === 'edit' ? (
                      'Update Announcement'
                    ) : (
                      'Publish Announcement'
                    )}
                  </button>
                )}
                
                {modalTypeANN === 'view' && currentAnnouncementANN && (
                  <button
                    type="button"
                    className="edit-from-view-btnANN"
                    onClick={() => {
                      closeModalANN();
                      openEditModalANN(currentAnnouncementANN);
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

      {showDeleteConfirmANN && (
        <div className="modal-overlayANN" onClick={() => setShowDeleteConfirmANN(false)}>
          <div className="delete-confirm-contentANN" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-headerANN">
              <AlertCircle size={32} className="delete-warning-iconANN" />
              <h3>Confirm Delete</h3>
            </div>
            <p className="delete-confirm-messageANN">
              Are you sure you want to delete the announcement "<strong>{announcementToDeleteANN?.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actionsANN">
              <button className="cancel-delete-btnANN" onClick={() => setShowDeleteConfirmANN(false)} type="button">
                Cancel
              </button>
              <button className="confirm-delete-btnANN" onClick={confirmDeleteANN} type="button">
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

export default Announcements;