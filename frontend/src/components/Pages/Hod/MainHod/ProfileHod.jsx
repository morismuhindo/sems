import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Building2, DollarSign, Shield, Clock, Hash, 
  Tag, Award, Users, FileText, Image, IdCard,
  Eye, Edit, Lock, X, EyeOff, Eye as EyeOpen
} from 'lucide-react';
import './ProfileHod.css';

const ProfileHod = ({ employeeData }) => {
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
      <div className="profile-loadingPF">
        <div className="loading-spinnerPF"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-errorPF">
        <Shield size={48} className="error-iconPF" />
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button onClick={fetchUserData} className="retry-btnPF">
          Retry
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-errorPF">
        <User size={48} className="error-iconPF" />
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
    <div className="profile-containerPF">
      <div className="profile-headerPF">
      </div>

      <div className="profile-content-singlePF">
        <div className="profile-picture-section-singlePF">
          <div className="profile-picture-wrapper-singlePF">
            <img 
              src={getPhotoUrl(employee.photo)}
              alt={`${employee.firstname || ''} ${employee.lastname || ''}`}
              className="profile-picture-singlePF"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
                e.target.onerror = null;
              }}
            />
          </div>
          
          <div className="profile-basic-info-singlePF">
            <h2 className="profile-name-singlePF">
              {employee.firstname || 'First'} {employee.lastname || 'Last'}
            </h2>
            <p className="profile-email-singlePF">
              <Mail size={16} />
              {userData.email || 'N/A'}
            </p>
            
            <div className="profile-badges-singlePF">
              <span className="badge-singlePF badge-bluePF">
                <Briefcase size={14} />
                {employee.jobTitle || 'N/A'}
              </span>
              <span className="badge-singlePF badge-greenPF">
                <Building2 size={14} />
                {employee.department?.name || 'N/A'}
              </span>
              <span className="badge-singlePF badge-tealPF">
                <Tag size={14} />
                {employee.employmentType || 'N/A'}
              </span>
              <span className="badge-singlePF badge-tealPF">
                <Hash size={14} />
                Employee ID: <strong>{employee.employeeCode || 'N/A'}</strong>
              </span>
            </div>

            <div className="profile-action-buttonPF">
              <button
                className="cp-btnPF"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Lock size={16} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="profile-card-singlePF">
          <div className="card-header-singlePF">
            <User size={20} className="card-icon-singlePF card-icon-bluePF" />
            <h3 className="card-title-singlePF">Basic Information</h3>
          </div>
          
          <div className="card-content-singlePF">
            <div className="info-section-singlePF">
              <h4 className="info-section-title-singlePF">Personal Details</h4>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <User size={16} />
                  Full Name
                </div>
                <div className="info-value-singlePF">{employee.firstname || ''} {employee.lastname || ''}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Mail size={16} />
                  Email Address
                </div>
                <div className="info-value-singlePF">{userData.email || 'N/A'}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Calendar size={16} />
                  Date of Birth
                </div>
                <div className="info-value-singlePF">{formatDate(employee.dateOfBirth)}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <User size={16} />
                  Gender
                </div>
                <div className="info-value-singlePF">{employee.gender || 'N/A'}</div>
              </div>
            </div>
            
            <div className="info-section-singlePF">
              <h4 className="info-section-title-singlePF">Contact Information</h4>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Phone size={16} />
                  Phone Number
                </div>
                <div className="info-value-singlePF">{employee.phone || 'N/A'}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <MapPin size={16} />
                  Address
                </div>
                <div className="info-value-singlePF address-value-singlePF">
                  {employee.address ? employee.address.split('\n').map((line, index) => (
                    <span key={index}>{line}<br /></span>
                  )) : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="info-section-singlePF">
              <h4 className="info-section-title-singlePF">Employee Details</h4>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Hash size={16} />
                  Employee Code
                </div>
                <div className="info-value-singlePF">{employee.employeeCode || 'N/A'}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Briefcase size={16} />
                  Job Title
                </div>
                <div className="info-value-singlePF">{employee.jobTitle || 'N/A'}</div>
              </div>
              <div className="info-row-singlePF">
                <div className="info-label-singlePF">
                  <Tag size={16} />
                  Employment Type
                </div>
                <div className="info-value-singlePF">{employee.employmentType || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card-singlePF">
          <div className="card-header-singlePF">
            <Briefcase size={20} className="card-icon-singlePF card-icon-greenPF" />
            <h3 className="card-title-singlePF">Employment Details</h3>
          </div>
          
          <div className="card-content-singlePF">
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Award size={16} />
                Job Title
              </div>
              <div className="info-value-singlePF">{employee.jobTitle || 'N/A'}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Tag size={16} />
                Employment Type
              </div>
              <div className="info-value-singlePF">{employee.employmentType || 'N/A'}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Calendar size={16} />
                Hire Date
              </div>
              <div className="info-value-singlePF">{formatDate(employee.hireDate)}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <DollarSign size={16} />
                Base Salary
              </div>
              <div className="info-value-singlePF">{formatCurrency(employee.salaryBase)}</div>
            </div>
          </div>
        </div>

        <div className="profile-card-singlePF">
          <div className="card-header-singlePF">
            <Building2 size={20} className="card-icon-singlePF card-icon-tealPF" />
            <h3 className="card-title-singlePF">Department Information</h3>
          </div>
          
          <div className="card-content-singlePF">
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Building2 size={16} />
                Department
              </div>
              <div className="info-value-singlePF">{employee.department?.name || 'N/A'}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Hash size={16} />
                Department Code
              </div>
              <div className="info-value-singlePF">{employee.department?.code || 'N/A'}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <FileText size={16} />
                Description
              </div>
              <div className="info-value-singlePF">{employee.department?.description || 'No description available'}</div>
            </div>
          </div>
        </div>

        <div className="profile-card-singlePF">
          <div className="card-header-singlePF">
            <Shield size={20} className="card-icon-singlePF card-icon-purplePF" />
            <h3 className="card-title-singlePF">Account Information</h3>
          </div>
          
          <div className="card-content-singlePF">
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Mail size={16} />
                Email Address
              </div>
              <div className="info-value-singlePF">{userData.email || 'N/A'}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <User size={16} />
                User Role
              </div>
              <div className="info-value-singlePF">
                <span className="badge-singlePF badge-bluePF">
                  {userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Employee'}
                </span>
              </div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Clock size={16} />
                Account Created
              </div>
              <div className="info-value-singlePF">{formatDate(userData.createdAt)}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Calendar size={16} />
                Last Updated
              </div>
              <div className="info-value-singlePF">{formatDate(userData.updatedAt)}</div>
            </div>
            <div className="info-row-singlePF">
              <div className="info-label-singlePF">
                <Shield size={16} />
                Account Status
              </div>
              <div className="info-value-singlePF">
                <span className={`status-badge-singlePF status-${userData.status || 'active'}`}>
                  {userData.status ? userData.status.charAt(0).toUpperCase() + userData.status.slice(1) : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-footer-singlePF">        
          <div className="last-update-singlePF">
            <Clock size={14} />
            <span>Profile last synced: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {showChangePasswordModal && (
        <div className="modal-overlay-cpPF" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal-content-cpPF" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-cpPF">
              <h3 className="modal-title-cpPF">
                <Lock size={20} />
                Change Password
              </h3>
              <button 
                className="modal-close-cpPF" 
                onClick={() => setShowChangePasswordModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-cpPF">
              <form onSubmit={handlePasswordChange} className="password-form-cpPF">
                {passwordError && (
                  <div className="alert-cpPF error-cpPF">{passwordError}</div>
                )}
                
                {passwordSuccess && (
                  <div className="alert-cpPF success-cpPF">{passwordSuccess}</div>
                )}
                
                <div className="form-group-cpPF">
                  <label className="form-label-cpPF">
                    <Lock size={16} />
                    Current Password
                  </label>
                  <div className="password-input-wrapper-cpPF">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="form-input-cpPF"
                      required
                      disabled={passwordLoading}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-cpPF"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={passwordLoading}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group-cpPF">
                  <label className="form-label-cpPF">
                    <Lock size={16} />
                    New Password
                  </label>
                  <div className="password-input-wrapper-cpPF">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="form-input-cpPF"
                      required
                      disabled={passwordLoading}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      className="password-toggle-cpPF"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={passwordLoading}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group-cpPF">
                  <label className="form-label-cpPF">
                    <Lock size={16} />
                    Confirm New Password
                  </label>
                  <div className="password-input-wrapper-cpPF">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="form-input-cpPF"
                      required
                      disabled={passwordLoading}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-cpPF"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={passwordLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <EyeOpen size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-actions-cpPF">
                  <button
                    type="button"
                    className="cancel-btn-cpPF"
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
                    className="submit-btn-cpPF"
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

export default ProfileHod;