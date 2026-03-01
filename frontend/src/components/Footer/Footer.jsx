import React from "react";
import "./Footer.css";
import logo from "../../assets/sems.png";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="sems-footer">
      <div className="sems-footer-container">
        
        {/* Left */}
        <div className="sems-footer-brand">
          <img src={logo} alt="SEMS Logo" className="sems-footer-logo" />
          <span className="sems-footer-text">
            © {year} Smart Employee Management System
          </span>
        </div>

        {/* Right */}
        <nav className="sems-footer-links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </nav>

      </div>
    </footer>
  );
};

export default Footer;
