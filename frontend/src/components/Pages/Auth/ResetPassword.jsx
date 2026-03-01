import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import "./ResetPassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`/api/reset/reset-password/${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data.success) {
        setSuccessMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="reset-main-containerRS">
      <div className="reset-back-btnRS" onClick={handleBackToLogin}>
        <ArrowLeft size={18} />
        Back to Login
      </div>
      
      <div className="reset-containerRS">
        <div className="reset-cardRS">
          <div className="reset-headerRS">
            <h2>Reset Password</h2>
            <p className="reset-subtitleRS">
              Enter a new password for your account
            </p>
          </div>
          
          {errorMessage && (
            <div className="reset-error-messageRS">
              <AlertCircle size={18} className="error-iconRS" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="reset-success-messageRS">
              <CheckCircle size={18} className="success-iconRS" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="reset-formRS">
            <div className="input-groupRS">
              <label htmlFor="password">New Password</label>
              <div className="password-input-containerRS">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="reset-inputRS password-inputRS"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btnRS"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-groupRS">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-containerRS">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                  autoComplete="off"
                  className="reset-inputRS password-inputRS"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle-btnRS"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="reset-btnRS"
              disabled={loading || !formData.password || !formData.confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner-iconRS" />
                  <span>Resetting...</span>
                </>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;



