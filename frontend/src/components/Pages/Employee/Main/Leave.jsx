import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Leave.css";

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [endingLeaves, setEndingLeaves] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0 
  });

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const [currentUser, setCurrentUser] = useState(null);

  const notificationInterval = useRef(null);
  const notificationShownRef = useRef({});
  const audioContextRef = useRef(null);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await axios.get("/api/me", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        const userData = response.data.data;
        const user = {
          id: userData.id || userData._id,
          employeeCode: userData.employeeCode || userData.employee?.employeeCode || '',
          fullname: userData.fullname || `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || 'User',
          email: userData.email || '',
          role: userData.role || 'employee',
        };
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        return user;
      }
    }
    return null;
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");
      
      const user = await fetchUserData();
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      setCurrentUser(user);
      const token = localStorage.getItem("token");
      
      const res = await axios.get(
        "/api/leave/allLeave",
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const allLeaves = res.data.data || [];
      const userLeaves = allLeaves.filter(leave => {
        const isMatch = 
          leave.employee === user.id || 
          leave.employee?._id === user.id ||
          leave.employee?.employeeCode === user.employeeCode ||
          leave.employee === user.employeeCode;
        
        return isMatch;
      });
      
      setLeaves(userLeaves);
      
      const stats = {
        total: userLeaves.length,
        pending: userLeaves.filter(leave => leave.status === "pending").length,
        approved: userLeaves.filter(leave => leave.status === "approved").length,
        rejected: userLeaves.filter(leave => leave.status === "rejected").length,
        cancelled: userLeaves.filter(leave => leave.status === "cancelled").length 
      };
      setStats(stats);
      
      checkForEndingLeaves(userLeaves);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load leaves. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    
    return () => {
      if (notificationInterval.current) {
        clearInterval(notificationInterval.current);
        notificationInterval.current = null;
      }
    };
  }, []);

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
    } catch (error) {
    }
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

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const showMessage = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(message);
      setSuccess("");
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser || !currentUser.id) {
      setError("You must be logged in to apply for leave");
      return;
    }

    if (formData.startDate > formData.endDate) {
      setError("End date must be after start date");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/leave/leave",
        {
          ...formData,
          employee: currentUser.id
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      showMessage("Leave applied successfully", "success");
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: ""
      });
      setShowModal(false);
      fetchLeaves();
    } catch (error) {
      showMessage(error.response?.data?.message || "Failed to apply for leave", "error");
    }
  };

  const confirmCancelLeave = (leave) => {
    setLeaveToCancel(leave);
    setShowCancelModal(true);
  };

  const cancelLeave = async () => {
    if (!leaveToCancel) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/leave/leave/${leaveToCancel._id}/cancel`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      showMessage("Leave cancelled successfully", "success");
      setShowCancelModal(false);
      setLeaveToCancel(null);
      fetchLeaves();
    } catch (error) {
      showMessage(error.response?.data?.message || "Failed to cancel leave", "error");
      setShowCancelModal(false);
      setLeaveToCancel(null);
    }
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setLeaveToCancel(null);
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'statusBadgePendingL';
      case 'approved': return 'statusBadgeApprovedL';
      case 'rejected': return 'statusBadgeRejectedL';
      case 'cancelled': return 'statusBadgeCancelledL';
      default: return 'statusBadgeDefaultL';
    }
  };

  const renderActionByInfo = (leave) => {
    if (!leave.approvedBy) return null;
    
    const isRejected = leave.status === "rejected";
    const isApproved = leave.status === "approved";
    
    if (!isRejected && !isApproved) return null;
    
    const title = isRejected ? "Rejected by:" : "Approved by:";
    
    const name = leave.approvedBy.fullname || 
                `${leave.approvedBy.firstname || ''} ${leave.approvedBy.lastname || ''}`.trim() ||
                leave.approvedBy.email ||
                'Administrator';
    
    return (
      <div className="actionByContainerL">
        <div className="actionByHeaderL">
          <svg className="actionByIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isRejected ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span className="actionByTitleL">{title}</span>
        </div>
        <div className="actionByDetailsL">
          <div className="actionByNameL">{name}</div>
          {leave.approvedBy.role && (
            <div className="actionByRoleL">({leave.approvedBy.role})</div>
          )}
          {leave.approvedBy.email && leave.approvedBy.email !== name && (
            <div className="actionByEmailL">{leave.approvedBy.email}</div>
          )}
        </div>
      </div>
    );
  };

  if (loading && leaves.length === 0) {
    return (
      <div className="loadingStateL">
        <div className="loadingContentL">
          <div className="loadingSpinnerL"></div>
          <p className="loadingTextL">Loading leave data...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="loginRequiredContainerL">
        <div className="loginRequiredCardL">
          <h2 className="loginTitleL">Authentication Required</h2>
          <p className="loginMessageL">Please login to access your leave management.</p>
          <button 
            className="loginButtonL"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaveContainerL">
      {showNotification && (
        <div className="notificationOverlayL">
          <div className="notificationModalL">
            <div className="notificationHeaderL">
              <div className="notificationIconL">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="notificationTitleL">Leave Reminder</h3>
            </div>
            
            <div className="notificationBodyL">
              <p className="notificationMessageL">{notificationMessage}</p>
              <p className="notificationHintL">This notification will reappear every 5 seconds until acknowledged.</p>
            </div>
            
            <div className="notificationActionsL">
              <button 
                className="notificationOkBtnL"
                onClick={handleNotificationClose}
              >
                <svg className="okBtnIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modalOverlayL" onClick={closeCancelModal}>
          <div className="modalL cancelConfirmModalL" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderL">
              <h3 className="modalTitleL">Cancel Leave Request</h3>
              <button className="modalCloseBtnL" onClick={closeCancelModal}>
                <svg className="modalCloseIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modalFormL">
              <div className="cancelModalContentL">
                <div className="cancelModalIconL">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="cancelModalTitleL">Are you sure?</h4>
                <p className="cancelModalTextL">
                  You are about to cancel your {leaveToCancel?.leaveType} leave from {formatDate(leaveToCancel?.startDate)} to {formatDate(leaveToCancel?.endDate)}.
                </p>
                <div className="cancelModalActionsL">
                  <button type="button" className="cancelFormBtnL cancelModalNoBtnL" onClick={closeCancelModal}>
                    No, Keep It
                  </button>
                  <button type="button" className="submitFormBtnL cancelModalYesBtnL" onClick={cancelLeave}>
                    Yes, Cancel Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="leaveWrapperL">
        {error && (
          <div className="errorBoxL">
            <div className="errorBoxContentL">
              <svg className="errorBoxIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="errorBoxTextL">
                <strong>Error:</strong> {error}
              </div>
              <button className="errorBoxCloseBtnL" onClick={() => setError("")}>
                <svg className="errorBoxCloseIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="successBoxL">
            <div className="successBoxContentL">
              <svg className="successBoxIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="successBoxTextL">
                <strong>Success:</strong> {success}
              </div>
              <button className="successBoxCloseBtnL" onClick={() => setSuccess("")}>
                <svg className="successBoxCloseIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="leaveHeaderL">
          <div className="headerContentL">
            <h1 className="leaveTitleL">Leave Management</h1>
            <p className="leaveSubtitleL">Request and manage your leave applications</p>
          </div>
          <button className="applyLeaveBtnL" onClick={() => setShowModal(true)}>
            <svg className="applyLeaveIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Apply Leave
          </button>
        </div>

        <div className="statsGridL">
          <div className="statCardL statCardTotalL">
            <div className="statNumberL statNumberTotalL">{stats.total}</div>
            <div className="statLabelL">Total Requests</div>
          </div>
          <div className="statCardL statCardPendingL">
            <div className="statNumberL statNumberPendingL">{stats.pending}</div>
            <div className="statLabelL">Pending</div>
          </div>
          <div className="statCardL statCardApprovedL">
            <div className="statNumberL statNumberApprovedL">{stats.approved}</div>
            <div className="statLabelL">Approved</div>
          </div>
          <div className="statCardL statCardRejectedL">
            <div className="statNumberL statNumberRejectedL">{stats.rejected}</div>
            <div className="statLabelL">Rejected</div>
          </div>
          <div className="statCardL statCardCancelledL">
            <div className="statNumberL statNumberCancelledL">{stats.cancelled}</div>
            <div className="statLabelL">Cancelled</div>
          </div>
        </div>

        <div className="leaveSectionL">
          <h3 className="sectionTitleL">My Leave Requests</h3>
          
          {leaves.length === 0 ? (
            <div className="emptyStateL">
              <svg className="emptyIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h4 className="emptyTitleL">No leave requests yet</h4>
              <p className="emptyDescriptionL">Submit your first leave request to get started</p>
              <button className="applyLeaveBtnL emptyBtnL" onClick={() => setShowModal(true)}>
                Apply for Leave
              </button>
            </div>
          ) : (
            <>
              <div className="leaveCardsGridL">
                {leaves.map((leave) => (
                  <div key={leave._id} className="leaveCardL">
                    <div className="leaveCardHeaderL">
                      <div>
                        <h4 className="leaveTypeL">{leave.leaveType}</h4>
                        <div className="leaveDateL">
                          <svg className="leaveDateIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(leave.startDate)}
                          <span className="dateSeparatorL">→</span>
                          {formatDate(leave.endDate)}
                        </div>
                      </div>
                      <span className={`statusBadgeL ${getStatusBadgeClass(leave.status)}`}>
                        <span className="statusTextL">{leave.status}</span>
                      </span>
                    </div>
                    
                    <p className="leaveReasonL">{leave.reason}</p>
                    
                    {leave.status === "rejected" && leave.rejectionReason && (
                      <div className="rejectionReasonContainerL">
                        <div className="rejectionReasonHeaderL">
                          <svg className="rejectionIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="rejectionTitleL">Rejection Reason:</span>
                        </div>
                        <p className="rejectionReasonTextL">{leave.rejectionReason}</p>
                      </div>
                    )}
                    
                    {renderActionByInfo(leave)}
                    
                    <div className="leaveCardFooterL">
                      <div className="leaveAppliedDateL">
                        Applied on {formatDate(leave.createdAt || leave.startDate)}
                      </div>
                      <div className="leaveActionsL">
                        {leave.status === "pending" && (
                          <button
                            className="actionBtnL cancelBtnL"
                            onClick={() => confirmCancelLeave(leave)}
                            title="Cancel Leave"
                          >
                            <svg className="actionIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summaryTableL">
                <div className="tableHeaderL">
                  <div className="tableHeaderContentL">
                    <h4 className="tableTitleL">All Leave Requests</h4>
                  </div>
                </div>
                
                <div className="tableWrapperL">
                  <table className="leaveTableL">
                    <thead className="tableHeadL">
                      <tr>
                        <th className="tableHeaderCellL">Type</th>
                        <th className="tableHeaderCellL">From</th>
                        <th className="tableHeaderCellL">To</th>
                        <th className="tableHeaderCellL">Days</th>
                        <th className="tableHeaderCellL">Status</th>
                        <th className="tableHeaderCellL">Rejection Reason</th>
                        <th className="tableHeaderCellL">Action By</th>
                        <th className="tableHeaderCellL">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => (
                        <tr key={leave._id} className="tableRowL">
                          <td className="tableCellL">{leave.leaveType}</td>
                          <td className="tableCellL">{formatDate(leave.startDate)}</td>
                          <td className="tableCellL">{formatDate(leave.endDate)}</td>
                          <td className="tableCellL">{leave.totalDays || calculateDays(leave.startDate, leave.endDate)}</td>
                          <td className="tableCellL">
                            <span className={`statusBadgeSmallL ${getStatusBadgeClass(leave.status)}`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="tableCellL">
                            {leave.status === "rejected" && leave.rejectionReason ? (
                              <div className="rejectionTooltipL">
                                <div className="rejectionReasonPreviewL">
                                  {leave.rejectionReason.length > 30 
                                    ? `${leave.rejectionReason.substring(0, 30)}...` 
                                    : leave.rejectionReason}
                                </div>
                                <div className="rejectionTooltipTextL">
                                  {leave.rejectionReason}
                                </div>
                              </div>
                            ) : (
                              <span className="noRejectionL">-</span>
                            )}
                          </td>
                          <td className="tableCellL">
                            {leave.approvedBy ? (
                              <div className="actionByTableL">
                                <div className="actionByNameTable">
                                  {leave.approvedBy.fullname || 
                                   `${leave.approvedBy.firstname || ''} ${leave.approvedBy.lastname || ''}`.trim() || 
                                   leave.approvedBy.email || 
                                   'Admin'}
                                </div>
                                {leave.approvedBy.role && (
                                  <div className="actionByRoleTable">({leave.approvedBy.role})</div>
                                )}
                              </div>
                            ) : (
                              <span className="noRejectionL">-</span>
                            )}
                          </td>
                          <td className="tableCellL">
                            {leave.status === "pending" && (
                              <button
                                className="cancelBtnL"
                                onClick={() => confirmCancelLeave(leave)}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modalOverlayL" onClick={() => setShowModal(false)}>
          <div className="modalL" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderL">
              <h3 className="modalTitleL">Apply for Leave</h3>
              <button className="modalCloseBtnL" onClick={() => setShowModal(false)}>
                <svg className="modalCloseIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="modalFormL" onSubmit={handleSubmit}>
              {error && (
                <div className="modalErrorBoxL">
                  <svg className="modalErrorIconL" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="modalErrorTextL">{error}</span>
                </div>
              )}
              
              <div className="formGroupL">
                <label className="formLabelL">Leave Type</label>
                <select
                  className="formSelectL"
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                >
                  <option value="">Select Leave Type</option>
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="formGridL">
                <div className="formGroupL">
                  <label className="formLabelL">Start Date</label>
                  <input
                    type="date"
                    className="formInputL"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="formGroupL">
                  <label className="formLabelL">End Date</label>
                  <input
                    type="date"
                    className="formInputL"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && formData.startDate <= formData.endDate && (
                <div className="daysCounterL">
                  Total Days: {calculateDays(formData.startDate, formData.endDate)}
                </div>
              )}

              <div className="formGroupL">
                <label className="formLabelL">Reason</label>
                <textarea
                  className="formTextareaL"
                  placeholder="Please provide a reason for your leave..."
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="formActionsL">
                <button type="button" className="cancelFormBtnL" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submitFormBtnL">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;