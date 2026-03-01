import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Building2, Plus, Pencil, Trash2,
  Calendar, X, CheckCircle, AlertCircle,
  Eye, Mail, Phone, MapPin, Camera, Loader2
} from 'lucide-react';
import './organisation.css';

const API_BASE_URL = '/api/org';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Hospitality',
  'Transportation',
  'Other'
];

const STATUS_OPTIONS = ['active', 'inactive', 'pending'];

const INITIAL_FORM_DATA = {
  name: '',
  industry: '',
  registrationNumber: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  },
  status: 'active',
  logo: ''
};

const STATUS_CONFIG = {
  active: { className: 'status-badge-activeO', icon: <CheckCircle size={14} /> },
  inactive: { className: 'status-badge-inactiveO', icon: <AlertCircle size={14} /> },
  pending: { className: 'status-badge-pendingO', icon: <AlertCircle size={14} /> }
};

const INDUSTRY_COLORS = {
  'Technology': 'industry-techO',
  'Healthcare': 'industry-healthO',
  'Finance': 'industry-financeO',
  'Education': 'industry-educationO',
  'Manufacturing': 'industry-manufacturingO',
  'Retail': 'industry-retailO',
  'Construction': 'industry-constructionO',
  'Hospitality': 'industry-hospitalityO',
  'Transportation': 'industry-transportationO',
  'Other': 'industry-otherO'
};

