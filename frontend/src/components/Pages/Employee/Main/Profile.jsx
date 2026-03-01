import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Building2, DollarSign, Shield, Clock, Hash, 
  Tag, Award, Users, FileText, Image, IdCard,
  Eye, Edit, Lock, X, EyeOff, Eye as EyeOpen
} from 'lucide-react';
import './Profile.css';

const Profile = ({ employeeData }) => {
  const [userData, setUserData] = useState(employeeData || null);
  const [loading, setLoading] = useState(!employeeData);
  const [error, setError] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPhotoUrl = (photoPath) => {
    if (!photoPath || photoPath === 'undefined' || photoPath === 'null') {
      return '/default-avatar.png';
    }
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    if (photoPath.startsWith('/uploads')) {
      return `${photoPath}`;
    }
    
    if (photoPath.includes('.')) {
      return `/uploads/${photoPath}`;
    }
    
    return '/default-avatar.png';
  };

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    let userId = storedUserData._id;
    
    if (!userId && token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        userId = payload.userId || payload.id || payload._id || payload.userID;
      } catch (decodeErr) {}
    }
    
    if (!userId) {
      const loginResponse = JSON.parse(localStorage.getItem('loginResponse') || '{}');
      if (loginResponse.user && loginResponse.user._id) {
        userId = loginResponse.user._id;
      }
    }
    
    return userId;
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }
      
      const userId = getUserIdFromToken();
      
      if (!userId) {
        setError('Unable to determine user ID. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/${userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        setUserData(response.data.data);
      } else if (response.data) {
        setUserData(response.data);
      } else {
        setError('Invalid response format from server');
      }
      
    } catch (err) {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const meResponse = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (meResponse.data && meResponse.data.success) {
          setUserData(meResponse.data.data);
          return;
        }
        
        if (err.response && err.response.status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError(err.response?.data?.message || 'Error fetching user data');
        }
        
      } catch (fallbackErr) {
        setError('Unable to fetch profile data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userId = getUserIdFromToken();

      const response = await axios.put(
        `/api/${userId}`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (!employeeData) {
      fetchUserData();
    }
  }, [employeeData]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <Shield size={48} className="error-icon" />
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={fetchUserData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-error">
        <User size={48} className="error-icon" />
        <h3>No User Data Found</h3>
        <p>Please try again later</p>
      </div>
    );
  }

  const employee = userData.employee || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
      </div>

      <div className="profile-content-single">
        
        <div className="profile-picture-section-single">
          <div className="profile-picture-wrapper-single">
            <img 
              src={getPhotoUrl(employee.photo)}
              alt={`${employee.firstname || ''} ${employee.lastname || ''}`}
              className="profile-picture-single"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
                e.target.onerror = null;
              }}
            />
          </div>
          
          <div className="profile-basic-info-single">
            <h2 className="profile-name-single">
              {employee.firstname || 'First'} {employee.lastname || 'Last'}
            </h2>
            <p className="profile-email-single">
              <Mail size={16} />
              {userData.email || 'N/A'}
            </p>
            
            <div className="profile-badges-single">
              <span className="badge-single badge-blue">
                <Briefcase size={14} />
                {employee.jobTitle || 'N/A'}
              </span>
              <span className="badge-single badge-green">
                <Building2 size={14} />
                {employee.department?.name || 'N/A'}
              </span>
              <span className="badge-single badge-teal">
                <Tag size={14} />
                {employee.employmentType || 'N/A'}
              </span>
              <span className="badge-single badge-green">
                <Hash size={14} />
                Employee ID: <strong>{employee.employeeCode || 'N/A'}</strong>
              </span>
            </div>

            <div className="profile-action-button">
              <button
                className="cp-btn"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Lock size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="profile-card-single">
          <div className="card-header-single">
            <User size={20} className="card-icon-single card-icon-blue" />
            <h3 className="card-title-single">Basic Information</h3>
          </div>
          
          <div className="card-content-single">
            <div className="info-section-single">
              <h4 className="info-section-title-single">Personal Details</h4>
              <div className="info-row-single">
                <div className="info-label-single">
                  <User size={16} />
                  Full Name
                </div>
                <div className="info-value-single">{employee.firstname || ''} {employee.lastname || ''}</div>
              </div>
              <div className="info-row-single">
                <div className="info-label-single">
                  <Mail size={16} />
                  Email Address
                </div>
                <div className="info-value-single">{userData.email || 'N/A'}</div>
              </div>
              <div className="info-row-single">
                <div className="info-label-single">
                  <Calendar size={16} />
                  Date of Birth
                </div>
                <div className="info-value-single">{formatDate(employee.dateOfBirth)}</div>
              </div>
              <div className="info-row-single">
                <div className="info-label-single">
                  <User size={16} />
                  Gender
                </div>
                <div className="info-value-single">{employee.gender || 'N/A'}</div>
              </div>
            </div>
            
            <div className="info-section-single">
              <h4 className="info-section-title-single">Contact Information</h4>
              <div className="info-row-single">
                <div className="info-label-single">
                  <Phone size={16} />
                  Phone Number
                </div>
                <div className="info-value-single">{employee.phone || 'N/A'}</div>
              </div>
              <div className="info-row-single">
                <div className="info-label-single">
                  <MapPin size={16} />
                  Address
                </div>
                <div className="info-value-single address-value-single">
                  {employee.address ? employee.address.split('\n').map((line, index) => (
                    <span key={index}>{line}<br /></span>
                  )) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card-single">
          <div className="card-header-single">
            <Briefcase size={20} className="card-icon-single card-icon-green" />
            <h3 className="card-title-single">Employment Details</h3>
          </div>
          
          <div className="card-content-single">
            <div className="info-row-single">
              <div className="info-label-single">
                <Award size={16} />
                Job Title
              </div>
              <div className="info-value-single">{employee.jobTitle || 'N/A'}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Tag size={16} />
                Employment Type
              </div>
              <div className="info-value-single">{employee.employmentType || 'N/A'}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Calendar size={16} />
                Hire Date
              </div>
              <div className="info-value-single">{formatDate(employee.hireDate)}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <DollarSign size={16} />
                Base Salary
              </div>
              <div className="info-value-single">{formatCurrency(employee.salaryBase)}</div>
            </div>
          </div>
        </div>

        <div className="profile-card-single">
          <div className="card-header-single">
            <Building2 size={20} className="card-icon-single card-icon-teal" />
            <h3 className="card-title-single">Department Information</h3>
          </div>
          
          <div className="card-content-single">
            <div className="info-row-single">
              <div className="info-label-single">
                <Building2 size={16} />
                Department
              </div>
              <div className="info-value-single">{employee.department?.name || 'N/A'}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Hash size={16} />
                Department Code
              </div>
              <div className="info-value-single">{employee.department?.code || 'N/A'}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <FileText size={16} />
                Description
              </div>
              <div className="info-value-single">{employee.department?.description || 'No description available'}</div>
            </div>
          </div>
        </div>

        <div className="profile-card-single">
          <div className="card-header-single">
            <Shield size={20} className="card-icon-single card-icon-purple" />
            <h3 className="card-title-single">Account Information</h3>
          </div>
          
          <div className="card-content-single">
            <div className="info-row-single">
              <div className="info-label-single">
                <Mail size={16} />
                Email Address
              </div>
              <div className="info-value-single">{userData.email || 'N/A'}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <User size={16} />
                User Role
              </div>
              <div className="info-value-single">
                <span className="badge-single badge-blue">
                  {userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Employee'}
                </span>
              </div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Clock size={16} />
                Account Created
              </div>
              <div className="info-value-single">{formatDate(userData.createdAt)}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Calendar size={16} />
                Last Updated
              </div>
              <div className="info-value-single">{formatDate(userData.updatedAt)}</div>
            </div>
            <div className="info-row-single">
              <div className="info-label-single">
                <Shield size={16} />
                Account Status
              </div>
              <div className="info-value-single">
                <span className={`status-badge-single status-${userData.status || 'active'}`}>
                  {userData.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-footer-single">        
          <div className="last-update-single">
            <Clock size={14} />
            <span>Profile last synced: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {showChangePasswordModal && (
        <div className="modal-overlay-cp" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal-content-cp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-cp">
              <h3 className="modal-title-cp">
                <Lock size={20} />
                Change Password
              </h3>
              <button 
                className="modal-close-cp" 
                onClick={() => setShowChangePasswordModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-cp">
              <form onSubmit={handlePasswordChange} className="password-form-cp">
                {passwordError && (
                  <div className="alert-cp error-cp">{passwordError}</div>
                )}
                
                {passwordSuccess && (
                  <div className="alert-cp success-cp">{passwordSuccess}</div>
                )}
                
                <div className="form-group-cp">
                  <label className="form-label-cp">
                    <Lock size={16} />
                    Current Password
                  </label>
                  <div className="password-input-wrapper-cp">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="form-input-cp"
                      required
                      disabled={passwordLoading}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-cp"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={passwordLoading}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group-cp">
                  <label className="form-label-cp">
                    <Lock size={16} />
                    New Password
                  </label>
                  <div className="password-input-wrapper-cp">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="form-input-cp"
                      required
                      disabled={passwordLoading}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="password-toggle-cp"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={passwordLoading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group-cp">
                  <label className="form-label-cp">
                    <Lock size={16} />
                    Confirm New Password
                  </label>
                  <div className="password-input-wrapper-cp">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="form-input-cp"
                      required
                      disabled={passwordLoading}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-cp"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={passwordLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-actions-cp">
                  <button
                    type="button"
                    className="cancel-btn-cp"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                      setPasswordForm({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn-cp"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;