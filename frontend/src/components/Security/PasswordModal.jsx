import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle, Mail, Key, User } from 'lucide-react';
import './PasswordModal.css';

const PasswordModal = ({ isOpen, onClose, userId, onPasswordChanged, isMandatory = false }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle body scroll locking when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setLoading(false);
      setSuccess(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/${userId}`,
        {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onPasswordChanged) {
            onPasswordChanged();
          }
          onClose();
        }, 1500);
      } else {
        setErrors({
          submit: data.message || 'Failed to change password'
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setErrors({
        submit: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({
        ...prev,
        submit: ''
      }));
    }
  };

  const handleKeyDown = (e) => {
    // Close modal on Escape key if not mandatory
    if (e.key === 'Escape' && !isMandatory) {
      onClose();
    } else if (e.key === 'Escape' && isMandatory) {
      e.preventDefault();
      // Don't show alert, just prevent closing
    }
  };

  // Add event listener for Escape key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, isMandatory]);

  const handleOverlayClick = (e) => {
    // Only close if not mandatory
    if (!isMandatory && e.target === e.currentTarget) {
      onClose();
    } else if (isMandatory && e.target === e.currentTarget) {
      // Don't show alert, just prevent closing
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="password-modal-overlay">
        <div className="password-modal success-modal">
          <div className="password-success">
            <CheckCircle size={48} className="success-icon2" />
            <h3>Password Changed Successfully!</h3>
            <p>Your password has been updated successfully.</p>
            <button 
              onClick={onClose}
              className="success-close-btn"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-modal-overlay" onClick={handleOverlayClick}>
      <div className="password-modal">
        {!isMandatory && (
          <button 
            onClick={onClose} 
            className="password-modal-close"
            disabled={loading}
          >
            <X size={20} />
          </button>
        )}
        
        <div className="password-modal-header"> 
          <div className="header">
            <div className='Lock'><Lock size={24} /></div>      
            <h2 className="password-modal-title">Change Your Password</h2>
          </div>
         
          <p className="password-modal-subtitle">
            For security reasons, you must change your password on first login.
          </p>
        </div>

        <div className="password-modal-body">
          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword" className="input-label">
                <Key size={18} />
                <span>Current Password</span>
              </label>
              <div className="input-with-icon">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                  placeholder="Enter your current password"
                  disabled={loading}
                  autoComplete="current-password"
                  autoFocus={!formData.currentPassword}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={loading}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="input-label">
                <Lock size={18} />
                <span>New Password</span>
              </label>
              <div className="input-with-icon">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  placeholder="Enter your new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
              <div className="password-hints">
                <span className="hint">• At least 6 characters</span>
                <span className="hint">• Must be different from current password</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="input-label">
                <Lock size={18} />
                <span>Confirm New Password</span>
              </label>
              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            {errors.submit && (
              <div className="submit-error">
                {errors.submit}
              </div>
            )}

            <div className="password-modal-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  'Change Password'
                )}
              </button>
              
              {!isMandatory && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
