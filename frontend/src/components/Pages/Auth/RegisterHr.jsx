
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../Security/AuthLayout";
import { 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2 
} from "lucide-react";
import "./RegisterHr.css";

const RegisterHr = () => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("https://sems-backend-s2my.onrender.com/api/registerHR", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("HR registered successfully! Redirecting to login...");
      
      // Clear form
      setFullname("");
      setEmail("");
      setPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthLayout title="Register HR (One-Time Setup)">
      <form onSubmit={handleRegister} className="register-form">
        {errorMessage && (
          <div className="register-error-message">
            <AlertCircle size={20} className="error-icon2" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="register-success-message">
            <CheckCircle2 size={20} className="success-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="input-group">
          <label htmlFor="fullname">Full Name</label>
          <input 
            id="fullname"
            type="text"
            placeholder="Enter full name" 
            value={fullname}
            onChange={e => setFullname(e.target.value)} 
            className="register-input"
            required
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input 
            id="email"
            type="email"
            placeholder="Enter email address" 
            value={email}
            onChange={e => setEmail(e.target.value)} 
            className="register-input"
            required
            disabled={isLoading}
            autoComplete="off"
          />
          {email && !validateEmail(email) && (
            <small className="input-error">Please enter a valid email address</small>
          )}
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input 
              id="password"
              type={showPassword ? "text" : "password"} 
              placeholder="Enter password (min. 6 characters)" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              className="register-input password-input"
              required
              disabled={isLoading}
              minLength={6}
              autoComplete="off"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={20} className="password-icon" />
              ) : (
                <Eye size={20} className="password-icon" />
              )}
            </button>
          </div>
          {password && !validatePassword(password) && (
            <small className="input-error">Password must be at least 6 characters</small>
          )}
        </div>

        <div className="form-note">
          <p><strong>Important:</strong> This is a one-time HR registration. Only the first registration will be accepted.</p>
        </div>

        <button 
          type="submit" 
          className="register-btn"
          disabled={isLoading || !fullname || !validateEmail(email) || !validatePassword(password)}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="spinner-icon" />
              <span>Registering...</span>
            </>
          ) : "Register HR"}
        </button>

        <p className="register-link">
          Already registered? <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterHr;
