import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Eye,
  FileText,
  File,
  X,
  AlertCircle,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Users,
  CheckCircle
} from 'lucide-react';
import "./Document.css"

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]); 
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dialogType, setDialogType] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'other',
    description: '',
    file: null,
    fileUrl: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [statsData, setStatsData] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [dialogSuccess, setDialogSuccess] = useState('');
  
  const searchTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const tableContainerRef = useRef(null);
  const documentsRef = useRef([]);

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

  const calculateStats = useCallback((docs) => {
    const stats = {
      total: docs.length,
      byType: {
        constitution: 0,
        certificate: 0,
        policy: 0,
        other: 0
      }
    };

    docs.forEach(doc => {
      if (stats.byType[doc.type] !== undefined) {
        stats.byType[doc.type] += 1;
      } else {
        stats.byType.other += 1;
      }
    });

    return stats;
  }, []);

  const filterDocumentsLocally = useCallback(() => {
    if (!documentsRef.current.length) {
      setFilteredDocuments([]);
      setStatsData(calculateStats([]));
      return;
    }

    let filtered = documentsRef.current;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        (doc.uploadedBy?.fullname && doc.uploadedBy.fullname.toLowerCase().includes(query)) ||
        (doc.uploadedBy?.role && doc.uploadedBy.role.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    setFilteredDocuments(filtered);
    setStatsData(calculateStats(filtered));
  }, [searchQuery, typeFilter, calculateStats]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
    }
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocumentsLocally();
  }, [searchQuery, typeFilter, filterDocumentsLocally]);

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

  const fetchDocuments = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/doc/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: 'all',
          search: ''
        }
      });

      if (response.data.success) {
        const docs = response.data.data || [];
        documentsRef.current = docs;
        setDocuments(docs);
        
        let filtered = docs;
        
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(query) ||
            (doc.description && doc.description.toLowerCase().includes(query)) ||
            (doc.uploadedBy?.fullname && doc.uploadedBy.fullname.toLowerCase().includes(query)) ||
            (doc.uploadedBy?.role && doc.uploadedBy.role.toLowerCase().includes(query))
          );
        }

        if (typeFilter !== 'all') {
          filtered = filtered.filter(doc => doc.type === typeFilter);
        }

        setFilteredDocuments(filtered);
        setStatsData(calculateStats(filtered));
        setError('');
      } else {
        showMessage('Failed to fetch documents');
      }
    } catch (err) {
      showMessage('Failed to fetch documents. Please try again.');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  const silentRefresh = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/doc/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: 'all',
          search: ''
        }
      });

      if (response.data.success) {
        const docs = response.data.data || [];
        documentsRef.current = docs;
        setDocuments(docs);
        filterDocumentsLocally();
      }
    } catch (err) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      setDialogError('');
      setDialogSuccess('');
      setUploadingFile(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      } else {
        setDialogError('Please select a file');
        setUploadingFile(false);
        return;
      }

      const response = await axios.post('/api/doc/create', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDialogSuccess('Document created successfully!');
        setTimeout(() => {
          setDialogSuccess('');
          setOpenDialog(false);
          resetForm();
          silentRefresh();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create document';
      setDialogError(errorMsg);
      setTimeout(() => setDialogError(''), 2000);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleUpdateDocument = async () => {
    try {
      setDialogError('');
      setDialogSuccess('');
      setUploadingFile(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await axios.put(`/api/doc/update/${selectedDocument._id}`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setDialogSuccess('Document updated successfully!');
        setTimeout(() => {
          setDialogSuccess('');
          setOpenDialog(false);
          resetForm();
          silentRefresh();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update document';
      setDialogError(errorMsg);
      setTimeout(() => setDialogError(''), 2000);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      setDialogError('');
      setDialogSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/doc/delete/${selectedDocument._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDialogSuccess('Document deleted successfully!');
        setTimeout(() => {
          setDialogSuccess('');
          setOpenDialog(false);
          silentRefresh();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete document';
      setDialogError(errorMsg);
      setTimeout(() => setDialogError(''), 2000);
    }
  };

  const handleDownload = async (docItem) => {
    try {
      if (!docItem || !docItem.fileUrl) {
        showMessage('No file available for download');
        return;
      }

      const downloadUrl = `${docItem.fileUrl}`;
      window.open(downloadUrl, '_blank');
      showMessage('Download started', 'success');
    } catch (err) {
      showMessage('Failed to download document');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'other',
      description: '',
      file: null,
      fileUrl: ''
    });
    setSelectedDocument(null);
    setDialogError('');
    setDialogSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenCreateDialog = () => {
    setDialogType('create');
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (document) => {
    setDialogType('view');
    setSelectedDocument(document);
    setDialogError('');
    setDialogSuccess('');
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (document) => {
    setDialogType('edit');
    setSelectedDocument(document);
    setFormData({
      title: document.title,
      type: document.type,
      description: document.description,
      file: null,
      fileUrl: document.fileUrl
    });
    setDialogError('');
    setDialogSuccess('');
    setOpenDialog(true);
  };

  const handleOpenDeleteDialog = (document) => {
    setDialogType('delete');
    setSelectedDocument(document);
    setDialogError('');
    setDialogSuccess('');
    setOpenDialog(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setDialogError('File size exceeds 20MB limit');
        setTimeout(() => setDialogError(''), 2000);
        e.target.value = '';
        return;
      }
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setDialogError('Invalid file type. Allowed: PDF, Word, Excel, CSV, images, text files');
        setTimeout(() => setDialogError(''), 2000);
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        file: file,
        fileUrl: URL.createObjectURL(file)
      }));
      setDialogError('');
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Description', 'Uploaded By', 'Role', 'Created Date', 'File URL'];
    const csvContent = [
      headers.join(','),
      ...filteredDocuments.map(doc => [
        `"${doc.title}"`,
        doc.type,
        `"${doc.description?.replace(/"/g, '""') || 'No description'}"`,
        doc.uploadedBy?.fullname || 'Unknown',
        doc.uploadedBy?.role || 'Unknown',
        new Date(doc.createdAt).toISOString().split('T')[0],
        `${doc.fileUrl}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    filterDocumentsLocally();
  };

  if (initialLoading) {
    return (
      <div className="containerDD">
        <div className="loadingDD">
          <RefreshCw size={24} className="spinAnimationDD" style={{ marginRight: '12px' }} />
          <span>Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="containerDD">
      <div className="headerDD">
        <div>
          <h1 className="titleDD">Documents Management</h1>
          <p className="subtitleDD">Manage and organize all documents</p>
        </div>
        <div className="headerActionsDD">
          <button 
            className="buttonDD secondaryButtonDD"
            onClick={() => fetchDocuments(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinAnimationDD' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="buttonDD primaryButtonDD"
            onClick={exportToCSV}
            disabled={filteredDocuments.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
          {userRole === 'hr' && (
            <button 
              className="buttonDD primaryButtonDD"
              onClick={handleOpenCreateDialog}
            >
              <Plus size={16} />
              Add Document
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="successAlertDD">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div className="errorAlertDD">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {statsData && (
        <div className="statsGridDD">
          <div className="statCardDD">
            <div className="statContentDD">
              <div>
                <div className="statLabelDD">Total Documents</div>
                <div className="statValueDD">{statsData.total}</div>
              </div>
              <div className="statIconDD">
                <FileText size={24} color="#3b82f6" />
              </div>
            </div>
          </div>

          {Object.entries(statsData.byType).map(([type, count]) => {
            const config = typeConfig[type] || typeConfig.other;
            const Icon = config.icon;
            
            return (
              <div key={type} className="statCardDD">
                <div className="statContentDD">
                  <div>
                    <div className="statLabelDD">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
                    <div className="statValueDD" style={{ color: config.color }}>{count}</div>
                  </div>
                  <div className="statIconDD" style={{ backgroundColor: config.bgColor }}>
                    <Icon size={24} color={config.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="filterCardDD">
        <div className="filterHeaderDD">
          <Filter size={20} color="#64748b" />
          <h3 className="filterTitleDD">Filters & Search</h3>
        </div>
        <div className="filterSectionDD">
          <div className="searchContainerDD">
            <Search size={16} className="searchIconDD" />
            <input
              type="text"
              placeholder="Search documents by title, description, uploaded by, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="searchInputDD"
              autoComplete='off'
            />
          </div>
          
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="typeSelectDD"
          >
            <option value="all">All Types</option>
            <option value="constitution">Constitution</option>
            <option value="certificate">Certificate</option>
            <option value="policy">Policy</option>
            <option value="other">Other</option>
          </select>

          <button 
            className="buttonDD secondaryButtonDD"
            onClick={clearFilters}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="emptyStateDD">
          <FileSpreadsheet size={48} color="#cbd5e1" />
          <div className="emptyTextDD">
            {documents.length === 0 ? 'No documents found' : 'No documents match your filters'}
          </div>
          {!initialLoading && userRole === 'hr' && (
            <button 
              className="buttonDD primaryButtonDD emptyButtonDD"
              onClick={handleOpenCreateDialog}
            >
              <Plus size={16} />
              Create Your First Document
            </button>
          )}
        </div>
      ) : (
        <div className="tableContainerDD" ref={tableContainerRef}>
          <div className="tableContentDD">
            {filteredDocuments.map((doc) => {
              const typeStyle = typeConfig[doc.type] || typeConfig.other;
              
              return (
                <div key={doc._id} className="documentCardDD">
                  <div className="documentHeaderDD">
                    <div className="documentInfoDD">
                      <div className="documentTitleDD">
                        <h4 className="titleTextDD">{doc.title}</h4>
                        <div
                          className="typeBadgeDD"
                          style={{
                            backgroundColor: typeStyle.bgColor,
                            color: typeStyle.textColor
                          }}
                        >
                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                        </div>
                      </div>
                      
                      <p className="documentDescriptionDD">
                        {doc.description || 'No description provided'}
                      </p>
                      
                      <div className="documentMetaDD">
                        <div className="metaItemDD">
                          <Users size={12} />
                          <span>Uploaded by: {doc.uploadedBy?.fullname || 'Unknown'} ({doc.uploadedBy?.role || 'Unknown role'})</span>
                        </div>
                        <div className="metaItemDD">
                          <Calendar size={12} />
                          <span>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="documentActionsDD">
                      <button
                        className="iconButtonDD"
                        onClick={() => handleOpenViewDialog(doc)}
                        title="View Details"
                      >
                        <Eye size={18} color="#64748b" />
                      </button>
                      <button
                        className="iconButtonDD"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download size={18} color="#3b82f6" />
                      </button>
                      {userRole === 'hr' && (
                        <>
                          <button
                            className="iconButtonDD"
                            onClick={() => handleOpenEditDialog(doc)}
                            title="Edit"
                          >
                            <Edit size={18} color="#f59e0b" />
                          </button>
                          <button
                            className="iconButtonDD"
                            onClick={() => handleOpenDeleteDialog(doc)}
                            title="Delete"
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {openDialog && (
        <div className="modalOverlayDD" onClick={() => {
          setOpenDialog(false);
          resetForm();
        }}>
          <div className="modalDD" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeaderDD">
              <h3 className="modalTitleDD">
                {dialogType === 'create' && 'Create Document'}
                {dialogType === 'view' && 'View Document'}
                {dialogType === 'edit' && 'Edit Document'}
                {dialogType === 'delete' && 'Delete Document'}
              </h3>
              <button 
                className="closeButtonDD"
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modalContentDD">
              {dialogSuccess && (
                <div className="successAlertDD modalAlertDD">
                  <CheckCircle size={20} />
                  {dialogSuccess}
                </div>
              )}

              {dialogError && (
                <div className="errorAlertDD modalAlertDD">
                  <AlertCircle size={20} />
                  {dialogError}
                </div>
              )}

              {dialogType === 'delete' ? (
                <div>
                  <div className="warningAlertDD">
                    <AlertCircle size={20} />
                    <span className="warningTextDD">Warning: This action cannot be undone</span>
                  </div>
                  <p className="deleteMessageDD">
                    Are you sure you want to delete the document "<strong>{selectedDocument?.title}</strong>"?
                  </p>
                  <div className="modalActionsDD">
                    <button 
                      className="buttonDD secondaryButtonDD"
                      onClick={() => {
                        setOpenDialog(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="buttonDD dangerButtonDD"
                      onClick={handleDeleteDocument}
                    >
                      <Trash2 size={16} />
                      Delete Document
                    </button>
                  </div>
                </div>
              ) : dialogType === 'view' ? (
                <div>
                  <div className="viewHeaderDD">
                    <div className="documentIconDD" style={{
                      backgroundColor: typeConfig[selectedDocument?.type]?.bgColor || '#f3f4f6'
                    }}>
                      <FileText size={24} color={typeConfig[selectedDocument?.type]?.color || '#6b7280'} />
                    </div>
                    <div>
                      <h4 className="viewTitleDD">{selectedDocument?.title}</h4>
                      <div
                        className="viewBadgeDD"
                        style={{
                          backgroundColor: typeConfig[selectedDocument?.type]?.bgColor,
                          color: typeConfig[selectedDocument?.type]?.textColor
                        }}
                      >
                        {selectedDocument?.type}
                      </div>
                    </div>
                  </div>

                  <div className="descriptionSectionDD">
                    <div className="sectionLabelDD">Description</div>
                    <div className="descriptionContentDD">
                      {selectedDocument?.description || 'No description provided'}
                    </div>
                  </div>

                  <div className="infoGridDD">
                    <div className="infoItemDD">
                      <div className="infoLabelDD">Uploaded By</div>
                      <div className="infoValueDD">
                        {selectedDocument?.uploadedBy?.fullname || 'Unknown'} ({selectedDocument?.uploadedBy?.role || 'Unknown role'})
                      </div>
                    </div>
                    <div className="infoItemDD">
                      <div className="infoLabelDD">Created Date</div>
                      <div className="infoValueDD">
                        {format(new Date(selectedDocument?.createdAt), 'PPpp')}
                      </div>
                    </div>
                  </div>

                  <div className="modalActionsDD">
                    <button 
                      className="buttonDD secondaryButtonDD"
                      onClick={() => {
                        setOpenDialog(false);
                        resetForm();
                      }}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleDownload(selectedDocument)}
                      className="buttonDD primaryButtonDD"
                    >
                      <Download size={16} />
                      Download Document
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  dialogType === 'create' ? handleCreateDocument() : handleUpdateDocument();
                }}>
                  <div className="formGroupDD">
                    <div className="formFieldDD">
                      <label className="formLabelDD">
                        Title <span className="requiredDD">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="formInputDD"
                        autoComplete='off'
                        required
                        placeholder="Enter document title"
                      />
                    </div>

                    <div className="formFieldDD">
                      <label className="formLabelDD">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="formInputDD"
                      >
                        <option value="other">Other</option>
                        <option value="constitution">Constitution</option>
                        <option value="certificate">Certificate</option>
                        <option value="policy">Policy</option>
                      </select>
                    </div>

                    <div className="formFieldDD">
                      <label className="formLabelDD">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="4"
                        className="formTextareaDD"
                        placeholder="Enter document description"
                      />
                    </div>

                    <div className="formFieldDD">
                      <label className="formLabelDD">
                        File {dialogType === 'create' && <span className="requiredDD">*</span>}
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="formFileInputDD"
                        required={dialogType === 'create'}
                      />
                      <div className="formHintDD">
                        Max file size: 20MB • Allowed: PDF, Word, Excel, CSV, images, text files
                      </div>
                    </div>

                    <div className="modalActionsDD">
                      <button 
                        type="button"
                        className="buttonDD secondaryButtonDD"
                        onClick={() => {
                          setOpenDialog(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="buttonDD primaryButtonDD"
                        disabled={uploadingFile}
                      >
                        {uploadingFile ? (
                          <>
                            <RefreshCw size={16} className="spinAnimationDD" />
                            Uploading...
                          </>
                        ) : (
                          dialogType === 'create' ? 'Create Document' : 'Update Document'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;