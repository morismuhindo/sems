import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      navigate('/login');
    }
  }, [redirectCountdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setRedirectCountdown(null);

    try {
      const response = await fetch('/api/reset/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send reset email. Please try again.');
        setLoading(false);
        return;
      }

      if (data.success) {
        setSuccess('Reset link sent! Check your email. Redirecting to login...');
        setEmail('');
        setRedirectCountdown(3); // Start 3-second countdown
      } else {
        setError(data.message || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="forgot-main-containerFG">
      <div className="forgot-containerFG">
        <div className="forgot-cardFG">
          <div className="forgot-headerFG">
            <div className="forgot-iconFG">
              <Mail size={48} />
            </div>
            <h2>Reset Your Password</h2>
            <p className="forgot-subtitleFG">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {error && (
            <div className="forgot-error-messageFG">
              <AlertCircle size={20} className="error-iconFG" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="forgot-success-messageFG">
              <CheckCircle size={20} className="success-iconFG" />
              <span>
                {success}
                {redirectCountdown !== null && ` (${redirectCountdown})`}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-formFG">
            <div className="form-groupFG">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-iconFG">
                <Mail size={20} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  disabled={loading || success}
                  autoComplete="off"
                />
              </div>
              {email && !validateEmail(email) && (
                <small className="input-errorFG">Please enter a valid email address</small>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-btnFG"
              disabled={loading || success || !email || !validateEmail(email)}
            >
              {loading ? (
                <>
                  <span className="spinnerFG"></span>
                  Sending...
                </>
              ) : success ? 'Email Sent' : 'Send Reset Link'}
            </button>
          </form>

          <div className="forgot-helpFG">
            <p>Need help? Contact our support team.</p>
            <p className="forgot-noteFG">
              <small>Token expires in 15 minutes. Check spam folder if you don't see the email.</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;