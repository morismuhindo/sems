import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Scale, 
  Shield, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  Lock,
  Users,
  Database,
  Server,
  ClipboardCheck,
  Mail,
  Building,
  Briefcase,
  UserCheck,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Terms.css';

const TermsAndConditions = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  useEffect(() => {
    const savedAgreed = localStorage.getItem('sems_terms_accepted');
    if (savedAgreed === 'true') {
      setAgreed(true);
    }
  }, []);
  
  const sections = [
    {
      icon: BookOpen,
      title: "1. Definitions",
      content: [
        "1.1 'SEMS' refers to the Smart Employee Management System.",
        "1.2 'User' refers to any employee, administrator, or personnel authorized to access SEMS.",
        "1.3 'Organization' refers to the company or entity that has licensed SEMS for its operations.",
        "1.4 'Data' includes all employee information, performance records, payroll data, and system logs."
      ]
    },
    {
      icon: Shield,
      title: "2. User Account & Access",
      content: [
        "2.1 Account credentials are strictly personal and non-transferable.",
        "2.2 Users must immediately report unauthorized access or security breaches.",
        "2.3 The organization reserves the right to suspend or terminate access for policy violations.",
        "2.4 Users must not attempt to access data beyond their authorized scope."
      ]
    },
    {
      icon: Database,
      title: "3. Data Protection & Privacy",
      content: [
        "3.1 All employee data within SEMS is confidential and protected under applicable laws.",
        "3.2 Data may only be used for legitimate business purposes as defined by the organization.",
        "3.3 Exporting or copying data requires explicit authorization from management."
      ]
    },
    {
      icon: Server,
      title: "4. System Usage Guidelines",
      content: [
        "4.1 No modifications, reverse engineering, or circumvention of security measures allowed.",
        "4.2 Users must not introduce malware, viruses, or harmful code into the system.",
        "4.3 Automated data extraction or scraping requires prior written consent."
      ]
    },
    {
      icon: Users,
      title: "5. Employee Responsibilities",
      content: [
        "5.1 Maintain accurate and up-to-date personal information in the system.",
        "5.2 Protect login credentials and enable security features when available.",
        "5.3 Report system errors, bugs, or vulnerabilities through proper channels.",
        "5.4 Complete required training before accessing sensitive system modules."
      ]
    },
    {
      icon: Building,
      title: "6. Organization's Rights",
      content: [
        "6.1 Right to monitor system activity for security and compliance purposes.",
        "6.2 Right to modify, update, or discontinue SEMS features with reasonable notice.",
        "6.3 Right to restrict access based on organisation requirements and security policies.",
        "6.4 Right to audit user activity and data access patterns."
      ]
    },
    {
      icon: Briefcase,
      title: "7. Intellectual Property",
      content: [
        "7.1 SEMS software, interface, and documentation are proprietary property.",
        "7.2 Users are granted a limited, non-exclusive license for authorized use only.",
        "7.3 No rights to copy, distribute, or modify the software are granted.",
        "7.4 All customizations remain the property of the software provider."
      ]
    },
    {
      icon: Lock,
      title: "8. Security Compliance",
      content: [
        "8.1 Users must comply with all organizational security policies.",
        "8.2 Devices used to access SEMS must have updated security software.",
        "8.3 Suspicious activity must be reported immediately to IT security."
      ]
    },
    {
      icon: UserCheck,
      title: "9. Termination & Suspension",
      content: [
        "9.1 Access terminates immediately upon employment termination.",
        "9.2 The organization may suspend access during investigations.",
        "9.3 Users must return all company data upon access termination."
      ]
    },
    {
      icon: Eye,
      title: "10. Confidentiality",
      content: [
        "10.1 All information within SEMS is considered confidential.",
        "10.2 Users must not disclose system information to unauthorized parties.",
        "10.3 Confidentiality obligations continue after employment ends.",
        "10.4 Breach of confidentiality may result in legal action."
      ]
    },
    {
      icon: AlertCircle,
      title: "11. Liability & Disclaimer",
      content: [
        "11.1 SEMS is provided 'as is' without warranties of any kind.",
        "11.2 The organization is not liable for system downtime or data loss.",
        "11.3 Users are responsible for backing up critical personal data.",
        "11.4 Liability is limited to the maximum extent permitted by law."
      ]
    }
  ];

  const handleAgree = () => {
    localStorage.setItem('sems_terms_accepted', 'true');
    localStorage.setItem('sems_terms_accepted_date', new Date().toISOString());
    navigate('/login');
  };

  const handlePrintTerms = () => {
    const printContent = document.querySelector('.terms-wrapper');
    const originalContent = printContent.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalContent;
    
    const agreementBox = tempDiv.querySelector('.agreement-box');
    const printBtn = tempDiv.querySelector('.print-button');
    
    if (agreementBox) agreementBox.style.display = 'none';
    if (printBtn) printBtn.style.display = 'none';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SEMS Terms and Conditions</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .terms-header { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #374151; }
            .terms-title { color: #374151; margin: 0 0 10px 0; }
            .terms-section { background: white; border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .section-title { color: #2c3e50; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            @media print { 
              body { margin: 0; padding: 10px; font-size: 12px; }
              .terms-section { break-inside: avoid; }
            }
            @page { margin: 1cm; }
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
    if (!agreed) {
      setAgreed(true);
      localStorage.setItem('sems_terms_accepted', 'true');
    }
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setAgreed(true);
      localStorage.setItem('sems_terms_accepted', 'true');
    }
  };

  return (
    <div className="terms-container">
      <div className="terms-wrapper">
        {/* Header */}
        <div className="terms-header-card">
          <div className="terms-header-content">
            <div className="terms-icon-wrapper">
              <Scale className="terms-main-icon" />
            </div>
            <div>
              <h1 className="terms-title">SEMS Terms & Conditions</h1>
              <p className="terms-subtitle">Smart Employee Management System - Legal Agreement</p>
            </div>
          </div>
          <div className="terms-notice-alert">
            <AlertCircle className="notice-icon" />
            <div>
              <h3 className="notice-title">LEGALLY BINDING AGREEMENT</h3>
              <p className="notice-text">
                By accessing and using SEMS, you agree to be bound by these Terms and Conditions. 
                This agreement governs your use of the system and establishes your rights and obligations.
              </p>
            </div>
          </div>
        </div>

        {/* Updated Date Info */}
        <div className="terms-updated-card">
          <div className="updated-header">
            <FileText className="updated-icon" />
            <h3 className="updated-title">Last Updated: {lastUpdated}</h3>
          </div>
        </div>
       
        {/* Terms Sections */}
        <div className="terms-sections-container">
          {sections.map((section, index) => (
            <div key={index} className="terms-section-card">
              <div className="terms-section-header">
                <div className="terms-section-icon">
                  {React.createElement(section.icon, { className: "section-icon" })}
                </div>
                <h2 className="terms-section-title">{section.title}</h2>
              </div>
              <div className="terms-section-content">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className="terms-content-item">
                    <CheckCircle className="content-icon" />
                    <p className="content-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Agreement Box */}
        <div className="agreement-box">
          <div className="agreement-header">
            <ClipboardCheck className="agreement-icon" />
            <div>
              <h2 className="agreement-title">Accept Terms & Conditions</h2>
              <p className="agreement-subtitle">You must accept to continue using SEMS</p>
            </div>
          </div>
          
          <div className="terms-checkbox">
            <input
              type="checkbox"
              id="terms-agree"
              checked={agreed}
              onChange={handleCheckboxChange}
              className="terms-checkbox-input"
            />
            <label htmlFor="terms-agree" className="terms-checkbox-label" onClick={handleLabelClick}>
              <span className="terms-agree-text">
                I HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS 
                STATED ABOVE. I ACKNOWLEDGE THAT THIS IS A LEGALLY BINDING AGREEMENT.
              </span>
            </label>
          </div>
          
          <div className="agreement-actions">
            <div className="terms-buttons-container">
              <button
                onClick={handleAgree}
                disabled={!agreed}
                className={`agree-button ${agreed ? 'enabled' : 'disabled'}`}
              >
                {agreed ? 'Accept & Go To Login' : 'Accept Terms to Continue'}
              </button>
              <button 
                onClick={handlePrintTerms}
                className="print-button"
              >
                Print Terms
              </button>
            </div>
            <p className="agreement-footer">
              Last accepted: {localStorage.getItem('sems_terms_accepted_date') ? 
                new Date(localStorage.getItem('sems_terms_accepted_date')).toLocaleDateString() : 
                'Not yet accepted'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="terms-footer">
          <p className="terms-footer-text">
            <FileText className="footer-icon" /> Smart Employee Management System (SEMS)
          </p>
          <p className="terms-footer-subtext">
            © {new Date().getFullYear()} . All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;