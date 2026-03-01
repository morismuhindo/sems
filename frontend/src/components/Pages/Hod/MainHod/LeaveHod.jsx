import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Download, Eye, CheckSquare, XSquare, X,
  Building, Search, Filter,
  User, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, FileSpreadsheet, Users, Shield,
  Calendar, Briefcase, Plus, ChevronDown, ChevronUp, Trash2, Circle
} from 'lucide-react';
import './LeaveHod.css';

const LeaveHod = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [endingLeaves, setEndingLeaves] = useState([]);

  const notificationInterval = useRef(null);
  const notificationShownRef = useRef({});
  const audioContextRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end - start);
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

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
        }
        
        localStorage.setItem('userData', JSON.stringify(user));
        
        return {
          user: user,
          employee: user.employee || null
        };
      }
    } catch (err) {
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (storedUserData && Object.keys(storedUserData).length > 0) {
        setUserData(storedUserData);
        if (storedUserData.employee) {
          setEmployeeData(storedUserData.employee);
        }
        return {
          user: storedUserData,
          employee: storedUserData.employee || null
        };
      }
    }
    return null;
  };

  const checkForEndingLeaves = (leavesData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endingToday = [];
    
    leavesData.forEach(leave => {
      if (leave.status === "approved") {
        const endDate = new Date(leave.endDate);
        endDate.setHours(0, 0, 0, 0);
        const timeDiff = endDate - today;
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0 || daysDiff === 1) {
          endingToday.push({
            ...leave,
            daysRemaining: daysDiff
          });
        }
      }
    });
    
    setEndingLeaves(endingToday);
    
    if (endingToday.length > 0) {
      setupNotificationInterval(endingToday);
    } else {
      if (notificationInterval.current) {
        clearInterval(notificationInterval.current);
        notificationInterval.current = null;
      }
      setShowNotification(false);
    }
  };

  const setupNotificationInterval = (endingLeaves) => {
    if (notificationInterval.current) {
      clearInterval(notificationInterval.current);
    }
    
    showLeaveEndingNotification(endingLeaves);
    
    notificationInterval.current = setInterval(() => {
      showLeaveEndingNotification(endingLeaves);
    }, 5000);
  };

  const showLeaveEndingNotification = (endingLeaves) => {
    if (endingLeaves.length === 0) return;
    
    const currentLeave = endingLeaves[0];
    const leaveId = currentLeave._id;
    
    if (notificationShownRef.current[leaveId]) {
      return;
    }
    
    const today = new Date();
    const endDate = new Date(currentLeave.endDate);
    const timeDiff = endDate - today;
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
    
    let message = "";
    if (hoursDiff <= 0) {
      message = `Your ${currentLeave.leaveType} leave has ended today!`;
    } else if (hoursDiff <= 24) {
      message = `Reminder: Your ${currentLeave.leaveType} leave ends in ${hoursDiff} hours`;
    } else {
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      message = `Your ${currentLeave.leaveType} leave ends in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
    }
    
    setNotificationMessage(message);
    setShowNotification(true);
    
    playNotificationSound();
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Leave Reminder", {
        body: message,
        icon: "",
        requireInteraction: true
      });
    }
  };

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (error) {}
  };

  const handleNotificationClose = () => {
    if (endingLeaves.length > 0) {
      const currentLeaveId = endingLeaves[0]._id;
      notificationShownRef.current[currentLeaveId] = true;
      
      const newEndingLeaves = endingLeaves.slice(1);
      setEndingLeaves(newEndingLeaves);
      
      if (newEndingLeaves.length === 0) {
        if (notificationInterval.current) {
          clearInterval(notificationInterval.current);
          notificationInterval.current = null;
        }
        setShowNotification(false);
      } else {
        setupNotificationInterval(newEndingLeaves);
      }
    }
    
    setShowNotification(false);
  };

  const fetchHODLeaves = async (hodDepartmentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get('/api/leave/allLeave', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allLeaves = response.data.data || response.data || [];
      
      const departmentLeaves = allLeaves.filter(leave => {
        if (leave.employee && leave.employee.department) {
          if (typeof leave.employee.department === 'object') {
            return leave.employee.department._id === hodDepartmentId;
          }
          return leave.employee.department === hodDepartmentId;
        }
        return false;
      });
      
      return departmentLeaves;
    } catch (error) {
      throw error;
    }
  };

  const hasActiveLeaves = () => {
    if (!employeeData) return false;
    
    const currentDate = new Date();
    const hodOwnLeaves = leaves.filter(leave => isHodOwnLeave(leave));
    
    return hodOwnLeaves.some(leave => {
      if (leave.status === 'cancelled' || leave.status === 'rejected') {
        return false;
      }
      
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      if (leave.status === 'approved' && currentDate >= startDate && currentDate <= endDate) {
        return true;
      }
      
      if (leave.status === 'pending') {
        return true;
      }
      
      return false;
    });
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const userResult = await fetchUserData();
      
      if (!userResult || !userResult.user) {
        setLoading(false);
        return;
      }
      
      const { user, employee } = userResult;
      
      if (user.role !== 'hod') {
        setLoading(false);
        return;
      }
      
      let hodDepartmentId = null;
      
      if (employee && employee.department) {
        hodDepartmentId = typeof employee.department === 'object' 
          ? employee.department._id 
          : employee.department;
      }
      else if (user.department) {
        hodDepartmentId = typeof user.department === 'object' 
          ? user.department._id 
          : user.department;
      }
      
      if (!hodDepartmentId) {
        setLoading(false);
        return;
      }
      
      const departmentLeaves = await fetchHODLeaves(hodDepartmentId);
      setLeaves(departmentLeaves);
      checkForEndingLeaves(departmentLeaves.filter(leave => isHodOwnLeave(leave)));

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
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
  
  const getDepartmentName = () => {
    if (employeeData && employeeData.department) {
      if (typeof employeeData.department === 'object') {
        return employeeData.department.name || 'N/A';
      }
      return employeeData.department;
    }
    
    if (userData && userData.department) {
      if (typeof userData.department === 'object') {
        return userData.department.name || 'N/A';
      }
      return userData.department;
    }
    
    return 'N/A';
  };

  const getDepartmentCode = () => {
    if (employeeData && employeeData.department) {
      if (typeof employeeData.department === 'object') {
        return employeeData.department.code || 'ENG';
      }
    }
    
    return 'ENG';
  };

  const isHodOwnLeave = (leave) => {
    if (!employeeData || !leave.employee) return false;
    
    if (leave.employee._id === employeeData._id) return true;
    if (leave.employee === employeeData._id) return true;
    
    if (employeeData.email && leave.employee.email === employeeData.email) return true;
    
    if (employeeData.employeeCode && leave.employee.employeeCode === employeeData.employeeCode) return true;
    
    return false;
  };

  const canCancelLeave = (leave) => {
    if (!isHodOwnLeave(leave)) return false;
    
    const currentDate = new Date();
    const startDate = new Date(leave.startDate);
    
    if (leave.status === 'pending') {
      return true;
    }
    
    if (leave.status === 'approved') {
      const endDate = new Date(leave.endDate);
      return currentDate < startDate || currentDate.toDateString() === startDate.toDateString();
    }
    
    return false;
  };

  const clearModalMessages = () => {
    setApplyError('');
    setApplySuccess('');
    setApprovalError('');
  };

  const handleApplyLeave = () => {
    if (hasActiveLeaves()) {
      setApplyError('You cannot apply for a new leave while you have an active or pending leave request.');
      return;
    }
    
    setShowApplyModal(true);
    clearModalMessages();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setApplyForm({
      ...applyForm,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: tomorrow.toISOString().split('T')[0]
    });
  };

  const handleApplyFormChange = (e) => {
    const { name, value } = e.target;
    setApplyForm({
      ...applyForm,
      [name]: value
    });
    if (applyError) setApplyError('');
  };

  const submitLeaveApplication = async () => {
    try {
      setApplyError('');
      setApplySuccess('');
      
      if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason.trim()) {
        setApplyError('Please fill in all required fields');
        return;
      }

      const startDate = new Date(applyForm.startDate);
      const endDate = new Date(applyForm.endDate);
      
      if (endDate < startDate) {
        setApplyError('End date cannot be before start date');
        return;
      }

      const overlappingLeave = leaves.find(leave => {
        if (!isHodOwnLeave(leave) || leave.status === 'cancelled' || leave.status === 'rejected') {
          return false;
        }
        
        const existingStart = new Date(leave.startDate);
        const existingEnd = new Date(leave.endDate);
        
        return (
          (startDate >= existingStart && startDate <= existingEnd) ||
          (endDate >= existingStart && endDate <= existingEnd) ||
          (startDate <= existingStart && endDate >= existingEnd)
        );
      });

      if (overlappingLeave) {
        setApplyError('You already have a leave request for this period. Please cancel the existing request first.');
        return;
      }

      setApplying(true);
      const token = localStorage.getItem("token");
      
      if (!employeeData || !employeeData._id) {
        setApplyError("Unable to identify employee information");
        setApplying(false);
        return;
      }

      const response = await axios.post(
        "/api/leave/leave",
        {
          ...applyForm,
          employee: employeeData._id
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setApplySuccess("Leave applied successfully");
        setTimeout(() => {
          setShowApplyModal(false);
          setApplyForm({
            leaveType: 'Casual',
            startDate: '',
            endDate: '',
            reason: ''
          });
          fetchAllData();
        }, 1500);
      } else {
        setApplyError(response.data.message || 'Failed to submit leave application');
      }
    } catch (error) {
      setApplyError(error.response?.data?.message || "Failed to apply for leave");
    } finally {
      setApplying(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!selectedLeave) return;

    try {
      const token = localStorage.getItem("token");
      
      await axios.put(
        `/api/leave/leave/${selectedLeave._id}/cancel`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      fetchAllData();
      setShowCancelDialog(false);
      setSelectedLeave(null);
    } catch (error) {
      setApprovalError(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const handleApproveLeave = async (leaveId, note = '') => {
    try {
      setApprovalError('');
      
      const leaveToApprove = leaves.find(l => l._id === leaveId);
      
      if (leaveToApprove && isHodOwnLeave(leaveToApprove)) {
        setApprovalError('You cannot approve your own leave request. Please contact HR or your superior.');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      try {
        await axios.put(
          `/api/leave/leave/${leaveId}/approve`,
          { note },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        fetchAllData();
        setShowApproveDialog(false);
        setApprovalNote('');
        setSelectedLeave(null);
      } catch (error) {
        setApprovalError(error.response?.data?.message || 'Failed to approve leave. Please try again.');
      }
    } catch (error) {
      setApprovalError('Failed to approve leave. Please try again.');
    }
  };

  const handleRejectLeave = async (leaveId, rejectionReason = '') => {
    try {
      setApprovalError('');
      
      const leaveToReject = leaves.find(l => l._id === leaveId);
      
      if (leaveToReject && isHodOwnLeave(leaveToReject)) {
        setApprovalError('You cannot reject your own leave request.');
        return;
      }
      
      if (!rejectionReason.trim()) {
        setApprovalError('Please provide a reason for rejection.');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      try {
        await axios.put(
          `/api/leave/leave/${leaveId}/reject`,
          { rejectionReason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        fetchAllData();
        setShowApproveDialog(false);
        setApprovalNote('');
        setSelectedLeave(null);
      } catch (error) {
        setApprovalError(error.response?.data?.message || 'Failed to reject leave. Please try again.');
      }
    } catch (error) {
      setApprovalError('Failed to reject leave. Please try again.');
    }
  };

  const handleExportLeaves = () => {
    if (leaves.length === 0) {
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Employee,Employee Code,Leave Type,Start Date,End Date,Status,Reason,Is HOD's Leave?"]
        .concat(leaves.map(leave => {
          const isHodLeave = isHodOwnLeave(leave) ? "Yes (HOD's own leave)" : "No";
          const diffDays = calculateLeaveDays(leave.startDate, leave.endDate);
          return `"${leave.employee?.firstname} ${leave.employee?.lastname}",` +
          `"${leave.employee?.employeeCode || 'N/A'}",` +
          `"${leave.leaveType}",` +
          `"${new Date(leave.startDate).toLocaleDateString()}",` +
          `"${new Date(leave.endDate).toLocaleDateString()}",` +
          `"${leave.status}",` +
          `"${leave.reason.replace(/"/g, '""')}",` +
          `"${isHodLeave}"`
        }))
        .join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hod-leaves-${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      (leave.employee?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       leave.employee?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       leave.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length
  };

  const statusConfig = {
    pending: {
      color: '#f97316',
      icon: Clock,
      bgColor: '#ffedd5',
      textColor: '#9a3412'
    },
    approved: {
      color: '#10b981',
      icon: CheckCircle,
      bgColor: '#dcfce7',
      textColor: '#166534'
    },
    rejected: {
      color: '#ef4444',
      icon: XCircle,
      bgColor: '#fee2e2',
      textColor: '#991b1b'
    },
    cancelled: {
      color: '#6b7280',
      icon: Circle,
      bgColor: '#f3f4f6',
      textColor: '#374151'
    }
  };

  if (loading) {
    return (
      <div className="leaveHodContainerHD">
        <div className="loadingStateHD">
          <div className="loadingSpinnerHD"></div>
          <span>Loading HOD dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="leaveHodContainerHD">
      {showNotification && (
        <div className="notificationOverlayHD">
          <div className="notificationModalHD">
            <div className="notificationHeaderHD">
              <div className="notificationIconHD">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="notificationTitleHD">Leave Reminder</h3>
            </div>
            
            <div className="notificationBodyHD">
              <p className="notificationMessageHD">{notificationMessage}</p>
              <p className="notificationHintHD">This notification will reappear every 5 seconds until acknowledged.</p>
            </div>
            
            <div className="notificationActionsHD">
              <button 
                className="notificationOkBtnHD"
                onClick={handleNotificationClose}
              >
                <svg className="okBtnIconHD" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="headerCardHD">
        <div>
          <div className="userInfoHD">
            <div className="infoItemHD">
              <User size={16} />
              <span><strong>HOD:</strong> {getUserFullName()}</span>
            </div>
            <div className="infoItemHD">
              <Building size={16} />
              <span>
                <strong>Department:</strong> {getDepartmentName()}
                {getDepartmentCode() && ` (${getDepartmentCode()})`}
              </span>
            </div>
            <div className="infoItemHD">
              <Calendar size={16} />
              <span>{formatDate(currentDateTime)} {formatTime(currentDateTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="actionBarHD">
        <button 
          onClick={handleApplyLeave}
          className="applyButtonHD"
          title="Apply for Leave"
          disabled={hasActiveLeaves()}
        >
          <Plus size={16} />
          Apply for Leave
          {hasActiveLeaves() && <span className="tooltipHD">You have an active leave</span>}
        </button>
        
        <button 
          onClick={handleExportLeaves}
          className="exportButtonHD"
          title="Export to CSV"
          disabled={leaves.length === 0}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {showApplyModal && (
        <div className="modalOverlayHD" onClick={() => setShowApplyModal(false)}>
          <div className="modalHD" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderHD">
              <h3 className="modalTitleHD">
                <Plus size={20} />
                Apply for Leave
              </h3>
              <button 
                className="modalCloseHD"
                onClick={() => setShowApplyModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modalContentHD">
              {applyError && (
                <div className="modalErrorHD">
                  <AlertCircle size={16} />
                  <span>{applyError}</span>
                </div>
              )}
              
              {applySuccess && (
                <div className="modalSuccessHD">
                  <CheckCircle size={16} />
                  <span>{applySuccess}</span>
                </div>
              )}
              
              <div className="formGroupHD">
                <div className="formLabelHD">Leave Type *</div>
                <select
                  name="leaveType"
                  value={applyForm.leaveType}
                  onChange={handleApplyFormChange}
                  className="formSelectHD"
                >
                  <option value="">Select Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Annual">Annual Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="formGridHD">
                <div className="formGroupHD">
                  <div className="formLabelHD">Start Date *</div>
                  <input
                    type="date"
                    name="startDate"
                    value={applyForm.startDate}
                    onChange={handleApplyFormChange}
                    className="formInputHD"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="formGroupHD">
                  <div className="formLabelHD">End Date *</div>
                  <input
                    type="date"
                    name="endDate"
                    value={applyForm.endDate}
                    onChange={handleApplyFormChange}
                    className="formInputHD"
                    min={applyForm.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              {applyForm.startDate && applyForm.endDate && (
                <div className="durationDisplayHD">
                  <span className="durationLabelHD">Duration:</span>
                  <span className="durationValueHD">
                    {calculateLeaveDays(applyForm.startDate, applyForm.endDate)} day
                    {calculateLeaveDays(applyForm.startDate, applyForm.endDate) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <div className="formGroupHD">
                <div className="formLabelHD">Reason for Leave *</div>
                <textarea
                  name="reason"
                  value={applyForm.reason}
                  onChange={handleApplyFormChange}
                  rows={4}
                  placeholder="Please provide details for your leave request..."
                  className="formTextareaHD"
                />
              </div>
              
              <div className="noteBoxHD">
                <strong>Note:</strong> As a Head of Department, your leave request will be reviewed by HR or higher management. 
                You cannot approve or reject your own leave requests.
              </div>
            </div>
            
            <div className="modalActionsHD">
              <button 
                onClick={() => setShowApplyModal(false)}
                className="cancelButtonHD"
              >
                Cancel
              </button>
              <button 
                onClick={submitLeaveApplication}
                disabled={applying}
                className="submitButtonHD"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="statsGridHD">
            <div className="statCardHD statCardTotalHD">
              <div className="statIconHD">
                <FileText size={20} />
              </div>
              <div className="statContentHD">
                <div className="statNumberHD">{stats.total}</div>
                <div className="statLabelHD">Total Leaves</div>
              </div>
            </div>
            
            <div className="statCardHD statCardPendingHD">
              <div className="statIconHD">
                <Clock size={20} />
              </div>
              <div className="statContentHD">
                <div className="statNumberHD">{stats.pending}</div>
                <div className="statLabelHD">Pending</div>
              </div>
            </div>
            
            <div className="statCardHD statCardApprovedHD">
              <div className="statIconHD">
                <CheckCircle size={20} />
              </div>
              <div className="statContentHD">
                <div className="statNumberHD">{stats.approved}</div>
                <div className="statLabelHD">Approved</div>
              </div>
            </div>
            
            <div className="statCardHD statCardRejectedHD">
              <div className="statIconHD">
                <XCircle size={20} />
              </div>
              <div className="statContentHD">
                <div className="statNumberHD">{stats.rejected}</div>
                <div className="statLabelHD">Rejected</div>
              </div>
            </div>
            
            <div className="statCardHD statCardCancelledHD">
              <div className="statIconHD">
                <Circle size={20} />
              </div>
              <div className="statContentHD">
                <div className="statNumberHD">{stats.cancelled}</div>
                <div className="statLabelHD">Cancelled</div>
              </div>
            </div>
          </div>

          <div className="filtersCardHD">
            <div className="filtersHeaderHD">
              <Filter size={20} />
              <h3>Filters</h3>
            </div>
            <div className="filtersRowHD">
              <div className="searchContainerHD">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, employee code, or leave type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="searchInputHD"
                />
              </div>
              
              <div className="filterControlsHD">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filterSelectHD"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="filterInfoHD">
              <div className="countInfoHD">
                Showing {filteredLeaves.length} of {leaves.length} leave requests
              </div>
              {stats.pending > 0 && (
                <div className="pendingBadgeHD">
                  <Clock size={14} />
                  {stats.pending} pending requests
                </div>
              )}
            </div>
          </div>

          <div className="tableContainerHD">
            <div className="tableHeaderHD">
              <h3 className="tableTitleHD">
                <FileSpreadsheet size={20} />
                Department Leave Requests ({leaves.length})
              </h3>
            </div>
            
            {filteredLeaves.length > 0 ? (
              <div className="tableWrapperHD">
                <table className="leaveTableHD">
                  <thead className="tableHeadHD">
                    <tr>
                      <th className="tableHeaderCellHD">
                        <div className="headerCellContentHD">
                          <User size={14} />
                          Employee
                        </div>
                      </th>
                      <th className="tableHeaderCellHD">Leave Type</th>
                      <th className="tableHeaderCellHD">Start Date</th>
                      <th className="tableHeaderCellHD">End Date</th>
                      <th className="tableHeaderCellHD">Days</th>
                      <th className="tableHeaderCellHD">Status</th>
                      <th className="tableHeaderCellHD">Reason</th>
                      <th className="tableHeaderCellHD">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((leave) => {
                      const diffDays = calculateLeaveDays(leave.startDate, leave.endDate);
                      const isOwnLeave = isHodOwnLeave(leave);
                      const cancellable = canCancelLeave(leave);
                      const statusStyle = statusConfig[leave.status] || statusConfig.pending;
                      const StatusIcon = statusStyle.icon;
                      
                      return (
                        <tr 
                          key={leave._id} 
                          className={`tableRowHD ${isOwnLeave ? 'ownLeaveRowHD' : ''} ${leave.status === 'pending' ? 'pendingRowHD' : ''}`}
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowDetails(true);
                          }}
                        >
                          <td className="tableCellHD">
                            <div className="employeeInfoHD">
                              <div className="employeeNameHD">
                                {leave.employee?.firstname} {leave.employee?.lastname}
                                {isOwnLeave && (
                                  <span className="ownLeaveBadgeHD">
                                    YOUR LEAVE
                                  </span>
                                )}
                              </div>
                              <div className="employeeDetailsHD">
                                {leave.employee?.employeeCode || 'N/A'} • {leave.employee?.position || 'Employee'}
                              </div>
                            </div>
                          </td>
                          <td className="tableCellHD">
                            <div className="leaveTypeBadgeHD">
                              <FileText size={12} />
                              {leave.leaveType}
                            </div>
                          </td>
                          <td className="tableCellHD">
                            {new Date(leave.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="tableCellHD">
                            {new Date(leave.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="tableCellHD">
                            <div className="daysBadgeHD">
                              {diffDays} day{diffDays > 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="tableCellHD">
                            <div 
                              className="statusBadgeHD"
                              style={{ 
                                backgroundColor: statusStyle.bgColor,
                                color: statusStyle.textColor
                              }}
                            >
                              <StatusIcon size={12} />
                              {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
                              {isOwnLeave && leave.status === 'pending' && ' (Awaiting HR)'}
                            </div>
                          </td>
                          <td className="tableCellHD">
                            <div className="reasonCellHD">
                              {leave.reason}
                            </div>
                          </td>
                          <td className="tableCellHD">
                            <div className="actionButtonsHD">
                              <button
                                className="iconButtonHD"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLeave(leave);
                                  setShowDetails(true);
                                }}
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              {leave.status === 'pending' && (
                                <>
                                  {isOwnLeave ? (
                                    <>
                                      {cancellable && (
                                        <button
                                          className="iconButtonHD cancelButtonHD"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedLeave(leave);
                                            setShowCancelDialog(true);
                                          }}
                                          title="Cancel Leave"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      )}
                                      <div className="hodOwnActionHD">
                                        {cancellable ? 'Cancel' : 'Contact HR'}
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="iconButtonHD approveButtonHD"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLeave(leave);
                                          setShowApproveDialog(true);
                                        }}
                                        title="Approve Leave"
                                      >
                                        <CheckSquare size={18} />
                                      </button>
                                      <button
                                        className="iconButtonHD rejectButtonHD"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLeave(leave);
                                          setShowApproveDialog(true);
                                        }}
                                        title="Reject Leave"
                                      >
                                        <XSquare size={18} />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {(leave.status === 'approved' && isOwnLeave && cancellable) && (
                                <button
                                  className="iconButtonHD cancelButtonHD"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLeave(leave);
                                    setShowCancelDialog(true);
                                  }}
                                  title="Cancel Leave"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                              {leave.status !== 'pending' && leave.status !== 'approved' && (
                                <span className="actionStatusHD">
                                  {leave.status === 'approved' ? '✓ Approved' : 
                                   leave.status === 'rejected' ? '✗ Rejected' : 
                                   leave.status === 'cancelled' ? '🗑️ Cancelled' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="emptyStateHD">
                <Users size={48} />
                <div className="emptyTitleHD">No leave requests found</div>
                <div className="emptyDescriptionHD">
                  There are no pending leave requests in your department ({getDepartmentName()}).
                </div>
                <button 
                  onClick={handleApplyLeave}
                  className="applyButtonHD emptyButtonHD"
                >
                  <Plus size={16} />
                  Apply for Leave
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showDetails && selectedLeave && (
        <div className="modalOverlayHD" onClick={() => setShowDetails(false)}>
          <div className="modalHD detailsModalHD" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderHD">
              <h3 className="modalTitleHD">
                <FileText size={20} />
                Leave Application Details
              </h3>
              <button 
                className="modalCloseHD"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modalContentHD">
              <div className="employeeSectionHD">
                <h4 className="sectionTitleHD">
                  <User size={16} />
                  Employee Information
                </h4>
                <div className="employeeGridHD">
                <div>
                  <div className="infoLabelHD">Name</div>
                  <div className="infoValueHD">
                    {selectedLeave.employee?.firstname} {selectedLeave.employee?.lastname}
                  </div>
                </div>
                <div>
                  <div className="infoLabelHD">Employee Code</div>
                  <div className="infoValueHD">
                    {selectedLeave.employee?.employeeCode || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="infoLabelHD">Department</div>
                                <div className="infoValueHD">
                    {selectedLeave.employee?.department 
                      ? (typeof selectedLeave.employee.department === 'object' 
                          ? selectedLeave.employee.department.name 
                          : selectedLeave.employee.department)
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="infoLabelHD">Position</div>
                  <div className="infoValueHD">
                    {selectedLeave.employee?.position || 'Employee'}
                  </div>
                </div>
              </div>
              </div>

              <div className="detailsGridHD">
                <div>
                  <div className="infoLabelHD">Leave Type</div>
                  <div className="infoValueHD">{selectedLeave.leaveType}</div>
                </div>
                <div>
                  <div className="infoLabelHD">Status</div>
                  <div 
                    className="statusBadgeHD detailsBadgeHD"
                    style={{ 
                      backgroundColor: statusConfig[selectedLeave.status]?.bgColor,
                      color: statusConfig[selectedLeave.status]?.textColor
                    }}
                  >
                    {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                  </div>
                </div>
                <div>
                  <div className="infoLabelHD">Start Date</div>
                  <div className="infoValueHD">
                    {new Date(selectedLeave.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="infoLabelHD">End Date</div>
                  <div className="infoValueHD">
                    {new Date(selectedLeave.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Total Duration</div>
                  <div className="durationValueHD">
                    {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} day
                    {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate) !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Reason for Leave</div>
                  <div className="reasonBoxHD">
                    {selectedLeave.reason}
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Applied On</div>
                  <div className="infoValueHD">
                    {new Date(selectedLeave.appliedAt || selectedLeave.startDate).toLocaleString('en-US', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modalActionsHD">
              <button 
                className="cancelButtonHD"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              {selectedLeave.status === 'pending' && !isHodOwnLeave(selectedLeave) && (
                <button 
                  className="submitButtonHD"
                  onClick={() => {
                    setShowDetails(false);
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckSquare size={16} />
                  Review Application
                </button>
              )}
              {isHodOwnLeave(selectedLeave) && canCancelLeave(selectedLeave) && (
                <button 
                  className="dangerButtonHD"
                  onClick={() => {
                    setShowDetails(false);
                    setShowCancelDialog(true);
                  }}
                >
                  <Trash2 size={16} />
                  Cancel Leave
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showApproveDialog && selectedLeave && (
        <div className="modalOverlayHD" onClick={() => setShowApproveDialog(false)}>
          <div className="modalHD" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderHD">
              <h3 className="modalTitleHD">
                <FileText size={20} />
                Review Leave Application
              </h3>
              <button 
                className="modalCloseHD"
                onClick={() => {
                  setShowApproveDialog(false);
                  setApprovalNote('');
                  setApprovalError('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modalContentHD">
              {approvalError && (
                <div className="modalErrorHD">
                  <AlertCircle size={16} />
                  <span>{approvalError}</span>
                </div>
              )}
              
              <div className="reviewNoticeHD">
                <Clock size={20} />
                Reviewing leave application from <strong>
                  {selectedLeave.employee?.firstname} {selectedLeave.employee?.lastname}
                </strong>
              </div>

              <div className="reviewDetailsHD">
                <div>
                  <div className="infoLabelHD">Leave Type</div>
                  <div className="infoValueHD">{selectedLeave.leaveType}</div>
                </div>
                <div>
                  <div className="infoLabelHD">Duration</div>
                  <div className="infoValueHD">
                    {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} days
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Period</div>
                  <div className="infoValueHD">
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="noteInputHD">
                <label className="infoLabelHD">
                  Note <span className="requiredHD">(Required for rejections)</span>
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note explaining your decision..."
                  className="noteTextareaHD"
                />
              </div>
            </div>
            
            <div className="modalActionsHD">
              <button 
                className="cancelButtonHD"
                onClick={() => {
                  setShowApproveDialog(false);
                  setApprovalNote('');
                  setApprovalError('');
                }}
              >
                Cancel
              </button>
              <button 
                className="dangerButtonHD"
                onClick={() => handleRejectLeave(selectedLeave._id, approvalNote)}
              >
                <XSquare size={16} />
                Reject
              </button>
              <button 
                className="successButtonHD"
                onClick={() => handleApproveLeave(selectedLeave._id, approvalNote)}
              >
                <CheckSquare size={16} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && selectedLeave && (
        <div className="modalOverlayHD" onClick={() => setShowCancelDialog(false)}>
          <div className="modalHD" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderHD">
              <h3 className="modalTitleHD">
                <Trash2 size={20} />
                Cancel Your Leave
              </h3>
              <button 
                className="modalCloseHD"
                onClick={() => {
                  setShowCancelDialog(false);
                  setApprovalError('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modalContentHD">
              {approvalError && (
                <div className="modalErrorHD">
                  <AlertCircle size={16} />
                  <span>{approvalError}</span>
                </div>
              )}
              
              <div className="reviewNoticeHD">
                <AlertCircle size={20} />
                You are about to cancel your own leave request
              </div>

              <div className="reviewDetailsHD">
                <div>
                  <div className="infoLabelHD">Leave Type</div>
                  <div className="infoValueHD">{selectedLeave.leaveType}</div>
                </div>
                <div>
                  <div className="infoLabelHD">Duration</div>
                  <div className="infoValueHD">
                    {calculateLeaveDays(selectedLeave.startDate, selectedLeave.endDate)} days
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Period</div>
                  <div className="infoValueHD">
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="fullWidthHD">
                  <div className="infoLabelHD">Current Status</div>
                  <div 
                    className="statusBadgeHD detailsBadgeHD"
                    style={{ 
                      backgroundColor: statusConfig[selectedLeave.status]?.bgColor,
                      color: statusConfig[selectedLeave.status]?.textColor
                    }}
                  >
                    {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modalActionsHD">
              <button 
                className="cancelButtonHD"
                onClick={() => {
                  setShowCancelDialog(false);
                  setApprovalError('');
                }}
              >
                Cancel
              </button>
              <button 
                className="dangerButtonHD"
                onClick={handleCancelLeave}
              >
                <Trash2 size={16} />
                Cancel Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHod;