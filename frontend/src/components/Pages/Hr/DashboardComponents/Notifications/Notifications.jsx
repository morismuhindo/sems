import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  UserCheck,
  UserX,
  FileText,
  Building,
  Users,
  CheckSquare,
  XSquare,
  Trash2,
  ExternalLink,
  Filter,
  X,
  RefreshCw,
  Settings,
  Eye,
  MessageSquare,
  Mail,
  Download,
  Activity,
  TrendingUp,
  Info,
  MoreVertical,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Upload,
  Search
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  // Load read states from localStorage on initial render
  const loadReadStates = () => {
    try {
      const saved = localStorage.getItem('notificationReadStates');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading notification states:', error);
      return {};
    }
  };

  const [readStates, setReadStates] = useState(loadReadStates());
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    highPriority: 0,
    actionRequired: 0
  });

  // Save read states to localStorage whenever they change
  const saveReadStates = (states) => {
    try {
      localStorage.setItem('notificationReadStates', JSON.stringify(states));
    } catch (error) {
      console.error('Error saving notification states:', error);
    }
  };

  // Function to sync unread count with HRNavbar
  const syncUnreadCount = useCallback((count) => {
    try {
      // Save to localStorage for HRNavbar to access
      localStorage.setItem('hr_unread_notifications_count', count.toString());
      
      // Dispatch custom event for real-time update
      window.dispatchEvent(new CustomEvent('notificationUpdate', {
        detail: { 
          count: count,
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log('Synced unread count with HRNavbar:', count);
    } catch (error) {
      console.error('Error syncing unread count:', error);
    }
  }, []);

  // Calculate unread count from notifications
  const calculateUnreadCount = useCallback((notificationsList) => {
    return notificationsList.filter(n => !n.read).length;
  }, []);

  // API endpoints from your components
  const API_ENDPOINTS = {
    attendance: '/api/attend',
    leave: '/api/leave',
    employees: '/api/employees',
    documents: '/api/doc',
    departments: '/api/depart',
    organisations: '/api/org',
    users: '/api',
    announcements: '/api/announcement'
  };

  // Notification types configuration
  const notificationTypes = {
    attendance: {
      icon: Clock,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      label: 'Attendance'
    },
    leave: {
      icon: Calendar,
      color: '#10b981',
      bgColor: '#d1fae5',
      label: 'Leave'
    },
    employee: {
      icon: Users,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      label: 'Employee'
    },
    document: {
      icon: FileText,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      label: 'Document'
    },
    department: {
      icon: Building,
      color: '#ef4444',
      bgColor: '#fee2e2',
      label: 'Department'
    },
    organisation: {
      icon: Building,
      color: '#ec4899',
      bgColor: '#fce7f3',
      label: 'Organisation'
    },
    user: {
      icon: UserCheck,
      color: '#6366f1',
      bgColor: '#e0e7ff',
      label: 'User'
    },
    system: {
      icon: Activity,
      color: '#6b7280',
      bgColor: '#f3f4f6',
      label: 'System'
    },
    clock_in: {
      icon: LogIn,
      color: '#10b981',
      bgColor: '#d1fae5',
      label: 'Clock In'
    },
    clock_out: {
      icon: LogOut,
      color: '#ef4444',
      bgColor: '#fee2e2',
      label: 'Clock Out'
    },
    announcement: {
      icon: Bell,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      label: 'Announcement'
    }
  };

  // Priority levels
  const priorityLevels = {
    high: {
      label: 'High',
      color: '#ef4444',
      bgColor: '#fee2e2',
      icon: AlertCircle
    },
    medium: {
      label: 'Medium',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      icon: Info
    },
    low: {
      label: 'Low',
      color: '#10b981',
      bgColor: '#d1fae5',
      icon: CheckCircle
    }
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Mark as read/unread with persistence and sync with HRNavbar
  const markAsRead = (notificationId, isRead = true) => {
    // Update read states
    const updatedReadStates = {
      ...readStates,
      [notificationId]: isRead
    };
    setReadStates(updatedReadStates);
    saveReadStates(updatedReadStates);

    // Update notifications list
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: isRead } : notif
    ));

    // Calculate new unread count
    const newUnreadCount = isRead ? stats.unread - 1 : stats.unread + 1;
    
    // Update stats
    setStats(prev => ({
      ...prev,
      unread: newUnreadCount
    }));

    // Sync with HRNavbar
    syncUnreadCount(newUnreadCount);

    if (isRead) {
      setSuccess('Notification marked as read');
    } else {
      setSuccess('Notification marked as unread');
    }
    setTimeout(() => setSuccess(''), 3000);
  };

  // Mark all as read with persistence and sync with HRNavbar
  const markAllAsRead = () => {
    // Create new read states for all notifications
    const newReadStates = { ...readStates };
    notifications.forEach(notif => {
      newReadStates[notif.id] = true;
    });
    
    setReadStates(newReadStates);
    saveReadStates(newReadStates);

    // Update notifications list
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    
    // Update stats
    setStats(prev => ({
      ...prev,
      unread: 0
    }));

    // Sync with HRNavbar (set to 0)
    syncUnreadCount(0);

    setSuccess('All notifications marked as read');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Delete notification with persistence and sync with HRNavbar
  const deleteNotification = (notificationId) => {
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    
    // Remove from read states
    const newReadStates = { ...readStates };
    delete newReadStates[notificationId];
    setReadStates(newReadStates);
    saveReadStates(newReadStates);
    
    // Remove from notifications list
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    // Calculate new unread count
    const wasUnread = notificationToDelete && !notificationToDelete.read;
    const newUnreadCount = wasUnread ? stats.unread - 1 : stats.unread;
    
    // Update stats
    if (notificationToDelete) {
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: newUnreadCount,
        today: new Date(notificationToDelete.createdAt).toDateString() === new Date().toDateString() ? prev.today - 1 : prev.today,
        highPriority: notificationToDelete.priority === 'high' ? prev.highPriority - 1 : prev.highPriority,
        actionRequired: notificationToDelete.requiresAction ? prev.actionRequired - 1 : prev.actionRequired
      }));
    }

    // Sync with HRNavbar
    syncUnreadCount(newUnreadCount);

    setSuccess('Notification deleted');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Delete all notifications with persistence and sync with HRNavbar
  const deleteAllNotifications = () => {
    // Clear all read states
    setReadStates({});
    saveReadStates({});
    
    // Clear notifications list
    setNotifications([]);
    
    // Reset stats
    setStats({
      total: 0,
      unread: 0,
      today: 0,
      highPriority: 0,
      actionRequired: 0
    });

    // Sync with HRNavbar (set to 0)
    syncUnreadCount(0);

    setSuccess('All notifications deleted');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Fetch notifications from all endpoints
  const fetchAllNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load current read states
      const currentReadStates = loadReadStates();
      
      // Fetch from each endpoint and combine
      const allNotifications = [];

      try {
        // 1. Fetch attendance notifications (including clock-ins and clock-outs)
        const attendanceRes = await axios.get(`${API_ENDPOINTS.attendance}/attend`, getAuthHeaders());
        if (attendanceRes.data.success) {
          const attendanceData = attendanceRes.data.data.attendance || [];
          
          // Get today's date
          const today = new Date().toISOString().split('T')[0];
          
          // Process each attendance record
          attendanceData.forEach(record => {
            const status = record.status || 'unknown';
            
            // Create notification for clock-in
            if (record.clockIn) {
              const notificationId = `clockin_${record._id}`;
              const clockInTime = new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              allNotifications.push({
                id: notificationId,
                title: 'Clock In',
                message: `${record.employee?.firstname} ${record.employee?.lastname} clocked in at ${clockInTime}`,
                type: 'clock_in',
                priority: 'low',
                createdAt: record.clockIn || new Date().toISOString(),
                read: currentReadStates[notificationId] || false,
              });
            }
            
            // Create notification for clock-out
            if (record.clockOut) {
              const notificationId = `clockout_${record._id}`;
              const clockOutTime = new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              // Calculate work duration
              let workDuration = '';
              if (record.clockIn && record.clockOut) {
                const clockInTime = new Date(record.clockIn);
                const clockOutTimeDate = new Date(record.clockOut);
                const durationMs = clockOutTimeDate - clockInTime;
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                workDuration = ` after ${hours}h ${minutes}m`;
              }
              
              allNotifications.push({
                id: notificationId,
                title: 'Clock Out',
                message: `${record.employee?.firstname} ${record.employee?.lastname} clocked out at ${clockOutTime}${workDuration}`,
                type: 'clock_out',
                priority: 'low',
                createdAt: record.clockOut || new Date().toISOString(),
                read: currentReadStates[notificationId] || false,
              });
            }
            
            // Create notifications for today's attendance status
            if (record.date === today) {
              const notificationId = `attendance_${record._id}`;
              const title = `Attendance: ${record.employee?.firstname} ${record.employee?.lastname}`;
              const message = `${record.employee?.firstname} ${record.employee?.lastname} is marked as ${status} today`;
              
              allNotifications.push({
                id: notificationId,
                title,
                message,
                type: 'attendance',
                priority: status === 'absent' ? 'high' : status === 'late' ? 'medium' : 'low',
                createdAt: record.createdAt || new Date().toISOString(),
                read: currentReadStates[notificationId] || false,
                requiresAction: status === 'absent'
              });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
      }

      try {
        // 2. Fetch leave requests
        const leaveRes = await axios.get(`${API_ENDPOINTS.leave}/allLeave`, getAuthHeaders());
        if (leaveRes.data.data) {
          const leaveData = leaveRes.data.data;
          
          // Create notifications for pending leaves
          const pendingLeaves = leaveData.filter(leave => leave.status === 'pending');
          
          pendingLeaves.forEach(leave => {
            const notificationId = `leave_${leave._id}`;
            allNotifications.push({
              id: notificationId,
              title: 'Pending Leave Request',
              message: `${leave.employee?.firstname} ${leave.employee?.lastname} has requested ${leave.totalDays} days leave (${leave.leaveType})`,
              type: 'leave',
              priority: 'high',
              requiresAction: true,
              createdAt: leave.appliedAt || new Date().toISOString(),
              read: currentReadStates[notificationId] || false,
            });
          });

          // Create notifications for approved leaves
          const approvedLeaves = leaveData.filter(leave => leave.status === 'approved' && 
            new Date(leave.approvedAt || leave.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000));
          
          approvedLeaves.forEach(leave => {
            const notificationId = `leave_approved_${leave._id}`;
            allNotifications.push({
              id: notificationId,
              title: 'Leave Approved',
              message: `${leave.employee?.firstname} ${leave.employee?.lastname}'s leave request has been approved`,
              type: 'leave',
              priority: 'low',
              createdAt: leave.approvedAt || leave.updatedAt || new Date().toISOString(),
              read: currentReadStates[notificationId] || false,
            });
          });
        }
      } catch (err) {
        console.error('Error fetching leaves:', err);
      }

      try {
        // 3. Fetch employee updates
        const employeesRes = await axios.get(`${API_ENDPOINTS.employees}/allEmployees`, getAuthHeaders());
        if (employeesRes.data.employees) {
          const employees = employeesRes.data.employees;
          
          // Get recent employees (last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const recentEmployees = employees.filter(emp => 
            new Date(emp.createdAt) > oneDayAgo
          );
          
          recentEmployees.forEach(emp => {
            const notificationId = `employee_${emp._id}`;
            allNotifications.push({
              id: notificationId,
              title: 'New Employee Added',
              message: `${emp.firstname} ${emp.lastname} has been added to ${emp.department?.name || 'department'} as ${emp.jobTitle || 'employee'}`,
              type: 'employee',
              priority: 'medium',
              createdAt: emp.createdAt,
              read: currentReadStates[notificationId] || false,
            });
          });
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }

      try {
        // 4. Fetch documents
        const docsRes = await axios.get(`${API_ENDPOINTS.documents}/all`, getAuthHeaders());
        if (docsRes.data.success) {
          const documents = docsRes.data.data || [];
          
          // Get recent documents (last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const recentDocs = documents.filter(doc => 
            new Date(doc.createdAt) > oneDayAgo
          ).slice(0, 5);
          
          recentDocs.forEach(doc => {
            const notificationId = `document_${doc._id}`;
            allNotifications.push({
              id: notificationId,
              title: 'New Document Uploaded',
              message: `${doc.title} has been uploaded by ${doc.uploadedBy?.fullname || 'user'}`,
              type: 'document',
              priority: 'low',
              createdAt: doc.createdAt,
              read: currentReadStates[notificationId] || false,
            });
          });
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }

      try {
        // 5. Fetch departments
        const deptRes = await axios.get(`${API_ENDPOINTS.departments}/Departments`, getAuthHeaders());
        let departments = [];
        
        if (Array.isArray(deptRes.data)) {
          departments = deptRes.data;
        } else if (deptRes.data?.data) {
          departments = Array.isArray(deptRes.data.data) ? deptRes.data.data : Object.values(deptRes.data.data);
        }
        
        // Get recent departments (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentDepts = departments
          .filter(dept => new Date(dept.createdAt) > oneWeekAgo)
          .slice(0, 3);
        
        recentDepts.forEach(dept => {
          const notificationId = `department_${dept._id}`;
          allNotifications.push({
            id: notificationId,
            title: 'Department Update',
            message: `${dept.name} department has been ${dept.status === 'active' ? 'activated' : 'created'}`,
            type: 'department',
            priority: 'medium',
            createdAt: dept.createdAt,
            read: currentReadStates[notificationId] || false,
          });
        });
      } catch (err) {
        console.error('Error fetching departments:', err);
      }

      try {
        // 6. Fetch organisations
        const orgRes = await axios.get(`${API_ENDPOINTS.organisations}/org`, getAuthHeaders());
        let organisations = [];
        
        if (orgRes.data?.success) {
          if (Array.isArray(orgRes.data.data)) {
            organisations = orgRes.data.data;
          } else if (orgRes.data.data && typeof orgRes.data.data === 'object') {
            organisations = Object.values(orgRes.data.data);
          }
        }
        
        // Get recent organisations (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentOrgs = organisations
          .filter(org => new Date(org.createdAt) > oneWeekAgo)
          .slice(0, 3);
        
        recentOrgs.forEach(org => {
          const notificationId = `organisation_${org._id}`;
          allNotifications.push({
            id: notificationId,
            title: 'Organisation Update',
            message: `${org.name} has been ${org.status === 'active' ? 'activated' : 'created'}`,
            type: 'organisation',
            priority: 'medium',
            createdAt: org.createdAt,
            read: currentReadStates[notificationId] || false,
          });
        });
      } catch (err) {
        console.error('Error fetching organisations:', err);
      }

      try {
        // 7. Fetch users
        const usersRes = await axios.get(`${API_ENDPOINTS.users}/`, getAuthHeaders());
        if (usersRes.data.success) {
          const users = usersRes.data.data || [];
          
          // Get recent users (last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const recentUsers = users
            .filter(user => new Date(user.createdAt) > oneDayAgo)
            .slice(0, 3);
          
          recentUsers.forEach(user => {
            const notificationId = `user_${user._id}`;
            allNotifications.push({
              id: notificationId,
              title: 'User Account Created',
              message: `${user.fullname} (${user.role}) account has been created`,
              type: 'user',
              priority: 'medium',
              createdAt: user.createdAt,
              read: currentReadStates[notificationId] || false,
            });
          });
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }

      try {
        // 8. Fetch announcements
        const announcementsRes = await axios.get(`${API_ENDPOINTS.announcements}/all`, getAuthHeaders());
        if (announcementsRes.data) {
          const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : announcementsRes.data.data || [];
          
          // Get recent announcements (last 24 hours)
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          const recentAnnouncements = announcements
            .filter(ann => new Date(ann.createdAt) > oneDayAgo)
            .slice(0, 5);
          
          recentAnnouncements.forEach(announcement => {
            const notificationId = `announcement_${announcement._id}`;
            const priority = announcement.priority === 'high' ? 'high' : 
                           announcement.priority === 'medium' ? 'medium' : 'low';
            
            allNotifications.push({
              id: notificationId,
              title: 'New Announcement',
              message: `${announcement.title}: ${announcement.content?.substring(0, 100)}${announcement.content?.length > 100 ? '...' : ''}`,
              type: 'announcement',
              priority: priority,
              createdAt: announcement.createdAt || new Date().toISOString(),
              read: currentReadStates[notificationId] || false,
            });
          });
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }

      // Sort all notifications by date (newest first)
      const sortedNotifications = allNotifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 100); // Limit to 100 notifications

      setNotifications(sortedNotifications);
      
      // Calculate stats
      calculateStats(sortedNotifications);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics from notifications
  const calculateStats = (notificationsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const unreadCount = calculateUnreadCount(notificationsList);
    
    const statsData = {
      total: notificationsList.length,
      unread: unreadCount,
      today: notificationsList.filter(n => new Date(n.createdAt) >= today).length,
      highPriority: notificationsList.filter(n => n.priority === 'high').length,
      actionRequired: notificationsList.filter(n => n.requiresAction).length
    };
    
    setStats(statsData);
    
    // Sync unread count with HRNavbar
    syncUnreadCount(unreadCount);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    
    if (!notification.read) {
      markAsRead(notification.id, true);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Apply read status filter
    if (filter === 'unread') {
      filtered = filtered.filter(notif => !notif.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(notif => notif.read);
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(notif => notif.priority === filterPriority);
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(notif => notif.type === filterType);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(notif =>
        notif.title?.toLowerCase().includes(query) ||
        notif.message?.toLowerCase().includes(query) ||
        notif.type?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilter('all');
    setFilterPriority('all');
    setFilterType('all');
    setSearchTerm('');
  };

  // Initialize on component mount
  useEffect(() => {
    fetchAllNotifications();
    
    // Set up periodic refresh (every 2 minutes)
    const refreshInterval = setInterval(() => {
      fetchAllNotifications();
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchAllNotifications]);

  // Listen for when HRNavbar opens notifications (to mark all as read)
  useEffect(() => {
    const handleNotificationReadFromNavbar = (event) => {
      console.log('Received notificationRead event from HRNavbar');
      
      // Mark all notifications as read when opened from navbar
      if (notifications.length > 0 && stats.unread > 0) {
        markAllAsRead();
      }
    };
    
    window.addEventListener('notificationRead', handleNotificationReadFromNavbar);
    
    return () => {
      window.removeEventListener('notificationRead', handleNotificationReadFromNavbar);
    };
  }, [notifications, stats.unread]);

  // Periodically check and sync unread count with HRNavbar
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const currentUnreadCount = calculateUnreadCount(notifications);
      const storedCount = parseInt(localStorage.getItem('hr_unread_notifications_count') || '0');
      
      if (currentUnreadCount !== storedCount) {
        console.log('Count mismatch detected, syncing with HRNavbar...');
        syncUnreadCount(currentUnreadCount);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(syncInterval);
  }, [notifications, calculateUnreadCount, syncUnreadCount]);

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-left">
          <div className="header-icon">
            <Bell size={28} />
            {stats.unread > 0 && (
              <span className="header-unread-badge">{stats.unread}</span>
            )}
          </div>
          <div>
            <h1>Notifications</h1>
            <div className="header-stats">
              <span className="stat-pill total">
                <Bell size={12} />
                Total: {stats.total}
              </span>
              <span className="stat-pill unread">
                <Activity size={12} />
                Unread: {stats.unread}
              </span>
              <span className="stat-pill read">
                <CheckCircle size={12} />
                Read: {stats.total - stats.unread}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchAllNotifications}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            className="mark-all-btn"
            onClick={() => setShowMarkAllDialog(true)}
            disabled={stats.unread === 0}
          >
            <CheckCircle size={18} />
            Mark All as Read
          </button>
         </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-content">
            <div className="stat-icon">
              <Bell size={24} />
            </div>
            <div className="stat-info">
              <h3>Total</h3>
              <p className="stat-value">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stat-card unread">
          <div className="stat-content">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-info">
              <h3>Unread</h3>
              <p className="stat-value">{stats.unread}</p>
            </div>
          </div>
        </div>
        <div className="stat-card today">
          <div className="stat-content">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>Today</h3>
              <p className="stat-value">{stats.today}</p>
            </div>
          </div>
        </div>
        <div className="stat-card high-priority">
          <div className="stat-content">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>High Priority</h3>
              <p className="stat-value">{stats.highPriority}</p>
            </div>
          </div>
        </div>
        <div className="stat-card action-required">
          <div className="stat-content">
            <div className="stat-icon">
              <CheckSquare size={24} />
            </div>
            <div className="stat-info">
              <h3>Action Required</h3>
              <p className="stat-value">{stats.actionRequired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-container">
          <div className="search-input-group">
                  <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search-btn"
              >
                <X className="clear-icon" />
              </button>
            )}
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({stats.unread})
          </button>
          <button 
            className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - stats.unread})
          </button>
        </div>
        <div className="filter-actions">
          <div className="filter-dropdown">
            <Filter size={16} />
            <select 
              className="filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="filter-dropdown">
            <Settings size={16} />
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.entries(notificationTypes).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
          </div>
          {(filter !== 'all' || filterPriority !== 'all' || filterType !== 'all' || searchTerm) && (
            <button 
              className="clear-filters-btn"
              onClick={clearAllFilters}
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span className="results-count">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </span>
        {(filter !== 'all' || filterPriority !== 'all' || filterType !== 'all' || searchTerm) && (
          <span className="active-filters">
            <Filter size={14} />
            Filters active
            {filter !== 'all' && ` • Status: ${filter === 'unread' ? 'Unread' : 'Read'}`}
            {filterPriority !== 'all' && ` • Priority: ${priorityLevels[filterPriority]?.label || filterPriority}`}
            {filterType !== 'all' && ` • Type: ${notificationTypes[filterType]?.label || filterType}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <h3>No notifications found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button
              onClick={clearAllFilters}
              className="reset-filters-btn"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => {
              const typeConfig = notificationTypes[notification.type] || notificationTypes.system;
              const priorityConfig = priorityLevels[notification.priority] || priorityLevels.medium;
              const Icon = typeConfig.icon;
              const PriorityIcon = priorityConfig.icon;

              return (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-icon">
                      <Icon size={20} color={typeConfig.color} />
                      {!notification.read && (
                        <span className="unread-dot"></span>
                      )}
                    </div>
                    <div className="notification-details">
                      <div className="notification-header">
                        <div className="title-wrapper">
                          <h4 className="notification-title">{notification.title}</h4>
                          {!notification.read && (
                            <span className="title-unread-indicator"></span>
                          )}
                        </div>
                        <div className="notification-header-right">
                          <span className={`read-badge ${notification.read ? 'read' : 'unread'}`}>
                            {notification.read ? (
                              <>
                                <CheckCircle size={10} />
                                Read
                              </>
                            ) : (
                              <>
                                <div className="unread-indicator"></div>
                                Unread
                              </>
                            )}
                          </span>
                          <span className="notification-time">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className={`notification-type type-${notification.type}`}>
                          {typeConfig.label}
                        </span>
                        <span className={`notification-priority priority-${notification.priority}`}>
                          <PriorityIcon size={12} />
                          {priorityConfig.label}
                        </span>
                        {notification.requiresAction && (
                          <span className="action-required-badge">
                            <CheckSquare size={12} />
                            Action Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id, true);
                        }}
                        title="Mark as read"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {notification.read && (
                      <button 
                        className="mark-unread-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id, false);
                        }}
                        title="Mark as unread"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notification Details</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedNotification(null)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="notification-detail-header">
                <div className="detail-icon">
                  {(() => {
                    const Icon = notificationTypes[selectedNotification.type]?.icon || Bell;
                    return <Icon size={32} color={notificationTypes[selectedNotification.type]?.color} />;
                  })()}
                  {!selectedNotification.read && (
                    <span className="detail-unread-dot"></span>
                  )}
                </div>
                <div className="detail-title">
                  <h4>{selectedNotification.title}</h4>
                  <span className="detail-time">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="detail-content">
                <p className="detail-message">{selectedNotification.message}</p>
              </div>
              <div className="detail-meta">
                <div className="meta-item">
                  <strong>Type:</strong>
                  <span className={`type-badge type-${selectedNotification.type}`}>
                    {notificationTypes[selectedNotification.type]?.label || 'System'}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Priority:</strong>
                  <span className={`priority-badge priority-${selectedNotification.priority}`}>
                    {priorityLevels[selectedNotification.priority]?.label || 'Medium'}
                  </span>
                </div>
                <div className="meta-item">
                  <strong>Status:</strong>
                  <span className={`status-badge ${selectedNotification.read ? 'read' : 'unread'}`}>
                    {selectedNotification.read ? (
                      <>
                        <CheckCircle size={12} />
                        Read
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} />
                        Unread
                      </>
                    )}
                  </span>
                </div>
                {selectedNotification.requiresAction && (
                  <div className="meta-item">
                    <strong>Action Required:</strong>
                    <span className="action-required-badge">
                      <CheckSquare size={12} />
                      Yes
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
              {selectedNotification.read ? (
                <button 
                  className="btn-warning"
                  onClick={() => {
                    markAsRead(selectedNotification.id, false);
                    setSelectedNotification(null);
                  }}
                >
                  <Eye size={16} />
                  Mark as Unread
                </button>
              ) : (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    markAsRead(selectedNotification.id, true);
                    setSelectedNotification(null);
                  }}
                >
                  <CheckCircle size={16} />
                  Mark as Read
                </button>
              )}
              <button 
                className="btn-danger"
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                  setSelectedNotification(null);
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark All as Read Confirmation */}
      {showMarkAllDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <div className="dialog-header">
              <CheckCircle size={32} />
              <h3>Mark All as Read</h3>
            </div>
            <p>Are you sure you want to mark all notifications as read?</p>
            <div className="dialog-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowMarkAllDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  markAllAsRead();
                  setShowMarkAllDialog(false);
                }}
              >
                Mark All as Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation */}
      {showDeleteAllDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <div className="dialog-header">
              <Trash2 size={32} />
              <h3>Delete All Notifications</h3>
            </div>
            <p>Are you sure you want to delete all notifications? This action cannot be undone.</p>
            <div className="dialog-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteAllDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={() => {
                  deleteAllNotifications();
                  setShowDeleteAllDialog(false);
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;