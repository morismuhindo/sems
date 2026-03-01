import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw, Download, Eye, CheckSquare, XSquare,
  Calendar, User, FileText, Clock, CheckCircle,
  XCircle, AlertCircle, Filter, ChevronDown,
  ChevronUp, Search, BarChart3, Users, FileSpreadsheet
} from 'lucide-react';

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'appliedAt', direction: 'desc' });

  // Responsive styles
  const isMobile = window.innerWidth < 768;
  
  const styles = {
    container: {
      padding: isMobile ? '16px' : '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isMobile ? '20px' : '32px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: isMobile ? '22px' : '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: isMobile ? '12px' : '14px',
      color: '#64748b',
      marginTop: '4px'
    },
    button: {
      padding: isMobile ? '8px 16px' : '10px 20px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#475569',
      border: '1px solid #e2e8f0'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '24px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      marginBottom: isMobile ? '16px' : '24px'
    },
    // Responsive stats grid - 2 per line on mobile
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: isMobile ? '12px' : '20px',
      marginBottom: isMobile ? '20px' : '32px'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: isMobile ? '16px' : '20px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      minHeight: isMobile ? '100px' : 'auto'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      overflowX: isMobile ? 'auto' : 'visible'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: isMobile ? '800px' : 'auto'
    },
    th: {
      padding: isMobile ? '12px 8px' : '16px',
      textAlign: 'left',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      color: '#64748b',
      fontSize: isMobile ? '11px' : '12px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap'
    },
    td: {
      padding: isMobile ? '12px 8px' : '16px',
      borderBottom: '1px solid #f1f5f9',
      color: '#1e293b',
      fontSize: isMobile ? '13px' : '14px'
    },
    tr: {
      transition: 'background-color 0.2s'
    },
    badge: {
      padding: isMobile ? '4px 8px' : '6px 12px',
      borderRadius: '20px',
      fontSize: isMobile ? '10px' : '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    pendingBadge: {
      backgroundColor: '#ffedd5',
      color: '#9a3412'
    },
    approvedBadge: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    rejectedBadge: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    cancelledBadge: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    filterSection: {
      display: 'flex',
      gap: isMobile ? '12px' : '16px',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: isMobile ? '16px' : '24px'
    },
    select: {
      padding: isMobile ? '8px 12px' : '10px 16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      fontSize: isMobile ? '13px' : '14px',
      minWidth: isMobile ? '120px' : '150px'
    },
    input: {
      padding: isMobile ? '8px 12px' : '10px 16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      fontSize: isMobile ? '13px' : '14px',
      flex: 1,
      maxWidth: '300px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '10px' : '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    modalHeader: {
      padding: isMobile ? '16px' : '24px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: isMobile ? '18px' : '20px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    modalContent: {
      padding: isMobile ? '16px' : '24px'
    },
    modalActions: {
      padding: isMobile ? '16px' : '24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      flexWrap: isMobile ? 'wrap' : 'nowrap'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      color: '#64748b'
    },
    emptyState: {
      textAlign: 'center',
      padding: isMobile ? '32px 16px' : '48px 24px',
      color: '#64748b'
    },
    iconButton: {
      padding: '6px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    }
  };

  // Status colors and icons
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
      icon: AlertCircle,
      bgColor: '#f3f4f6',
      textColor: '#374151'
    }
  };

  // Show message helper function
  const showMessage = (message, type = 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Fetch all leaves
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave/allLeave', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(response.data.data);
      calculateStats(response.data.data);
      setError('');
    } catch (err) {
      showMessage('Failed to fetch leaves. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from leaves data
  const calculateStats = (leavesData) => {
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      total: leavesData.length
    };

    leavesData.forEach(leave => {
      if (stats[leave.status] !== undefined) {
        stats[leave.status] += 1;
      }
    });

    setStats(stats);
  };

  // Approve/Reject leave
  const handleApproveReject = async (status) => {
    try {
      // Validation for rejections
      if (status === 'rejected' && !approvalNote.trim()) {
        showMessage('Please provide a reason for rejection.');
        return;
      }

      const token = localStorage.getItem('token');
      
  
      const endpoint = status === 'approved' 
        ? `/api/leave/leave/${selectedLeave._id}/approve`
        : `/api/leave/leave/${selectedLeave._id}/reject`;
      

      const requestBody = status === 'approved' 
        ? { note: approvalNote } 
        : { rejectionReason: approvalNote };       
      await axios.put(
        endpoint,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const updatedLeaves = leaves.map(leave => 
        leave._id === selectedLeave._id 
          ? { ...leave, status } 
          : leave
      );
      
      setLeaves(updatedLeaves);
      calculateStats(updatedLeaves);
      
      setShowApproveDialog(false);
      setApprovalNote('');
      setSelectedLeave(null);
      setShowDetails(false);
      
      // Show success message
      showMessage(`Leave has been ${status} successfully!`, 'success');
    } catch (err) {
      console.error('Failed to update leave status:', err);
      showMessage(`Failed to ${status} leave. Please try again. ${err.response?.data?.message || ''}`);
    }
  };

  // Sort leaves
  const sortedLeaves = [...leaves].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Filter leaves
  const filteredLeaves = sortedLeaves.filter(leave => {
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    const matchesType = leaveTypeFilter === 'all' || leave.leaveType === leaveTypeFilter;
    const matchesSearch = searchTerm === '' || 
      leave.employee.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee Code', 'Leave Type', 'Start Date', 'End Date', 'Total Days', 'Status', 'Reason', 'Applied Date'];
    const csvContent = [
      headers.join(','),
      ...filteredLeaves.map(leave => [
        `"${leave.employee.firstname} ${leave.employee.lastname}"`,
        leave.employee.employeeCode,
        leave.leaveType,
        new Date(leave.startDate).toISOString().split('T')[0],
        new Date(leave.endDate).toISOString().split('T')[0],
        leave.totalDays,
        leave.status,
        `"${leave.reason.replace(/"/g, '""')}"`,
        new Date(leave.appliedAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaves-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Initialize on component mount
  useEffect(() => {
    fetchLeaves();
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} />
          <span>Loading leave data...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Leave Management Dashboard</h1>
          <p style={styles.subtitle}>Manage and review employee leave requests</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <button 
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={fetchLeaves}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={exportToCSV}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '8px',
          marginBottom: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '13px' : '14px'
        }}>
          <CheckCircle size={isMobile ? 18 : 20} />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '8px',
          marginBottom: isMobile ? '16px' : '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '13px' : '14px'
        }}>
          <AlertCircle size={isMobile ? 18 : 20} />
          {error}
        </div>
      )}

      {/* Statistics Cards - Now 2 per line on mobile */}
      {stats && (
        <div style={styles.statsGrid}>
          {Object.entries(stats).map(([key, value]) => {
            if (key === 'total') return null;
            const config = statusConfig[key];
            const Icon = config?.icon || BarChart3;
            
            return (
              <div key={key} style={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ 
                      fontSize: isMobile ? '11px' : '12px', 
                      color: '#64748b', 
                      textTransform: 'uppercase', 
                      fontWeight: '600', 
                      marginBottom: isMobile ? '6px' : '8px' 
                    }}>
                      {key}
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? '26px' : '32px', 
                      fontWeight: '700', 
                      color: config?.color || '#1e293b' 
                    }}>
                      {value}
                    </div>
                  </div>
                  <div style={{ 
                    backgroundColor: config?.bgColor || '#f3f4f6',
                    borderRadius: '12px',
                    padding: isMobile ? '8px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? '40px' : '48px',
                    height: isMobile ? '40px' : '48px'
                  }}>
                    <Icon size={isMobile ? 20 : 24} color={config?.color || '#6b7280'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={20} color="#64748b" />
          <h3 style={{ margin: 0, fontSize: isMobile ? '15px' : '16px', color: '#1e293b' }}>Filters</h3>
        </div>
        <div style={styles.filterSection}>
          <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, employee code, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.input, paddingLeft: '40px', width: '100%' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select 
              value={leaveTypeFilter} 
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
              style={styles.select}
            >
              <option value="all">All Leave Types</option>
              <option value="Annual">Annual</option>
              <option value="Sick">Sick</option>
              <option value="Maternity">Maternity</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ fontSize: isMobile ? '13px' : '14px', color: '#64748b' }}>
            Showing {filteredLeaves.length} of {leaves.length} leave requests
          </div>
          {stats?.pending > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffedd5',
              color: '#9a3412',
              padding: isMobile ? '6px 12px' : '8px 16px',
              borderRadius: '20px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600'
            }}>
              <Clock size={isMobile ? 12 : 14} />
              {stats.pending} pending requests
            </div>
          )}
        </div>
      </div>

      {/* Leaves Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} />
                  Employee
                </div>
              </th>
              <th style={styles.th}>Leave Type</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Days</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Applied On</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave) => {
              const statusStyle = statusConfig[leave.status] || statusConfig.pending;
              const StatusIcon = statusStyle.icon;
              
              return (
                <tr 
                  key={leave._id}
                  style={{
                    ...styles.tr,
                    backgroundColor: leave.status === 'pending' ? '#fff8e1' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedLeave(leave);
                    setShowDetails(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = leave.status === 'pending' ? '#fff8e1' : 'white';
                  }}
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {leave.employee.firstname} {leave.employee.lastname}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#64748b', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      marginTop: '4px' 
                    }}>
                      <User size={12} />
                      {leave.employee.employeeCode}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: '500'
                    }}>
                      <FileText size={12} />
                      {leave.leaveType}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {new Date(leave.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={styles.td}>
                    {new Date(leave.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '700', color: '#3b82f6' }}>
                      {leave.totalDays}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{
                      ...styles.badge,
                      backgroundColor: statusStyle.bgColor,
                      color: statusStyle.textColor
                    }}>
                      <StatusIcon size={12} />
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {new Date(leave.appliedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={styles.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeave(leave);
                          setShowDetails(true);
                        }}
                        title="View Details"
                      >
                        <Eye size={18} color="#64748b" />
                      </button>
                      {leave.status === 'pending' && (
                        <>
                          <button
                            style={styles.iconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeave(leave);
                              setShowApproveDialog(true);
                            }}
                            title="Approve"
                          >
                            <CheckSquare size={18} color="#10b981" />
                          </button>
                          <button
                            style={styles.iconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeave(leave);
                              setShowApproveDialog(true);
                            }}
                            title="Reject"
                          >
                            <XSquare size={18} color="#ef4444" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredLeaves.length === 0 && (
          <div style={styles.emptyState}>
            <FileSpreadsheet size={isMobile ? 40 : 48} color="#cbd5e1" />
            <div style={{ marginTop: '16px', fontSize: isMobile ? '15px' : '16px', color: '#64748b' }}>
              No leave requests found
            </div>
            <div style={{ marginTop: '8px', fontSize: isMobile ? '13px' : '14px', color: '#94a3b8' }}>
              Try adjusting your filters or search terms
            </div>
          </div>
        )}
      </div>

      {/* Leave Details Modal */}
      {showDetails && selectedLeave && (
        <div style={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <FileText size={20} />
                Leave Application Details
              </h3>
              <button 
                style={styles.iconButton}
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              {/* Employee Info */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                padding: isMobile ? '16px' : '20px',
                marginBottom: isMobile ? '16px' : '24px'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#1e293b', 
                  fontSize: isMobile ? '15px' : '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  <User size={isMobile ? 14 : 16} />
                  Employee Information
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: isMobile ? '12px' : '16px' 
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Name</div>
                    <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                      {selectedLeave.employee.firstname} {selectedLeave.employee.lastname}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Employee Code</div>
                    <div style={{ fontSize: '14px', color: '#1e293b' }}>
                      {selectedLeave.employee.employeeCode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Department</div>
                    <div style={{ fontSize: '14px', color: '#1e293b' }}>
                      {selectedLeave.employee.department?.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Job Title</div>
                    <div style={{ fontSize: '14px', color: '#1e293b' }}>
                      {selectedLeave.employee.jobTitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: isMobile ? '16px' : '20px' 
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Leave Type</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                    {selectedLeave.leaveType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Status</div>
                  <div style={{
                    ...styles.badge,
                    backgroundColor: statusConfig[selectedLeave.status]?.bgColor,
                    color: statusConfig[selectedLeave.status]?.textColor
                  }}>
                    {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Start Date</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {new Date(selectedLeave.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>End Date</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {new Date(selectedLeave.endDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Duration</div>
                  <div style={{ fontSize: isMobile ? '20px' : '24px', color: '#3b82f6', fontWeight: '700' }}>
                    {selectedLeave.totalDays} day{selectedLeave.totalDays !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Reason for Leave</div>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: '1.6' }}>
                      {selectedLeave.reason}
                    </div>
                  </div>
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Applied On</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {new Date(selectedLeave.appliedAt).toLocaleString('en-US', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
              {selectedLeave.status === 'pending' && (
                <button 
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={() => {
                    setShowDetails(false);
                    setShowApproveDialog(true);
                  }}
                >
                  <CheckSquare size={16} />
                  Review Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {showApproveDialog && selectedLeave && (
        <div style={styles.modalOverlay} onClick={() => setShowApproveDialog(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <FileText size={20} />
                Review Leave Application
              </h3>
            </div>
            
            <div style={styles.modalContent}>
              <div style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: isMobile ? '12px' : '16px',
                borderRadius: '8px',
                marginBottom: isMobile ? '16px' : '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <Clock size={isMobile ? 16 : 20} />
                Reviewing leave application from <strong style={{ marginLeft: '4px' }}>
                  {selectedLeave.employee.firstname} {selectedLeave.employee.lastname}
                </strong>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: isMobile ? '12px' : '16px', 
                marginBottom: isMobile ? '16px' : '24px' 
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Leave Type</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                    {selectedLeave.leaveType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Duration</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                    {selectedLeave.totalDays} days
                  </div>
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Period</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Approval Note Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                  Note <span style={{ color: '#ef4444' }}>(Required for rejections)</span>
                </label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note explaining your decision..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button 
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => {
                  setShowApproveDialog(false);
                  setApprovalNote('');
                }}
              >
                Cancel
              </button>
              <button 
                style={{ ...styles.button, ...styles.dangerButton }}
                onClick={() => handleApproveReject('rejected')}
              >
                <XSquare size={16} />
                Reject
              </button>
              <button 
                style={{ ...styles.button, ...styles.successButton }}
                onClick={() => handleApproveReject('approved')}
              >
                <CheckSquare size={16} />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Leave;