import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from "../../assets/sems.png";

// Navigation bar component with live date and time display
const Navbar = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date to readable string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time to readable string
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left section: Logo and organization name */}
        <div className="navbar-left">
          <div className="logo-container">
            <img 
              src={logo} 
              alt="Company Logo" 
              className="logo"
            />
          </div>
          <div className="organization-name">
            <h1 className="org-title">Smart Employee Management System</h1>
            <p className="org-subtitle">Easy Employee Management</p>
          </div>
        </div>

        {/* Right section: Live date and time */}
        <div className="navbar-right">
          <div className="datetime-container">
            <div className="date-display">
              <span className="date-text">{formatDate(currentDateTime)}</span>
            </div>
            <div className="time-display">
              <span className="time-text">{formatTime(currentDateTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;