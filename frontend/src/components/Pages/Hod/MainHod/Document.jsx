import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Search,
  Download,
  Eye,
  FileText,
  File,
  AlertCircle,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Users,
  CheckCircle
} from 'lucide-react';

const Document = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  
  const searchTimeoutRef = useRef(null);

  const styles = {
    container: {
      padding: 'clamp(16px, 3vw, 24px)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 'clamp(24px, 3vw, 32px)',
      flexWrap: 'wrap',
      gap: 'clamp(12px, 2vw, 16px)'
    },
    title: {
      fontSize: 'clamp(20px, 4vw, 28px)',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: 'clamp(12px, 2vw, 14px)',
      color: '#64748b',
      marginTop: '4px'
    },
    button: {
      padding: 'clamp(8px, 2vw, 10px) clamp(16px, 2vw, 20px)',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: 'clamp(12px, 2vw, 14px)',
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
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: 'clamp(16px, 3vw, 24px)',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      marginBottom: 'clamp(16px, 3vw, 24px)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
      gap: 'clamp(12px, 3vw, 20px)',
      marginBottom: 'clamp(24px, 3vw, 32px)'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: 'clamp(16px, 3vw, 20px)',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      transition: 'all 0.3s ease'
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
    },
    badge: {
      padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
      borderRadius: '20px',
      fontSize: 'clamp(10px, 2vw, 12px)',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    },
    filterSection: {
      display: 'flex',
      gap: 'clamp(8px, 2vw, 16px)',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 'clamp(16px, 3vw, 24px)'
    },
    select: {
      padding: 'clamp(8px, 2vw, 10px) clamp(12px, 2vw, 16px)',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      fontSize: 'clamp(12px, 2vw, 14px)',
      minWidth: 'clamp(120px, 20vw, 150px)'
    },
    input: {
      padding: 'clamp(8px, 2vw, 10px) clamp(12px, 2vw, 16px)',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      fontSize: 'clamp(12px, 2vw, 14px)',
      flex: '1 1 200px',
      minWidth: '0',
      maxWidth: '100%'
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
      padding: 'clamp(12px, 3vw, 20px)'
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
      padding: 'clamp(16px, 3vw, 24px)',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: {
      fontSize: 'clamp(16px, 4vw, 20px)',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    modalContent: {
      padding: 'clamp(16px, 3vw, 24px)'
    },
    modalActions: {
      padding: 'clamp(16px, 3vw, 24px)',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'clamp(8px, 2vw, 12px)',
      flexWrap: 'wrap'
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
      padding: 'clamp(32px, 6vw, 48px) clamp(16px, 3vw, 24px)',
      color: '#64748b'
    },
    iconButton: {
      padding: 'clamp(6px, 1vw, 8px)',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    documentCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: 'clamp(16px, 3vw, 20px)',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      marginBottom: 'clamp(12px, 2vw, 16px)'
    }
  };

  const typeConfig = {
    constitution: {
      color: '#3b82f6',
      icon: FileText,
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    },
    certificate: {
      color: '#10b981',
      icon: CheckCircle,
      bgColor: '#d1fae5',
      textColor: '#065f46'
    },
    policy: {
      color: '#8b5cf6',
      icon: FileText,
      bgColor: '#ede9fe',
      textColor: '#5b21b6'
    },
    other: {
      color: '#6b7280',
      icon: File,
      bgColor: '#f3f4f6',
      textColor: '#374151'
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showMessage('Authentication required. Please login again.', 'error');
        return;
      }

      const params = {
        page: page + 1,
        limit: rowsPerPage,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined
      };

      const response = await axios.get('/api/doc/all', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params,
        timeout: 10000
      });

      if (response.data.success) {
        const docsData = response.data.data || [];
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: docsData.length
        };
        
        setDocuments(docsData);
        setTotalDocuments(pagination.totalItems);
        setPaginationInfo(pagination);
        calculateStats(docsData);
        
        if (docsData.length === 0) {
          showMessage('No documents found', 'info');
        } else {
          showMessage(`Loaded ${docsData.length} documents`, 'success');
        }
      } else {
        showMessage(response.data.message || 'Failed to fetch documents', 'error');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to fetch documents';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (documentsData) => {
    const stats = {
      total: documentsData.length,
      byType: {
        constitution: 0,
        certificate: 0,
        policy: 0,
        other: 0
      }
    };

    documentsData.forEach(doc => {
      const docType = doc.type || 'other';
      if (stats.byType[docType] !== undefined) {
        stats.byType[docType] += 1;
      } else {
        stats.byType.other += 1;
      }
    });

    setStatsData(stats);
  };

  const showMessage = (message, type = 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else if (type === 'info') {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, rowsPerPage, typeFilter]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
      fetchDocuments();
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleDownload = async (docItem) => {
    try {
      if (!docItem || !docItem.fileUrl) {
        showMessage('No file available for download', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      
      let downloadUrl;
      if (docItem.fileUrl.startsWith('http')) {
        downloadUrl = docItem.fileUrl;
      } else {
        const cleanUrl = docItem.fileUrl.startsWith('/') ? docItem.fileUrl : `/${docItem.fileUrl}`;
        downloadUrl = `${cleanUrl}`;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', docItem.originalFileName || docItem.title || 'document');
      
      if (token && !downloadUrl.includes('token=')) {
        link.href = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}token=${token}`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showMessage(`Downloading ${docItem.originalFileName || 'document'}`, 'success');
      
    } catch (err) {
      showMessage('Failed to download document', 'error');
    }
  };

  const handleOpenViewDialog = (document) => {
    setSelectedDocument(document);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDocument(null);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(0);
    }, 500);
  };

  if (loading && documents.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} />
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Company Documents</h1>
          <p style={styles.subtitle}>View and download company documents</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={fetchDocuments}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {success && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#166534',
          padding: 'clamp(12px, 2vw, 16px)',
          borderRadius: '8px',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: 'clamp(12px, 2vw, 16px)',
          borderRadius: '8px',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {statsData && statsData.total > 0 && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
                  Total Documents
                </div>
                <div style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: '#3b82f6' }}>
                  {totalDocuments}
                </div>
              </div>
              <div style={{ 
                backgroundColor: '#dbeafe',
                borderRadius: '12px',
                padding: 'clamp(10px, 2vw, 12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={24} color="#3b82f6" />
              </div>
            </div>
          </div>

          {Object.entries(statsData.byType)
            .filter(([type, count]) => count > 0)
            .map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.other;
            const Icon = config.icon;
            
            return (
              <div key={type} style={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <div style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '700', color: config.color }}>
                      {count}
                    </div>
                  </div>
                  <div style={{ 
                    backgroundColor: config.bgColor,
                    borderRadius: '12px',
                    padding: 'clamp(10px, 2vw, 12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} color={config.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={20} color="#64748b" />
          <h3 style={{ margin: 0, fontSize: 'clamp(14px, 3vw, 16px)', color: '#1e293b' }}>Filters & Search</h3>
        </div>
        <div style={styles.filterSection}>
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '0' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search documents by title, description..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ ...styles.input, paddingLeft: '40px' }}
            />
          </div>
          
          <select 
            value={typeFilter} 
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="constitution">Constitution</option>
            <option value="certificate">Certificate</option>
            <option value="policy">Policy</option>
            <option value="other">Other</option>
          </select>

          <select 
            value={rowsPerPage} 
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setPage(0);
            }}
            style={styles.select}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {documents.length === 0 ? (
        <div style={styles.emptyState}>
          <FileSpreadsheet size={48} color="#cbd5e1" />
          <div style={{ marginTop: '16px', fontSize: 'clamp(14px, 3vw, 16px)', color: '#64748b' }}>
            {loading ? 'Loading documents...' : 'No documents found'}
          </div>
          {!loading && (
            <button 
              onClick={fetchDocuments}
              style={{ ...styles.button, ...styles.primaryButton, marginTop: '16px' }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {documents.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((doc, index) => {
                  const docType = doc.type || 'other';
                  const typeStyle = typeConfig[docType] || typeConfig.other;
                  
                  return (
                    <div key={doc._id || index} style={styles.documentCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: '1 1 300px', minWidth: '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0, fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: '600', color: '#1e293b' }}>
                              {doc.title || 'Untitled Document'}
                            </h4>
                            <div style={{
                              ...styles.badge,
                              backgroundColor: typeStyle.bgColor,
                              color: typeStyle.textColor
                            }}>
                              {docType.charAt(0).toUpperCase() + docType.slice(1)}
                            </div>
                          </div>
                          
                          <p style={{ margin: 0, fontSize: 'clamp(12px, 2vw, 14px)', color: '#64748b', lineHeight: '1.5' }}>
                            {doc.description || 'No description provided'}
                          </p>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={12} />
                              <span>Uploaded by: {doc.uploadedBy?.fullname || 'Unknown'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              <span>{doc.createdAt ? format(new Date(doc.createdAt), 'MMM dd, yyyy') : 'Date not available'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            style={styles.iconButton}
                            onClick={() => handleOpenViewDialog(doc)}
                            title="View Details"
                          >
                            <Eye size={18} color="#64748b" />
                          </button>
                          <button
                            style={styles.iconButton}
                            onClick={() => handleDownload(doc)}
                            title="Download"
                          >
                            <Download size={18} color="#3b82f6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {paginationInfo.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Showing {Math.min((page + 1) * rowsPerPage, totalDocuments)} of {totalDocuments} documents
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton,
                    opacity: page === 0 ? 0.5 : 1,
                    cursor: page === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= totalDocuments}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    opacity: (page + 1) * rowsPerPage >= totalDocuments ? 0.5 : 1,
                    cursor: (page + 1) * rowsPerPage >= totalDocuments ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {openDialog && selectedDocument && (
        <div style={styles.modalOverlay} onClick={handleCloseDialog}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <FileText size={20} />
                Document Details
              </h3>
              <button 
                style={styles.iconButton}
                onClick={handleCloseDialog}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{
                  backgroundColor: typeConfig[selectedDocument.type]?.bgColor || '#f3f4f6',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={24} color={typeConfig[selectedDocument.type]?.color || '#6b7280'} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>{selectedDocument.title || 'Untitled Document'}</h4>
                  <div style={{
                    ...styles.badge,
                    backgroundColor: typeConfig[selectedDocument.type]?.bgColor,
                    color: typeConfig[selectedDocument.type]?.textColor,
                    marginTop: '4px'
                  }}>
                    {selectedDocument.type || 'other'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Description</div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: '1.5'
                }}>
                  {selectedDocument.description || 'No description provided'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Uploaded By</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                    {selectedDocument.uploadedBy?.fullname || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Created Date</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {selectedDocument.createdAt ? format(new Date(selectedDocument.createdAt), 'PPpp') : 'Date not available'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>File Name</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                    {selectedDocument.originalFileName || selectedDocument.fileName || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>File Size</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Organization</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                    {selectedDocument.organisation?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>File Type</div>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>
                    {selectedDocument.mimeType || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button 
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={handleCloseDialog}
                >
                  Close
                </button>
                {selectedDocument.fileUrl && (
                  <button
                    onClick={() => {
                      handleDownload(selectedDocument);
                      handleCloseDialog();
                    }}
                    style={{ ...styles.button, ...styles.primaryButton }}
                  >
                    <Download size={16} />
                    Download Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default Document;