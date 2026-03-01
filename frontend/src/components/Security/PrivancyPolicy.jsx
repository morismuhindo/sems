import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  User,
  Key,
  Eye,
  ClipboardCheck,
  Mail,
  Server,
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Privacy.css';

const PrivacyPolicy = () => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  
  const lastUpdated = "January 15, 2024";
  const version = "3.2";
  
  useEffect(() => {
    const savedAccepted = localStorage.getItem('sems_privacy_checkbox');
    if (savedAccepted === 'true') {
      setAccepted(true);
    }
  }, []);
  
  const policySections = [
    {
      icon: User,
      title: "Employee Account Responsibility",
      points: [
        "Your SEMS account credentials are strictly personal and non-transferable",
        "You are responsible for all activities under your account",
        "Never share your username, password, or security codes with anyone",
        "Log out after each session, especially on shared computers"
      ]
    },
    {
      icon: Lock,
      title: "Data Access & Confidentiality",
      points: [
        "Access only data necessary for your job role",
        "Do not view, modify, or share other employees' information without authorization",
        "Report any unauthorized access immediately to IT Security",
      ]
    },
    {
      icon: Shield,
      title: "Security Requirements",
      points: [
        "Use strong passwords (minimum 6 characters with mix of letters, numbers, symbols)",
        "Do not use SEMS on public Wi-Fi without VPN",
        "Keep your devices updated with latest security patches"
      ]
    },
    {
      icon: Eye,
      title: "Data Privacy Agreement",
      points: [
        "Personal employee data is for official business use only",
        "Do not export, copy, or screenshot sensitive information",
        "Comply with data privacy polices of your organisation",
        "Data may be monitored for security and compliance purposes"
      ]
    },
    {
      icon: Server,
      title: "System Usage Rules",
      points: [
        "No unauthorized system modifications or bypassing security controls",
        "Report system vulnerabilities through proper channels",
        "No data scraping or automated access without approval",
        "Comply with IT policies and acceptable use guidelines of your organisation"
      ]
    }
  ];

  const handleAccept = () => {
    localStorage.setItem('sems_privacy_accepted', 'true');
    localStorage.setItem('sems_privacy_checkbox', 'true');
    localStorage.setItem('sems_privacy_accepted_date', new Date().toISOString());
    localStorage.setItem('sems_privacy_version', version);
    navigate('/login');
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
  

  const handleDownloadPDF = () => {
    const printContent = document.querySelector('.privacy-policy-wrapper');
    const originalContent = printContent.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalContent;
    const acceptBox = tempDiv.querySelector('.acceptance-box');
    const downloadBtn = tempDiv.querySelector('.download-button');
    if (acceptBox) acceptBox.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SEMS Privacy Policy</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .privacy-header-card { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #2563eb; }
            .privacy-title { color: #2563eb; margin: 0 0 10px 0; }
            .policy-section-card { background: white; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .section-title { color: #2c3e50; margin-top: 0; }
            .credential-card { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 8px; }
            .contact-card { background: #e7f3ff; border: 1px solid #b3d7ff; padding: 15px; margin: 15px 0; border-radius: 8px; }
            @media print { body { margin: 0; padding: 10px; } }
          </style>
        </head>
        <body>
          ${tempDiv.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleLabelClick = () => {
    if (!accepted) {
      const newAccepted = true;
      setAccepted(newAccepted);
      localStorage.setItem('sems_privacy_checkbox', newAccepted.toString());
    }
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setAccepted(true);
      localStorage.setItem('sems_privacy_checkbox', 'true');
    }
  };

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-wrapper">
        <div className="privacy-header-card">
          <div className="privacy-header-content">
            <div>
              <h1 className="privacy-title">SEMS Privacy & Security Agreement</h1>
              <p className="privacy-subtitle">Smart Employee Management System - Employee Responsibility Agreement</p>
            </div>
          </div>
          <div className="privacy-warning-alert">
            <AlertTriangle className="warning-icon" />
            <div>
              <h3 className="warning-title">REQUIRED BEFORE LOGIN</h3>
              <p className="warning-text">
                You must read and accept this agreement before you can access the Smart Employee Management System (SEMS). 
                This is a mandatory requirement for all users.
              </p>
            </div>
          </div>
        </div>

        <div className="policy-sections-container">
          {policySections.map((section, index) => (
            <div key={index} className="policy-section-card">
              <div className="section-header-left">
                <div className="section-icon-left">
                  {React.createElement(section.icon, { className: "section-icon" })}
                </div>
                <h2 className="section-title-left">{section.title}</h2>
              </div>
              <div className="section-list">
                {section.points.map((point, pointIndex) => (
                  <div key={pointIndex} className="section-list-item">
                    <CheckCircle className="list-icon" />
                    <p className="list-text">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="credential-card">
          <div className="credential-header">
            <Key className="credential-icon" />
            <h2 className="credential-title">CRITICAL: Credential Protection</h2>
          </div>
          <div className="credential-grid">
            <div className="credential-column">
              <h3 className="column-title red">NEVER DO:</h3>
              <div className="credential-list">
                <div className="credential-list-item">
                  <div className="list-marker marker-red">
                    <span className="font-bold">X</span>
                  </div>
                  <span className="marker-text red">Share password with colleagues</span>
                </div>
                <div className="credential-list-item">
                  <div className="list-marker marker-red">
                    <span className="font-bold">X</span>
                  </div>
                  <span className="marker-text red">Write password on sticky notes</span>
                </div>
                <div className="credential-list-item">
                  <div className="list-marker marker-red">
                    <span className="font-bold">X</span>
                  </div>
                  <span className="marker-text red">Use same password for other sites</span>
                </div>
                <div className="credential-list-item">
                  <div className="list-marker marker-red">
                    <span className="font-bold">X</span>
                  </div>
                  <span className="marker-text red">Login from untrusted devices</span>
                </div>
              </div>
            </div>
            <div className="credential-column">
              <h3 className="column-title green">ALWAYS DO:</h3>
              <div className="credential-list">
                <div className="credential-list-item">
                  <div className="list-marker marker-green">
                    <span className="font-bold">✓</span>
                  </div>
                  <span className="marker-text green">Use password manager</span>
                </div>
                <div className="credential-list-item">
                  <div className="list-marker marker-green">
                    <span className="font-bold">✓</span>
                  </div>
                  <span className="marker-text green">Report suspicious activity</span>
                </div>
                <div className="credential-list-item">
                  <div className="list-marker marker-green">
                    <span className="font-bold">✓</span>
                  </div>
                  <span className="marker-text green">Lock computer when away</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-card">
          <h3 className="contact-title">
            <Mail className="contact-icon" />
            Need Help?
          </h3>
          <div className="contact-grid-fixed">
            <div className="contact-item">
              <p className="contact-label">SEMS Support</p>
              <p className="contact-value">muhindomoris2003@gmail.com</p>
              <p className="contact-extra">24/7 Support</p>
            </div>
            <div className="contact-item">
              <p className="contact-label">Emergency Hotline</p>
              <p className="contact-value">+256785672470</p>
              <p className="contact-extra">24/7 Support</p>
            </div>
          </div>
        </div>

        <div className="acceptance-box">
          <div className="acceptance-header">
            <ClipboardCheck className="acceptance-icon" />
            <div>
              <h2 className="acceptance-title">Accept Agreement to Proceed</h2>
              <p className="acceptance-subtitle">You must accept to return to the login page and use SEMS</p>
            </div>
          </div>
          <div className="agreement-checkbox">
            <input
              type="checkbox"
              id="agree"
              checked={accepted}
              onChange={handleCheckboxChange}
              className="checkbox-input"
            />
            <label htmlFor="agree" className="checkbox-label" onClick={handleLabelClick}>
              <span className="font-medium">I understand and agree to:</span>
              <ul className="agreement-list">
                <li className="agreement-list-item">Keep my credentials secure and never share them</li>
                <li className="agreement-list-item">Only access data needed for my job duties</li>
                <li className="agreement-list-item">Report any security concerns immediately</li>
                <li className="agreement-list-item">Follow all SEMS security policies and procedures</li>
                <li className="agreement-list-item">Accept that my activity is monitored for security</li>
              </ul>
            </label>
          </div>
          <div className="acceptance-actions">
            <div className="buttons-container">
              <button
                onClick={handleAccept}
                disabled={!accepted}
                className={`accept-button ${accepted ? 'enabled' : 'disabled'}`}
              >
                {accepted ? 'Accept & Go to Login' : 'Accept Agreement to Continue'}
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="download-button"
              >
                Download PDF Copy
              </button>
            </div>
          </div>
        </div>

        <div className="privacy-footer">
          <p className="footer-text">Smart Employee Management System (SEMS)</p>
          <p className="footer-subtext">© {new Date().getFullYear()} . All rights reserved.</p>
          <p className="footer-note">
            Access to SEMS is restricted to authorized personnel only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;