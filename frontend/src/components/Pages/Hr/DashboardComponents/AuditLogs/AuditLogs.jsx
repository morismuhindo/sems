import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FileText,
  Clock,
  Calendar,
  User,
  Building,
  Users,
  Shield,
  Trash2,
  Edit,
  Plus,
  Download,
  Eye,
  Search,
  Filter,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Key,
  ChevronDown,
  ChevronUp,
  Activity,
  History,
  Upload,
  UserPlus,
  UserMinus,
  Database,
  Server,
  Bell,
  CreditCard,
  LogOut,
  LogIn
} from 'lucide-react';
import './AuditLogs.css';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterComponent, setFilterComponent] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    creates: 0,
    uploads: 0,
    approvals: 0,
    rejects: 0,
    views: 0,
    exports: 0,
    logins: 0,
    deletes: 0,
    updates: 0,
    clockIns: 0,
    clockOuts: 0
  });

  const API_ENDPOINTS = {
    attendance: '/api/attend',
    leave: '/api/leave',
    employees: '/api/employees',
    documents: '/api/doc',
    departments: '/api',
    organisations: '/api/org',
    users: '/api',
    announcements: '/api/announcement',
    idcards: '/api/id-cards'
  };

  const actionTypes = {
    CREATE: { label: 'Create', icon: Plus, color: '#10b981', bgColor: '#d1fae5' },
    UPDATE: { label: 'Update', icon: Edit, color: '#f59e0b', bgColor: '#fef3c7' },
    DELETE: { label: 'Delete', icon: Trash2, color: '#ef4444', bgColor: '#fee2e2' },
    VIEW: { label: 'View', icon: Eye, color: '#3b82f6', bgColor: '#dbeafe' },
    EXPORT: { label: 'Export', icon: Download, color: '#ec4899', bgColor: '#fce7f3' },
    UPLOAD: { label: 'Upload', icon: Upload, color: '#0ea5e9', bgColor: '#e0f2fe' },
    DOWNLOAD: { label: 'Download', icon: Download, color: '#14b8a6', bgColor: '#ccfbf1' },
    APPROVE: { label: 'Approve', icon: CheckCircle, color: '#10b981', bgColor: '#d1fae5' },
    REJECT: { label: 'Reject', icon: XCircle, color: '#ef4444', bgColor: '#fee2e2' },
    MARK_ABSENT: { label: 'Mark Absent', icon: UserMinus, color: '#f97316', bgColor: '#ffedd5' },
    AUTO_MARK: { label: 'Auto Mark', icon: Activity, color: '#6366f1', bgColor: '#e0e7ff' },
    CLOCK_IN: { label: 'Clock In', icon: LogIn, color: '#10b981', bgColor: '#d1fae5' },
    CLOCK_OUT: { label: 'Clock Out', icon: LogOut, color: '#ef4444', bgColor: '#fee2e2' },
    LOGIN: { label: 'Login', icon: Key, color: '#8b5cf6', bgColor: '#f3e8ff' },
    VERIFY: { label: 'Verify', icon: Shield, color: '#0ea5e9', bgColor: '#e0f2fe' },
    CANCEL: { label: 'Cancel', icon: X, color: '#6b7280', bgColor: '#f3f4f6' },
    REGISTER: { label: 'Register', icon: UserPlus, color: '#8b5cf6', bgColor: '#f3e8ff' },
    ANNOUNCE: { label: 'Announce', icon: Bell, color: '#f59e0b', bgColor: '#fef3c7' },
    GENERATE_ID: { label: 'Generate ID', icon: CreditCard, color: '#14b8a6', bgColor: '#ccfbf1' }
  };

  const componentTypes = {
    attendance: { label: 'Attendance', icon: Clock, color: '#3b82f6' },
    leave: { label: 'Leave', icon: Calendar, color: '#10b981' },
    employee: { label: 'Employee', icon: Users, color: '#8b5cf6' },
    document: { label: 'Document', icon: FileText, color: '#f59e0b' },
    department: { label: 'Department', icon: Building, color: '#ef4444' },
    organisation: { label: 'Organisation', icon: Building, color: '#ec4899' },
    user: { label: 'User', icon: User, color: '#6366f1' },
    idcard: { label: 'ID Card', icon: CreditCard, color: '#14b8a6' },
    announcement: { label: 'Announcement', icon: Bell, color: '#f97316' },
    system: { label: 'System', icon: Server, color: '#6b7280' },
    auth: { label: 'Authentication', icon: Shield, color: '#8b5cf6' }
  };

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

  const initializeAuditLogs = useCallback(() => {
    try {
      const storedLogs = localStorage.getItem('audit_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        setAuditLogs(parsedLogs);
        calculateStats(parsedLogs);
      }
    } catch (err) {
    }
  }, []);

  const saveAuditLogs = (logs) => {
    try {
      localStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (err) {
    }
  };

  const logAuditEvent = useCallback((event) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const auditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: {
        id: currentUser._id || 'system',
        name: currentUser.fullname || 'System',
        role: currentUser.role || 'system'
      },
      ...event
    };

    setAuditLogs(prev => {
      const newLogs = [auditEvent, ...prev];
      saveAuditLogs(newLogs);
      calculateStats(newLogs);
      return newLogs;
    });
  }, []);

  const calculateStats = (logs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statsData = {
      total: logs.length,
      today: logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= today;
      }).length,
      creates: logs.filter(log => log.action === 'CREATE').length,
      uploads: logs.filter(log => log.action === 'UPLOAD').length,
      approvals: logs.filter(log => log.action === 'APPROVE').length,
      rejects: logs.filter(log => log.action === 'REJECT').length,
      views: logs.filter(log => log.action === 'VIEW').length,
      exports: logs.filter(log => log.action === 'EXPORT').length,
      logins: logs.filter(log => log.action === 'LOGIN').length,
      deletes: logs.filter(log => log.action === 'DELETE').length,
      updates: logs.filter(log => log.action === 'UPDATE').length,
      clockIns: logs.filter(log => log.action === 'CLOCK_IN').length,
      clockOuts: logs.filter(log => log.action === 'CLOCK_OUT').length
    };
    
    setStats(statsData);
  };

  const formatUserName = (user) => {
    if (!user) return 'System';
    if (typeof user === 'string') return user;
    if (user.fullname) return user.fullname;
    if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
    if (user.firstname) return user.firstname;
    if (user.lastname) return user.lastname;
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserRole = (user) => {
    if (!user) return 'system';
    if (user?.role) return user?.role;
    if (user.userRole) return user.userRole;
    return 'employee';
  };

  const fetchAttendanceAudits = async (allLogs) => {
    try {
      const attendanceRes = await axios.get(`${API_ENDPOINTS.attendance}/attend`, getAuthHeaders());
      if (attendanceRes.data.success) {
        const attendanceData = attendanceRes.data.data.attendance || [];
        
        attendanceData.slice(0, 50).forEach(record => {
          if (record.clockIn) {
            const existingClockInLog = allLogs.find(log => 
              log.component === 'attendance' && 
              log.entityId === record._id &&
              log.action === 'CLOCK_IN'
            );
            
            if (!existingClockInLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser) || 'attendancemanager';
              
              allLogs.push({
                id: `attendance_clockin_${record._id}_${Date.now()}`,
                timestamp: record.clockIn || record.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || record.userId || 'system',
                  name: userName,
                  role: userRole
                },
                action: 'CLOCK_IN',
                component: 'attendance',
                entityId: record._id,
                entityName: `Clock-in for ${record.employee?.firstname} ${record.employee?.lastname}`,
                details: {
                  employeeCode: record.employee?.employeeCode,
                  clockInTime: record.clockIn,
                  status: 'clocked-in',
                  date: record.date,
                }
              });
            }
          }
          
          if (record.clockOut) {
            const existingClockOutLog = allLogs.find(log => 
              log.component === 'attendance' && 
              log.entityId === record._id &&
              log.action === 'CLOCK_OUT'
            );
            
            if (!existingClockOutLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser) || 'attendancemanager';
              
              let workDuration = 'N/A';
              if (record.clockIn && record.clockOut) {
                const clockInTime = new Date(record.clockIn);
                const clockOutTime = new Date(record.clockOut);
                const durationMs = clockOutTime - clockInTime;
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                workDuration = `${hours}h ${minutes}m`;
              }
              
              allLogs.push({
                id: `attendance_clockout_${record._id}_${Date.now()}`,
                timestamp: record.clockOut || record.updatedAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || record.userId || 'system',
                  name: userName,
                  role: userRole
                },
                action: 'CLOCK_OUT',
                component: 'attendance',
                entityId: record._id,
                entityName: `Clock-out for ${record.employee?.firstname} ${record.employee?.lastname}`,
                details: {
                  employeeCode: record.employee?.employeeCode,
                  clockInTime: record.clockIn,
                  clockOutTime: record.clockOut,
                  workDuration: workDuration,
                  status: 'clocked-out',
                  date: record.date,
                }
              });
            }
          }
          
          if (record.status === 'absent' || record.autoMarked) {
            const existingLog = allLogs.find(log => 
              log.component === 'attendance' && 
              log.entityId === record._id &&
              (log.action === 'MARK_ABSENT' || log.action === 'AUTO_MARK')
            );
            
            if (!existingLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser) || 'attendancemanager';
              
              let action = 'UPDATE';
              if (record.autoMarked) action = 'AUTO_MARK';
              else if (record.status === 'absent') action = 'MARK_ABSENT';
              
              allLogs.push({
                id: `attendance_${action.toLowerCase()}_${record._id}_${Date.now()}`,
                timestamp: record.updatedAt || record.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || record.userId || 'system',
                  name: userName,
                  role: userRole
                },
                action: action,
                component: 'attendance',
                entityId: record._id,
                entityName: `${action === 'MARK_ABSENT' ? 'Marked absent' : 'Auto-marked'} for ${record.employee?.firstname} ${record.employee?.lastname}`,
                details: {
                  employeeCode: record.employee?.employeeCode,
                  status: record.status,
                  date: record.date,
                  autoMarked: record.autoMarked,
                  remarks: record.remarks || 'N/A'
                }
              });
            }
          }
        });
      }
    } catch (err) {
    }
    return allLogs;
  };

  const fetchAllAuditData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let allLogs = [...auditLogs];

      allLogs = await fetchAttendanceAudits(allLogs);

      try {
        const leaveRes = await axios.get(`${API_ENDPOINTS.leave}/allLeave`, getAuthHeaders());
        if (leaveRes.data.data) {
          const leaveData = leaveRes.data.data;
          
          leaveData.slice(0, 20).forEach(leave => {
            const existingLog = allLogs.find(log => 
              log.component === 'leave' && 
              log.entityId === leave._id
            );
            
            if (!existingLog) {
              let user = {
                id: leave.employee?._id,
                name: formatUserName(leave.employee),
                role: getUserRole(leave.employee) || 'employee'
              };
              
              let action = 'CREATE';
              if (leave.status === 'approved') action = 'APPROVE';
              else if (leave.status === 'rejected') action = 'REJECT';
              else if (leave.status === 'cancelled') action = 'CANCEL';
              
              if (leave.status === 'approved' || leave.status === 'rejected') {
                user = {
                  id: leave.approvedBy?._id || 'hr_system',
                  name: leave.approvedBy ? formatUserName(leave.approvedBy) : 'HR/HOD',
                  role: leave.approvedBy ? getUserRole(leave.approvedBy) : 'hr'
                };
              }
              
              allLogs.push({
                id: `leave_${leave._id}`,
                timestamp: leave.appliedAt || leave.updatedAt || new Date().toISOString(),
                user: user,
                action: action,
                component: 'leave',
                entityId: leave._id,
                entityName: `Leave request by ${leave.employee?.firstname} ${leave.employee?.lastname}`,
                details: {
                  type: leave.leaveType,
                  status: leave.status,
                  days: leave.totalDays,
                  startDate: leave.startDate,
                  endDate: leave.endDate,
                  reason: leave.reason?.substring(0, 100)
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const employeesRes = await axios.get(`${API_ENDPOINTS.employees}/allEmployees`, getAuthHeaders());
        if (employeesRes.data.employees) {
          const employees = employeesRes.data.employees;
          
          employees.slice(0, 20).forEach(emp => {
            const existingLog = allLogs.find(log => 
              log.component === 'employee' && 
              log.entityId === emp._id
            );
            
            if (!existingLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser) || 'hr';
              
              allLogs.push({
                id: `employee_${emp._id}`,
                timestamp: emp.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || 'hr_system',
                  name: userName,
                  role: userRole
                },
                action: 'CREATE',
                component: 'employee',
                entityId: emp._id,
                entityName: `${emp.firstname} ${emp.lastname}`,
                details: {
                  employeeCode: emp.employeeCode,
                  department: emp.department?.name,
                  jobTitle: emp.jobTitle,
                  status: emp.status,
                  email: emp.email
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const docsRes = await axios.get(`${API_ENDPOINTS.documents}/all`, getAuthHeaders());
        if (docsRes.data.success) {
          const documents = docsRes.data.data || [];
          
          documents.slice(0, 15).forEach(doc => {
            const existingLog = allLogs.find(log => 
              log.component === 'document' && 
              log.entityId === doc._id
            );
            
            if (!existingLog) {
              allLogs.push({
                id: `document_${doc._id}`,
                timestamp: doc.createdAt || new Date().toISOString(),
                user: {
                  id: doc.uploadedBy?._id,
                  name: doc.uploadedBy ? formatUserName(doc.uploadedBy) : 'User',
                  role: doc.uploadedBy ? getUserRole(doc.uploadedBy) : 'employee'
                },
                action: 'UPLOAD',
                component: 'document',
                entityId: doc._id,
                entityName: doc.title,
                details: {
                  type: doc.type,
                  description: doc.description?.substring(0, 100),
                  fileUrl: doc.fileUrl
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const deptRes = await axios.get(`${API_ENDPOINTS.departments}/depart/Departments`, getAuthHeaders());
        let departments = [];
        
        if (Array.isArray(deptRes.data)) {
          departments = deptRes.data;
        } else if (deptRes.data?.data) {
          departments = Array.isArray(deptRes.data.data) ? deptRes.data.data : Object.values(deptRes.data.data);
        }
        
        departments.slice(0, 15).forEach(dept => {
          const existingLog = allLogs.find(log => 
            log.component === 'department' && 
            log.entityId === dept._id
          );
          
          if (!existingLog) {
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            const userName = formatUserName(currentUser);
            const userRole = getUserRole(currentUser) || 'hr';
            
            allLogs.push({
              id: `department_${dept._id}`,
              timestamp: dept.createdAt || new Date().toISOString(),
              user: {
                id: currentUser._id || 'hr_system',
                name: userName,
                role: userRole
              },
              action: 'CREATE',
              component: 'department',
              entityId: dept._id,
              entityName: dept.name,
              details: {
                code: dept.code,
                departmentId: dept.departmentId,
                status: dept.status,
                description: dept.description?.substring(0, 100)
              }
            });
          }
        });
      } catch (err) {
      }

      try {
        const orgRes = await axios.get(`${API_ENDPOINTS.organisations}/org`, getAuthHeaders());
        let organisations = [];
        
        if (orgRes.data?.success) {
          if (Array.isArray(orgRes.data.data)) {
            organisations = orgRes.data.data;
          } else if (orgRes.data.data && typeof orgRes.data.data === 'object') {
            organisations = Object.values(orgRes.data.data);
          }
        }
        
        organisations.slice(0, 10).forEach(org => {
          const existingLog = allLogs.find(log => 
            log.component === 'organisation' && 
            log.entityId === org._id
          );
          
          if (!existingLog) {
            const currentUser = JSON.parse(localStorage.getItem('user')) || {};
            const userName = formatUserName(currentUser);
            const userRole = getUserRole(currentUser) || 'hr';
            
            allLogs.push({
              id: `organisation_${org._id}`,
              timestamp: org.createdAt || new Date().toISOString(),
              user: {
                id: currentUser._id || 'hr_system',
                name: userName,
                role: userRole
              },
              action: 'CREATE',
              component: 'organisation',
              entityId: org._id,
              entityName: org.name,
              details: {
                industry: org.industry,
                registrationNumber: org.registrationNumber,
                email: org.email,
                status: org.status
              }
            });
          }
        });
      } catch (err) {
      }

      try {
        const usersRes = await axios.get(`${API_ENDPOINTS.users}/`, getAuthHeaders());
        if (usersRes.data.success) {
          const users = usersRes.data.data || [];
          
          users.slice(0, 20).forEach(user => {
            const existingLog = allLogs.find(log => 
              log.component === 'user' && 
              log.entityId === user._id
            );
            
            if (!existingLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const currentUserName = formatUserName(currentUser);
              const currentUserRole = getUserRole(currentUser) || 'hr';
              
              let action = 'CREATE';
              if (user.role === 'hr' && user.fullname?.includes('HR')) {
                action = 'REGISTER';
              }
              
              allLogs.push({
                id: `user_${user._id}`,
                timestamp: user.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || 'hr_system',
                  name: currentUserName,
                  role: currentUserRole
                },
                action: action,
                component: user.role === 'hr' ? 'auth' : 'user',
                entityId: user._id,
                entityName: formatUserName(user),
                details: {
                  email: user.email,
                  role: user.role,
                  status: user.status,
                  employeeCode: user.employee?.employeeCode
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const announcementsRes = await axios.get(`${API_ENDPOINTS.announcements}/all`, getAuthHeaders());
        if (announcementsRes.data) {
          const announcements = Array.isArray(announcementsRes.data) ? announcementsRes.data : announcementsRes.data.data || [];
          
          announcements.slice(0, 10).forEach(announcement => {
            const existingLog = allLogs.find(log => 
              log.component === 'announcement' && 
              log.entityId === announcement._id
            );
            
            if (!existingLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser);
              
              allLogs.push({
                id: `announcement_${announcement._id}`,
                timestamp: announcement.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || 'system',
                  name: userName,
                  role: userRole || 'hr'
                },
                action: 'ANNOUNCE',
                component: 'announcement',
                entityId: announcement._id,
                entityName: announcement.title,
                details: {
                  priority: announcement.priority,
                  target: announcement.department?.name || 'All',
                  content: announcement.content?.substring(0, 100)
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const idCardsRes = await axios.get(`${API_ENDPOINTS.idcards}/all`, getAuthHeaders());
        if (idCardsRes.data) {
          const idCards = Array.isArray(idCardsRes.data) ? idCardsRes.data : idCardsRes.data.data || [];
          
          idCards.slice(0, 10).forEach(idCard => {
            const existingLog = allLogs.find(log => 
              log.component === 'idcard' && 
              log.entityId === idCard._id
            );
            
            if (!existingLog) {
              const currentUser = JSON.parse(localStorage.getItem('user')) || {};
              const userName = formatUserName(currentUser);
              const userRole = getUserRole(currentUser) || 'hr';
              
              allLogs.push({
                id: `idcard_${idCard._id}`,
                timestamp: idCard.createdAt || new Date().toISOString(),
                user: {
                  id: currentUser._id || 'hr_system',
                  name: userName,
                  role: userRole
                },
                action: 'GENERATE_ID',
                component: 'idcard',
                entityId: idCard._id,
                entityName: `ID Card for ${idCard.employee?.firstname} ${idCard.employee?.lastname}`,
                details: {
                  employeeCode: idCard.cardNumber,
                  cardNumber: idCard.cardNumber,
                  status: idCard.status,
                  expiryDate: idCard.expiryDate
                }
              });
            }
          });
        }
      } catch (err) {
      }

      try {
        const loginHistory = localStorage.getItem('login_history');
        if (loginHistory) {
          const logins = JSON.parse(loginHistory).slice(0, 10);
          
          logins.forEach(login => {
            const existingLog = allLogs.find(log => 
              log.component === 'auth' && 
              log.action === 'LOGIN' &&
              log.user.id === login.userId &&
              new Date(log.timestamp).toISOString() === new Date(login.timestamp).toISOString()
            );
            
            if (!existingLog) {
              allLogs.push({
                id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: login.timestamp || new Date().toISOString(),
                user: {
                  id: login.userId,
                  name: login.username || 'User',
                  role: login.role || 'employee'
                },
                action: 'LOGIN',
                component: 'auth',
                entityId: login.userId,
                entityName: 'User Login',
                details: {
                  ip: login.ip || 'N/A',
                  device: login.device || 'N/A',
                  browser: login.browser || 'N/A'
                }
              });
            }
          });
        }
      } catch (err) {
      }

      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      const uniqueLogs = Array.from(new Set(allLogs.map(log => log.id)))
        .map(id => allLogs.find(log => log.id === id));

      const trimmedLogs = uniqueLogs.slice(0, 1000);
      
      setAuditLogs(trimmedLogs);
      saveAuditLogs(trimmedLogs);
      
      calculateStats(trimmedLogs);
      
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredLogs = () => {
    let filtered = [...auditLogs];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.entityName?.toLowerCase().includes(query) ||
        log.user.name?.toLowerCase().includes(query) ||
        log.user.role?.toLowerCase().includes(query) ||
        log.details?.employeeCode?.toLowerCase().includes(query) ||
        log.details?.email?.toLowerCase().includes(query) ||
        log.details?.type?.toLowerCase().includes(query)
      );
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterComponent !== 'all') {
      filtered = filtered.filter(log => log.component === filterComponent);
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(log => log.user.id === filterUser);
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(log => log.user.role === filterRole);
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'timestamp') {
        aValue = new Date(a.timestamp);
        bValue = new Date(b.timestamp);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getActionCount = (action) => {
    return auditLogs.filter(log => log.action === action).length;
  };

  const exportToCSV = () => {
    const logs = getFilteredLogs();
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Component', 'Entity', 'Details'];
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        `"${new Date(log.timestamp).toISOString()}"`,
        `"${log.user.name}"`,
        `"${log.user.role}"`,
        `"${actionTypes[log.action]?.label || log.action}"`,
        `"${componentTypes[log.component]?.label || log.component}"`,
        `"${log.entityName || 'N/A'}"`,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const auditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: {
        id: currentUser._id || 'system',
        name: currentUser.fullname || 'System',
        role: currentUser.role || 'system'
      },
      action: 'EXPORT',
      component: 'system',
      entityName: 'Audit Logs Export',
      details: {
        recordCount: logs.length,
        format: 'CSV',
        filters: {
          searchTerm,
          action: filterAction,
          component: filterComponent,
          role: filterRole
        }
      }
    };

    setAuditLogs(prev => {
      const newLogs = [auditEvent, ...prev];
      saveAuditLogs(newLogs);
      calculateStats(newLogs);
      return newLogs;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setFilterComponent('all');
    setFilterUser('all');
    setFilterRole('all');
    setDateRange({ start: '', end: '' });
    setSortConfig({ key: 'timestamp', direction: 'desc' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString) => {
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
    return formatDate(dateString);
  };

  const getUniqueUsers = () => {
    const usersMap = new Map();
    auditLogs.forEach(log => {
      if (log.user.id && log.user.name) {
        usersMap.set(log.user.id, log.user);
      }
    });
    return Array.from(usersMap.values());
  };

  useEffect(() => {
    initializeAuditLogs();
    fetchAllAuditData();
  }, [initializeAuditLogs]);

  const filteredLogs = getFilteredLogs();

  return (
    <div className="audit-logs-container-AL">
      <div className="audit-logs-header-AL">
        <div className="header-left-AL">
          <div className="header-icon-AL">
            <History size={28} />
          </div>
          <div>
            <h1>Audit Logs</h1>
            <p className="header-subtitle-AL">Complete history of all system activities and changes</p>
          </div>
        </div>
        <div className="header-actions-AL">
          <button 
            className="refresh-btn-AL"
            onClick={fetchAllAuditData}
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            className="export-btn-AL"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="stats-grid-AL">
        <div className="stat-card-AL total-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <Database size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Total Logs</h3>
              <p className="stat-value-AL">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="stat-card-AL today-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <Calendar size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Today</h3>
              <p className="stat-value-AL">{stats.today}</p>
            </div>
          </div>
        </div>
        <div className="stat-card-AL clockins-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <LogIn size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Clock-ins</h3>
              <p className="stat-value-AL">{stats.clockIns}</p>
              <p className="stat-subtext-AL">Attendance</p>
            </div>
          </div>
        </div>
        <div className="stat-card-AL clockouts-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <LogOut size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Clock-outs</h3>
              <p className="stat-value-AL">{stats.clockOuts}</p>
              <p className="stat-subtext-AL">Attendance</p>
            </div>
          </div>
        </div>
        <div className="stat-card-AL creates-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <Plus size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Creates</h3>
              <p className="stat-value-AL">{stats.creates}</p>
              <p className="stat-subtext-AL">All components</p>
            </div>
          </div>
        </div>
        <div className="stat-card-AL uploads-AL">
          <div className="stat-content-AL">
            <div className="stat-icon-AL">
              <Upload size={24} />
            </div>
            <div className="stat-info-AL">
              <h3>Uploads</h3>
              <p className="stat-value-AL">{stats.uploads}</p>
              <p className="stat-subtext-AL">For Documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-section-AL">
        <div className="search-container-AL">
          <div className="search-input-group-AL">
            <Search className="search-icon-AL" />
            <input
              type="text"
              placeholder="Search audit logs by user, role, entity, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-AL"
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search-btn-AL"
              >
                <X className="clear-icon-AL" />
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls-AL">
          <div className="filter-group-AL">
            <label className="filter-label-AL">
              <Activity size={16} />
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="filter-select-AL"
              disabled={loading}
            >
              <option value="all">All Actions ({stats.total})</option>
              <option value="CLOCK_IN">Clock In ({stats.clockIns})</option>
              <option value="CLOCK_OUT">Clock Out ({stats.clockOuts})</option>
              <option value="CREATE">Creates ({stats.creates})</option>
              <option value="UPLOAD">Uploads ({stats.uploads})</option>
              <option value="APPROVE">Approvals ({stats.approvals})</option>
              <option value="REJECT">Rejects ({stats.rejects})</option>
              <option value="MARK_ABSENT">Mark Absent ({getActionCount('MARK_ABSENT')})</option>
              <option value="AUTO_MARK">Auto Mark ({getActionCount('AUTO_MARK')})</option>
              <option value="GENERATE_ID">Generate ID ({getActionCount('GENERATE_ID')})</option>
            </select>
          </div>

          <div className="filter-group-AL">
            <label className="filter-label-AL">
              <Server size={16} />
              Component
            </label>
            <select
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              className="filter-select-AL"
              disabled={loading}
            >
              <option value="all">All Components</option>
              <option value="attendance">Attendance</option>
              <option value="leave">Leave</option>
              <option value="employee">Employee</option>
              <option value="document">Document</option>
              <option value="department">Department</option>
              <option value="organisation">Organisation</option>
              <option value="user">User</option>
              <option value="announcement">Announcement</option>
              <option value="idcard">ID Card</option>
            </select>
          </div>

          <div className="filter-group-AL">
            <label className="filter-label-AL">
              <User size={16} />
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select-AL"
              disabled={loading}
            >
              <option value="all">All Roles</option>
              <option value="hr">HR</option>
              <option value="hod">Head of Department</option>
              <option value="attendancemanager">Attendance Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div className="filter-group-AL">
            <label className="filter-label-AL">
              <Users size={16} />
              User
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="filter-select-AL"
              disabled={loading}
            >
              <option value="all">All Users</option>
              {getUniqueUsers().slice(0, 15).map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions-AL">
            <button
              onClick={clearFilters}
              className="clear-filters-btn-AL"
              disabled={loading}
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="date-range-section-AL">
          <div className="filter-group-AL">
            <label className="filter-label-AL">
              <Calendar size={16} />
              Time Period
            </label>
            <select
              value={dateRange.start ? 'custom' : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                
                if (value === 'today') {
                  setDateRange({ start: today, end: today });
                } else if (value === 'week') {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - 7);
                  setDateRange({ 
                    start: start.toISOString().split('T')[0], 
                    end: today 
                  });
                } else if (value === 'month') {
                  const end = new Date();
                  const start = new Date();
                  start.setMonth(end.getMonth() - 1);
                  setDateRange({ 
                    start: start.toISOString().split('T')[0], 
                    end: today 
                  });
                } else {
                  setDateRange({ start: '', end: '' });
                }
              }}
              className="filter-select-AL"
              disabled={loading}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange.start && (
            <div className="custom-date-range-AL">
              <div className="date-input-group-AL">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="date-input-AL"
                  disabled={loading}
                  max={dateRange.end || new Date().toISOString().split('T')[0]}
                />
                <span className="date-separator-AL">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="date-input-AL"
                  disabled={loading}
                  min={dateRange.start}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="results-summary-AL">
        <span className="results-count-AL">
          Showing {filteredLogs.length} of {auditLogs.length} audit logs
        </span>
        {filteredLogs.length !== auditLogs.length && (
          <span className="active-filters-AL">
            <Filter size={14} />
            Filters active
            {searchTerm && ` • Search: "${searchTerm}"`}
            {filterAction !== 'all' && ` • Action: ${actionTypes[filterAction]?.label || filterAction}`}
            {filterComponent !== 'all' && ` • Component: ${componentTypes[filterComponent]?.label || filterComponent}`}
            {filterRole !== 'all' && ` • Role: ${filterRole}`}
            {dateRange.start && ` • Date: ${dateRange.start} to ${dateRange.end || 'Today'}`}
          </span>
        )}
      </div>

      <div className="audit-logs-table-container-AL">
        <div className="table-header-AL">
          <h2 className="table-title-AL">Audit Trail</h2>
          <div className="table-count-AL">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'} found
          </div>
        </div>

        {loading ? (
          <div className="loading-container-AL">
            <div className="loading-spinner-AL"></div>
            <p className="loading-text-AL">Loading audit logs...</p>
            <p className="loading-subtext-AL">Please wait while we fetch the data</p>
          </div>
        ) : (
          <div className="table-wrapper-AL">
            {filteredLogs.length > 0 ? (
              <table className="audit-logs-table-AL">
                <thead>
                  <tr className="table-header-row-AL">
                    <th className="table-header-cell-AL">
                      <button 
                        className="sort-header-btn-AL"
                        onClick={() => handleSort('timestamp')}
                      >
                        <span>Timestamp</span>
                        {sortConfig.key === 'timestamp' && (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </th>
                    <th className="table-header-cell-AL">
                      <button 
                        className="sort-header-btn-AL"
                        onClick={() => handleSort('action')}
                      >
                        <span>Action</span>
                        {sortConfig.key === 'action' && (
                          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </th>
                    <th className="table-header-cell-AL">Component</th>
                    <th className="table-header-cell-AL">Entity</th>
                    <th className="table-header-cell-AL">User</th>
                    <th className="table-header-cell-AL">Details</th>
                    <th className="table-header-cell-AL">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionConfig = actionTypes[log.action] || { label: log.action, icon: Activity, color: '#6b7280', bgColor: '#f3f4f6' };
                    const componentConfig = componentTypes[log.component] || { label: log.component, icon: Server, color: '#6b7280' };
                    const ActionIcon = actionConfig.icon;
                    const ComponentIcon = componentConfig.icon;

                    return (
                      <tr key={log.id} className="table-row-AL">
                        <td className="table-cell-AL">
                          <div className="timestamp-cell-AL">
                            <Clock size={14} />
                            <div>
                              <div className="timestamp-relative-AL">
                                {formatRelativeTime(log.timestamp)}
                              </div>
                              <div className="timestamp-full-AL">
                                {formatDate(log.timestamp)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell-AL">
                          <div 
                            className="action-badge-AL"
                            style={{ 
                              backgroundColor: actionConfig.bgColor,
                              color: actionConfig.color,
                              borderColor: actionConfig.color
                            }}
                          >
                            <ActionIcon size={14} />
                            <span>{actionConfig.label}</span>
                          </div>
                        </td>
                        <td className="table-cell-AL">
                          <div className="component-cell-AL">
                            <ComponentIcon size={16} color={componentConfig.color} />
                            <span>{componentConfig.label}</span>
                          </div>
                        </td>
                        <td className="table-cell-AL">
                          <div className="entity-cell-AL">
                            <div className="entity-name-AL">{log.entityName}</div>
                           </div>
                        </td>
                        <td className="table-cell-AL">
                          <div className="user-cell-AL">
                            <div className="user-name-AL">{log.user.name}</div>
                            <div className="user-role-AL">{log.user.role}</div>
                          </div>
                        </td>
                        <td className="table-cell-AL">
                          <div className="details-cell-AL">
                            {log.details ? (
                              <div className="details-content-AL">
                                {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                                  <div key={key} className="detail-item-AL">
                                    <span className="detail-key-AL">{key}:</span>
                                    <span className="detail-value-AL">
                                      {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50)}
                                      {String(value).length > 50 && '...'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="no-details-AL">No details</span>
                            )}
                          </div>
                        </td>
                        <td className="table-cell-AL">
                          <div className="log-actions-AL">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="view-log-btn-AL"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-results-AL">
                <div className="no-results-content-AL">
                  <Database size={48} />
                  <h3 className="no-results-title-AL">No audit logs found</h3>
                  <p className="no-results-text-AL">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="reset-filters-btn-AL"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="modal-overlay-AL" onClick={() => setSelectedLog(null)}>
          <div className="modal-content-AL" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-AL">
              <h3>Audit Log Details</h3>
              <button 
                className="modal-close-AL"
                onClick={() => setSelectedLog(null)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body-AL">
              <div className="log-detail-grid-AL">
                <div className="detail-section-AL">
                  <h4 className="detail-section-title-AL">
                    <Clock size={18} />
                    Timing Information
                  </h4>
                  <div className="detail-item-AL">
                    <label>Timestamp:</label>
                    <span>{formatDate(selectedLog.timestamp)}</span>
                  </div>
                  <div className="detail-item-AL">
                    <label>Relative Time:</label>
                    <span>{formatRelativeTime(selectedLog.timestamp)}</span>
                  </div>
                </div>

                <div className="detail-section-AL">
                  <h4 className="detail-section-title-AL">
                    <User size={18} />
                    User Information
                  </h4>
                  <div className="detail-item-AL">
                    <label>User ID:</label>
                    <span>{selectedLog.user.id}</span>
                  </div>
                  <div className="detail-item-AL">
                    <label>Name:</label>
                    <span>{selectedLog.user.name}</span>
                  </div>
                  <div className="detail-item-AL">
                    <label>Role:</label>
                    <span className={`role-label-AL role-${selectedLog.user.role}-AL`}>
                      {selectedLog.user.role === 'hr' ? 'HR' :
                       selectedLog.user.role === 'hod' ? 'Head of Department' :
                       selectedLog.user.role === 'attendancemanager' ? 'Attendance Manager' :
                       selectedLog.user.role === 'employee' ? 'Employee' : 
                       selectedLog.user.role.charAt(0).toUpperCase() + selectedLog.user.role.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="detail-section-AL">
                  <h4 className="detail-section-title-AL">
                    <Activity size={18} />
                    Action Information
                  </h4>
                  <div className="detail-item-AL">
                    <label>Action:</label>
                    <span className={`action-label-AL ${selectedLog.action}-AL`}>
                      {actionTypes[selectedLog.action]?.label || selectedLog.action}
                    </span>
                  </div>
                  <div className="detail-item-AL">
                    <label>Component:</label>
                    <span className={`component-label-AL ${selectedLog.component}-AL`}>
                      {componentTypes[selectedLog.component]?.label || selectedLog.component}
                    </span>
                  </div>
                  <div className="detail-item-AL">
                    <label>Entity:</label>
                    <span>{selectedLog.entityName}</span>
                  </div>
                </div>

                {selectedLog.details && (
                  <div className="detail-section-AL full-width-AL">
                    <h4 className="detail-section-title-AL">
                      <FileText size={18} />
                      Detailed Information
                    </h4>
                    <div className="details-content-json-AL">
                      <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer-AL">
              <button 
                className="btn-secondary-AL"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
              <button 
                className="btn-primary-AL"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                  alert('Log details copied to clipboard');
                }}
              >
                <FileText size={16} />
                Copy Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const logSystemEvent = (event) => {
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const auditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: {
      id: currentUser._id || 'system',
      name: currentUser.fullname || 'System',
      role: currentUser.role || 'system'
    },
    ...event
  };

  const storedLogs = localStorage.getItem('audit_logs');
  let logs = storedLogs ? JSON.parse(storedLogs) : [];
  logs = [auditEvent, ...logs].slice(0, 1000);
  localStorage.setItem('audit_logs', JSON.stringify(logs));
  
  return auditEvent;
};

export const logLoginEvent = (user, deviceInfo = {}) => {
  const loginEvent = {
    userId: user._id,
    username: user.fullname || user.email,
    role: user.role,
    timestamp: new Date().toISOString(),
    ip: deviceInfo.ip || 'N/A',
    device: deviceInfo.device || 'N/A',
    browser: deviceInfo.browser || 'N/A'
  };

  const loginHistory = localStorage.getItem('login_history');
  let logins = loginHistory ? JSON.parse(loginHistory) : [];
  logins = [loginEvent, ...logins].slice(0, 50);
  localStorage.setItem('login_history', JSON.stringify(logins));

  return loginEvent;
};

export const logAttendanceEvent = (action, attendanceData, employeeData = null) => {
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  
  let eventDetails = {
    id: `attendance_${action.toLowerCase()}_${attendanceData._id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user: {
      id: currentUser._id || 'system',
      name: currentUser.fullname || 'System',
      role: currentUser.role || 'employee'
    },
    action: action,
    component: 'attendance',
    entityId: attendanceData._id || `attendance_${Date.now()}`,
    details: {
      date: attendanceData.date,
      status: attendanceData.status || 'N/A'
    }
  };
  
  if (employeeData) {
    eventDetails.entityName = `${action === 'CLOCK_IN' ? 'Clock-in' : 'Clock-out'} for ${employeeData.firstname} ${employeeData.lastname}`;
    
    eventDetails.details.employeeCode = employeeData.employeeCode;
  } else {
    eventDetails.entityName = `${action === 'CLOCK_IN' ? 'Clock-in' : 'Clock-out'} Event`;
  }
  
  if (action === 'CLOCK_IN') {
    eventDetails.details.clockInTime = attendanceData.clockIn || new Date().toISOString();
    eventDetails.details.location = attendanceData.location || 'N/A';
    eventDetails.details.device = attendanceData.device || 'N/A';
  } else if (action === 'CLOCK_OUT') {
    eventDetails.details.clockOutTime = attendanceData.clockOut || new Date().toISOString();
    eventDetails.details.clockInTime = attendanceData.clockIn || 'N/A';
   
    if (attendanceData.clockIn && attendanceData.clockOut) {
      const clockInTime = new Date(attendanceData.clockIn);
      const clockOutTime = new Date(attendanceData.clockOut);
      const durationMs = clockOutTime - clockInTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      eventDetails.details.workDuration = `${hours}h ${minutes}m`;
    }
  } else if (action === 'MARK_ABSENT') {
    eventDetails.details.remarks = attendanceData.remarks || 'N/A';
    eventDetails.details.markedBy = currentUser.fullname || 'System';
  }
  
  const storedLogs = localStorage.getItem('audit_logs');
  let logs = storedLogs ? JSON.parse(storedLogs) : [];
  
  logs = [eventDetails, ...logs].slice(0, 1000);
  
  localStorage.setItem('audit_logs', JSON.stringify(logs));
  
  return eventDetails;
};

export default AuditLogs;