const getAuthToken = () => localStorage.getItem('token');

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`
});

const getLogoUrl = (logo) => {
  if (!logo || logo === 'undefined' || logo === 'null' || logo === '') {
    return null;
  }
  
  if (typeof logo === 'string') {
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    if (logo.startsWith('/')) {
      return `${logo}`;
    }
    return `/uploads/${logo}`;
  }
  
  return null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (formData) => {
  const errors = [];
  
  if (!formData.name.trim()) {
    errors.push('Organisation name is required');
  }
  
  if (formData.email && !EMAIL_REGEX.test(formData.email)) {
    errors.push('Please enter a valid email address');
  }
  
  return errors;
};

const getOrgId = (org) => {
  if (!org) return null;
  
  const id = org._id || org.id;
  
  if (!id) {
    const idKeys = Object.keys(org).filter(key => 
      key.toLowerCase().includes('id') || key === '_id'
    );
    if (idKeys.length > 0) {
      return org[idKeys[0]];
    }
  }
  
  return id;
};

const Organisations = () => {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/org`, {
        headers: getAuthHeaders()
      });
      
      let orgsArray = [];
      
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          orgsArray = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          orgsArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response.data)) {
        orgsArray = response.data;
      }
      
      setOrganisations(orgsArray);
      setError('');
    } catch (err) {
      setError('Failed to load organisations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleLogoUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setLogoPreview('');
    };
    reader.readAsDataURL(file);

    const formDataObj = new FormData();
    formDataObj.append("logo", file);

    try {
      setUploadingLogo(true);

      const response = await axios.post(
        `${API_BASE_URL}/logo`,
        formDataObj,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data.success && response.data.url) {
        const uploadedUrl = response.data.url;
        const fullImageUrl = getLogoUrl(uploadedUrl);
        
        setFormData(prev => ({ 
          ...prev, 
          logo: uploadedUrl
        }));
        
        if (fullImageUrl) {
          setLogoPreview(fullImageUrl);
        } else {
          setLogoPreview(uploadedUrl);
        }
        
        setSuccess('Logo uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to upload logo. Please try again.';
      setError(`Upload error: ${errorMessage}`);
      
      setLogoPreview('');
      
      if (currentOrg?.logo) {
        const prevLogoUrl = getLogoUrl(currentOrg.logo);
        setLogoPreview(prevLogoUrl || '');
      }
    } finally {
      setUploadingLogo(false);
    }
  }, [currentOrg]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const submissionData = {
        name: formData.name.trim(),
        industry: formData.industry,
        registrationNumber: formData.registrationNumber.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address,
        status: formData.status,
        logo: formData.logo
      };

      if (isEditing && currentOrg) {
        const orgId = getOrgId(currentOrg);
        
        if (!orgId || orgId === 'undefined') {
          throw new Error('Invalid organisation ID for update');
        }
        
        await axios.put(`${API_BASE_URL}/${orgId}`, submissionData, {
          headers: getAuthHeaders()
        });
        setSuccess('Organisation updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/createOrg`, submissionData, {
          headers: getAuthHeaders()
        });
        setSuccess('Organisation created successfully!');
      }

      setTimeout(() => {
        setShowModal(false);
        resetForm();
        fetchOrganisations();
      }, 1500);
    } catch (err) {
      if (err.message.includes('Invalid organisation ID')) {
        setError('Cannot update: Invalid organisation ID');
      } else if (err.response?.status === 404) {
        setError('Organisation not found. It may have been deleted.');
      } else if (err.response?.status === 500) {
        setError('Server error.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to save organisation');
      }
    } finally {
      setUploading(false);
    }
  }, [formData, isEditing, currentOrg, fetchOrganisations]);

  const handleDelete = useCallback((organisation) => {
    setOrgToDelete(organisation);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!orgToDelete) return;

    try {
      setDeleting(true);
      const orgId = getOrgId(orgToDelete);
      
      if (!orgId) {
        throw new Error('Invalid organisation ID');
      }
      
      await axios.delete(`${API_BASE_URL}/${orgId}`, {
        headers: getAuthHeaders()
      });
      
      setSuccess('Organisation deleted successfully!');
      setShowDeleteConfirm(false);
      setOrgToDelete(null);
      fetchOrganisations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete organisation');
    } finally {
      setDeleting(false);
    }
  }, [orgToDelete, fetchOrganisations]);

  const handleEdit = useCallback((organisation) => {
    const orgId = getOrgId(organisation);
    
    if (!orgId) {
      setError('Cannot edit organisation: Missing ID');
      return;
    }
    
    const logoUrl = getLogoUrl(organisation.logo);
    
    setFormData({
      name: organisation.name || '',
      industry: organisation.industry || '',
      registrationNumber: organisation.registrationNumber || '',
      email: organisation.email || '',
      phone: organisation.phone || '',
      address: organisation.address || INITIAL_FORM_DATA.address,
      status: organisation.status || 'active',
      logo: organisation.logo || ''
    });
    
    setLogoPreview(logoUrl || '');
    setCurrentOrg(organisation);
    setIsEditing(true);
    setViewMode(false);
    setShowModal(true);
  }, []);

  const handleView = useCallback((organisation) => {
    const logoUrl = getLogoUrl(organisation.logo);
    
    setFormData({
      name: organisation.name || '',
      industry: organisation.industry || '',
      registrationNumber: organisation.registrationNumber || '',
      email: organisation.email || '',
      phone: organisation.phone || '',
      address: organisation.address || INITIAL_FORM_DATA.address,
      status: organisation.status || 'active',
      logo: organisation.logo || ''
    });
    
    setLogoPreview(logoUrl || '');
    setCurrentOrg(organisation);
    setIsEditing(false);
    setViewMode(true);
    setShowModal(true);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentOrg(null);
    setIsEditing(false);
    setViewMode(false);
    setLogoPreview('');
    setError('');
    setSuccess('');
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
    
    return (
      <span className={`status-badgeO ${statusInfo.className}`}>
        {statusInfo.icon}
        <span className="ml-1O capitalize">{status}</span>
      </span>
    );
  }, []);

  const getIndustryBadge = useCallback((industry) => {
    const industryClass = INDUSTRY_COLORS[industry] || 'industry-otherO';
    
    return (
      <span className={`industry-badgeO ${industryClass}`}>
        {industry || 'Not specified'}
      </span>
    );
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    resetForm();
  }, [resetForm]);

  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.parentElement.querySelector('.org-logo-placeholderO, .logo-placeholderO');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }, []);

  const handleModalImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const placeholder = e.target.parentElement.querySelector('.logo-placeholderO');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }, []);

  if (loading && organisations.length === 0) {
    return (
      <div className="organisations-containerO">
        <div className="loading-spinnerO">Loading organisations...</div>
      </div>
    );
  }

  return (
    <div className="organisations-containerO">
      <div className="dashboard-headerO">
        <h1>
          <Building2 size={28} className='org' />
          Organisations Management
        </h1>
        <button 
          className="add-btnO"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Organisation
        </button>
      </div>

      {error && <div className="errorO">{error}</div>}
      {success && <div className="successO">{success}</div>}

      <div className="organisations-table-containerO">
        <table className="organisations-tableO">
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Industry</th>
              <th>Registration No.</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organisations.length > 0 ? (
              organisations.map((org) => {
                const logoUrl = getLogoUrl(org.logo);
                const orgId = getOrgId(org);
                
                return (
                  <tr key={orgId}>
                    <td>
                      <div className="org-infoO">
                        <div className="org-avatarO">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={org.name} 
                              className="org-logoO square-logoO"
                              onError={handleImageError}
                              loading="lazy"
                            />
                          ) : null}
                          <div 
                            className="org-logo-placeholderO square-logoO"
                            style={{ display: logoUrl ? 'none' : 'flex' }}
                          >
                            <Building2 size={20} />
                          </div>
                        </div>
                        <div className="org-detailsO">
                          <div className="org-nameO">{org.name}</div>
                          <div className="org-emailO">
                            <Mail size={12} />
                            {org.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getIndustryBadge(org.industry)}</td>
                    <td>
                      <span className="reg-numberO">{org.registrationNumber || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="contact-infoO">
                        <div className="contact-phoneO">
                          <Phone size={12} />
                          {org.phone || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="address-infoO">
                        <MapPin size={12} />
                        <span title={org.address ? `${org.address.street}, ${org.address.city}` : 'No address'}>
                          {org.address ? (org.address.city || 'No city') : 'No address'}
                        </span>
                      </div>
                    </td>
                    <td>{getStatusBadge(org.status || 'active')}</td>
                    <td>
                      <div className="created-dateO">
                        <Calendar size={12} />
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="actionsO">
                        <button 
                          className="editO"
                          onClick={() => handleEdit(org)}
                          title="Edit Organisation"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          className="viewO"
                          onClick={() => handleView(org)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="deleteO"
                          onClick={() => handleDelete(org)}
                          title="Delete Organisation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="no-results-contentO">
                    <Building2 size={48} />
                    <h3>No organisations found</h3>
                    <p>Click "Add Organisation" to create your first organisation</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlayO" onClick={closeModal}>
          <div className="modal-contentO" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerO">
              <h2>
                {viewMode ? 'View Organisation Details' : isEditing ? 'Edit Organisation' : 'Add New Organisation'}
              </h2>
              <button 
                className="modal-close-btnO"
                onClick={closeModal}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="modal-errorO">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {success && (
              <div className="modal-successO">
                <CheckCircle size={20} />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="organisation-formO">
              <div className="logo-upload-sectionO">
                <div className="logo-previewO">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="org-logo-previewO square-logo-previewO"
                      onError={handleModalImageError}
                    />
                  ) : null}
                  <div 
                    className="logo-placeholderO square-logo-previewO"
                    style={{ display: logoPreview ? 'none' : 'flex' }}
                  >
                    <Building2 size={48} />
                  </div>
                </div>
                
                {!viewMode && (
                  <div className="logo-upload-controlsO">
                    <label className={`upload-btnO ${uploadingLogo ? 'uploadingO' : ''}`}>
                      <Camera size={20} />
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo || viewMode}
                        hidden
                        autoComplete="off"
                      />
                    </label>
                    
                    {formData.logo && !viewMode && (
                      <button
                        type="button"
                        className="remove-logo-btnO"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, logo: '' }));
                          setLogoPreview('');
                        }}
                        disabled={viewMode || uploadingLogo}
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                )}
                
                {uploadingLogo && (
                  <small className="form-hintO">Uploading logo to server...</small>
                )}
              </div>

              <div className="form-gridO">
                <div className="form-sectionO">
                  <h3 className="section-titleO">
                    <Building2 size={20} /> Basic Information
                  </h3>
                  
                  <div className="form-groupO">
                    <label>Organisation Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Nkumba University"
                      disabled={viewMode}
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-rowO">
                    <div className="form-groupO">
                      <label>Industry</label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        disabled={viewMode}
                        autoComplete="off"
                      >
                        <option value="">Select Industry</option>
                        {INDUSTRY_OPTIONS.map(industry => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-groupO">
                      <label>Registration Number</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="REG123456"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-rowO">
                    <div className="form-groupO">
                      <label><Mail size={16} /> Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@organisation.com"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-groupO">
                      <label><Phone size={16} /> Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="07xxxxxxxx"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-groupO">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={viewMode}
                      autoComplete="off"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-sectionO">
                  <h3 className="section-titleO">
                    <MapPin size={20} /> Address Information
                  </h3>
                  
                  <div className="form-groupO">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="Street Name"
                      disabled={viewMode}
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-rowO">
                    <div className="form-groupO">
                      <label>City</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="Kampala"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-groupO">
                      <label>State/Province</label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="Entebbe"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-rowO">
                    <div className="form-groupO">
                      <label>Country</label>
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address.country}
                        onChange={handleInputChange}
                        placeholder="United States"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-groupO">
                      <label>ZIP/Postal Code</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                        placeholder="0000"
                        disabled={viewMode}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!viewMode && (
                <div className="form-actionsO">
                  <button
                    type="button"
                    className="cancel-btnO"
                    onClick={closeModal}
                    disabled={uploading || uploadingLogo}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btnO"
                    disabled={uploading || uploadingLogo}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={18} className="spinnerO" />
                        Saving...
                      </>
                    ) : isEditing ? 'Update Organisation' : 'Create Organisation'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-modalO">
          <div className="delete-confirm-contentO">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{orgToDelete?.name}"? This action cannot be undone.</p>
            
            {error && (
              <div className="modal-errorO delete-modal-errorO">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            
            <div className="delete-confirm-actionsO">
              <button 
                className="cancel-delete-btnO" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError('');
                }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btnO" 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="spinnerO" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organisations;