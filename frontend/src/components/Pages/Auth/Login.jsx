import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../Security/AuthLayout";
import { redirectByRole } from "../../Security/auth";
import { Eye, EyeOff,AlertCircle } from "lucide-react";
import "./Login.css";

const Login = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      
      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setSuccessMessage("Login successful! Redirecting...");
      
      // Force a re-render and then redirect
      setTimeout(() => {
        redirectByRole(data.user.role, navigate);
      }, 500);

    } catch (error) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
  // Prevent browser back/forward navigation
  window.history.pushState(null, "", window.location.href);

  const handlePopState = () => {
    window.history.pushState(null, "", window.location.href);
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);

  return (
    <AuthLayout title="Login to SEMS">
      <form onSubmit={handleLogin} className="login-form">
        {errorMessage && (
          <div className="error-message5">
            <span className="error-icon5">!</span>
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message5">
            <span className="success-icon5">✓</span>
            {successMessage}
          </div>
        )}

        <input
          type="text"
          placeholder="Email or Employee Code"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="login-input"
          required
          disabled={isLoading}
          autoComplete="off"
        />

        <div className="password-input-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input password-input"
            required
            disabled={isLoading}
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

       

        <button 
          type="submit" 
          className="login-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Logging in...
            </>
          ) : "Login"}
        </button>

        <p className="login-link">
          HR only? <Link to="/register">Register HR</Link>
        </p>
         <div className="login-link">
          <Link to="/forgot-password">Forgot Password?</Link>
          <div className="notice">
            <AlertCircle className="nicon"/>
          <p>If it's your first time logging in first read privacy guidelines and terms of use</p>


          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;