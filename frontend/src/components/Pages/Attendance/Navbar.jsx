import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Bell, 
  LogOut, 
  User,
  Briefcase
} from 'lucide-react';
import './Navbar.css';

const Navbar = ({ setActiveSection }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [company, setCompany] = useState(null);
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(1);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([fetchCompanyData(), fetchUserData()]);
      setLoading(false);
    };
    
    fetchAllData();
  }, []);
  
  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      const response = await axios.get('/api/org/org', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let orgsArray = [];
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          orgsArray = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          orgsArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response.data)) {
        orgsArray = response.data;
      }
      
      const currentCompany = orgsArray.length > 0 ? orgsArray[0] : getDefaultCompany();
      setCompany(currentCompany);
    } catch (err) {
      setCompany(getDefaultCompany());
    }
  };
  
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      let userId = null;
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      userId = storedUserData._id;
      
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
      
      if (!userId) {
        return;
      }
      
      const response = await axios.get(`/api/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        const user = response.data.data;
        setUserData(user);
        
        if (user.employee) {
          setEmployeeData(user.employee);
        }
      } else if (response.data) {
        setUserData(response.data);
        
        if (response.data.employee) {
          setEmployeeData(response.data.employee);
        }
      }
    } catch (err) {
      try {
        const token = localStorage.getItem('token');
        const meResponse = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (meResponse.data && meResponse.data.success) {
          const user = meResponse.data.data;
          setUserData(user);
          
          if (user.employee) {
            setEmployeeData(user.employee);
          }
        }
      } catch (meErr) {}
    }
  };
  
  const getLogoUrl = (logo) => {
    if (!logo || logo === 'undefined' || logo === 'null') {
      return null;
    }
    
    if (typeof logo === 'string' && (logo.startsWith('http://') || logo.startsWith('https://'))) {
      return logo;
    }
    
    if (typeof logo === 'string') {
      const path = logo.startsWith('/') ? logo : `/${logo}`;
      return `${path}`;
    }
    
    if (logo && typeof logo === 'object') {
      if (logo.url) {
        const url = logo.url;
        return url.startsWith('http') ? url : `${url}`;
      }
      if (logo.path) {
        const path = logo.path.startsWith('/') ? logo.path : `/${logo.path}`;
        return `${path}`;
      }
    }
    
    return null;
  };
  
  const getProfilePicUrl = (photoPath) => {
    if (!photoPath || photoPath === 'null' || photoPath === 'undefined') {
      return null;
    }
    
    if (typeof photoPath === 'string' && (photoPath.startsWith('http://') || photoPath.startsWith('https://'))) {
      return photoPath;
    }
    
    if (typeof photoPath === 'string') {
      const cleanPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
      const fullUrl = `${cleanPath}`;
      return fullUrl;
    }
    
    return null;
  };
  
  const getDefaultCompany = () => ({
    name: "Company Ltd",
    industry: "Technology",
    registrationNumber: "0000",
    email: "info@company.com",
    phone: "000-000-0000",
    status: "active"
  });
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getLogoInitials = (companyName) => {
    if (!companyName) return 'C';
    return companyName.charAt(0).toUpperCase();
  };
  
  const getUserInitials = () => {
    if (employeeData) {
      if (employeeData.firstname && employeeData.lastname) {
        return `${employeeData.firstname.charAt(0)}${employeeData.lastname.charAt(0)}`.toUpperCase();
      }
    }
    
    if (userData) {
      if (userData.fullname) {
        const names = userData.fullname.split(' ');
        if (names.length >= 2) {
          return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
        }
        return userData.fullname.charAt(0).toUpperCase();
      }
      
      if (userData.firstname && userData.lastname) {
        return `${userData.firstname.charAt(0)}${userData.lastname.charAt(0)}`.toUpperCase();
      }
      
      if (userData.email) {
        return userData.email.charAt(0).toUpperCase();
      }
    }
    
    return 'U';
  };
  
  const getUserFullName = () => {
    if (employeeData) {
      if (employeeData.firstname && employeeData.lastname) {
        return `${employeeData.firstname} ${employeeData.lastname}`;
      }
    }
    
    if (userData) {
      if (userData.fullname) {
        return userData.fullname;
      }
      
      if (userData.firstname && userData.lastname) {
        return `${userData.firstname} ${userData.lastname}`;
      }
      
      if (userData.email) {
        return userData.email.split('@')[0];
      }
    }
    
    return 'User';
  };
  
  const getUserRole = () => {
    if (userData) {
      if (userData.role) {
        const roleMap = {
          'hr': 'HR Manager',
          'employee': 'Employee',
          'attendancemanager': 'Attendance Manager'
        };
        return roleMap[userData.role] || userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
      }
    }
    
    if (employeeData) {
      if (employeeData.jobTitle) {
        return employeeData.jobTitle;
      }
      
      if (employeeData.role) {
        return employeeData.role.charAt(0).toUpperCase() + employeeData.role.slice(1);
      }
    }
    
    return 'User';
  };
  
  const getProfilePicture = () => {
    if (employeeData && employeeData.photo) {
      return employeeData.photo;
    }
    
    if (userData && userData.photo) {
      return userData.photo;
    }
    
    return null;
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('loginResponse');
    navigate('/login');
  };
  
  const handleMessages = () => {
    if (setActiveSection) {
      setActiveSection('chat');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleNotifications = () => {};
  
  if (loading) {
    return (
      <nav className="employee-navbar">
        <div className="navbar-content">
          <div className="company-info">
            <div className="logo-placeholder"></div>
            <div className="company-details">
              <h3>Loading...</h3>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  const currentCompany = company || getDefaultCompany();
  const logoUrl = getLogoUrl(currentCompany.logo);
  const profilePicPath = getProfilePicture();
  const profilePicUrl = getProfilePicUrl(profilePicPath);
  
  return (
    <nav className="employee-navbar">
      <div className="navbar-content">
        <div className="company-info">
          <div className="logo-container">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${currentCompany.name} logo`}
                className="company-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="logo-fallback"
              style={{ display: !logoUrl ? 'flex' : 'none' }}
            >
              {getLogoInitials(currentCompany.name)}
            </div>
          </div>
          
          <div className="company-text">
            <h2 className="company-name">{currentCompany.name}</h2>
            <div className="employee-badge">
              <Briefcase size={12} />
              <span>Employee Portal</span>
            </div>
          </div>
        </div>
        
        <div className="datetime-section">
          <div className="date-info">
            <Calendar size={16} />
            <span>{formatDate(currentDateTime)}</span>
          </div>
          <div className="time-info">
            <Clock size={16} />
            <span>{formatTime(currentDateTime)}</span>
          </div>
        </div>
        
        <div className="right-section">
          <div className="profile-section">
            <div className="profile-icon">
              {profilePicUrl ? (
                <img 
                  src={profilePicUrl} 
                  alt={getUserFullName()}
                  className="employee-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.innerHTML = `<span class="profile-initials">${getUserInitials()}</span>`;
                    e.target.nextSibling.style.display = 'flex';
                    e.target.nextSibling.classList.add('with-initials');
                  }}
                />
              ) : null}
              <div 
                className="employee-avatar-placeholder"
                style={{ 
                  display: !profilePicUrl || !userData ? 'flex' : 'none',
                  background: userData ? 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)' : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {userData ? (
                  <span className="profile-initials">{getUserInitials()}</span>
                ) : (
                  <User size={20} />
                )}
              </div>
            </div>
            <div className="profile-info">
              <span className="role">{getUserRole()}</span>
              <span className="name">{getUserFullName()}</span>
            </div>
          </div>
          
          <button 
            className="icon-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;