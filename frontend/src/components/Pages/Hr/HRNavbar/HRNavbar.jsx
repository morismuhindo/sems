import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  Calendar, 
  Clock, 
  Megaphone, 
  Bell, 
  LogOut, 
  Circle,
  IdCard,
  User,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import './HRNavbar.css';

const HRNavbar = ({ companyData, onLogout, setActiveSection }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [company, setCompany] = useState(null);
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  
  useEffect(() => {
    fetchCompanyData();
    fetchUserData();
    loadUnreadCounts();
    
    const messagesInterval = setInterval(() => {
      checkUnreadMessages();
    }, 3000);
    
    const notificationsInterval = setInterval(() => {
      checkUnreadNotifications();
    }, 2000);
    
    return () => {
      clearInterval(messagesInterval);
      clearInterval(notificationsInterval);
    };
  }, []);
  
  const loadUnreadCounts = () => {
    try {
      const savedMessages = localStorage.getItem('hr_unread_messages');
      if (savedMessages) setUnreadMessages(parseInt(savedMessages));
      
      const notificationStates = localStorage.getItem('notificationReadStates');
      if (notificationStates) {
        const states = JSON.parse(notificationStates);
        const unreadCount = Object.values(states).filter(state => !state).length;
        setUnreadNotifications(unreadCount);
      }
      
      const savedCount = localStorage.getItem('hr_unread_notifications_count');
      if (savedCount) {
        const count = parseInt(savedCount);
        if (count > unreadNotifications) {
          setUnreadNotifications(count);
        }
      }
    } catch (error) {
    }
  };
  
  const checkUnreadMessages = () => {
    try {
      const savedMessages = localStorage.getItem('hr_unread_messages');
      if (savedMessages && parseInt(savedMessages) !== unreadMessages) {
        setUnreadMessages(parseInt(savedMessages));
      }
    } catch (error) {
    }
  };
  
  const checkUnreadNotifications = useCallback(() => {
    try {
      const notificationStates = localStorage.getItem('notificationReadStates');
      let countFromStates = 0;
      
      if (notificationStates) {
        const states = JSON.parse(notificationStates);
        countFromStates = Object.values(states).filter(state => !state).length;
      }
      
      const savedCount = localStorage.getItem('hr_unread_notifications_count');
      const countFromStorage = savedCount ? parseInt(savedCount) : 0;
      
      const newCount = Math.max(countFromStates, countFromStorage);
      
      if (newCount !== unreadNotifications) {
        setUnreadNotifications(newCount);
        
        if (newCount > countFromStorage) {
          localStorage.setItem('hr_unread_notifications_count', newCount.toString());
        }
      }
    } catch (error) {
    }
  }, [unreadNotifications]);
  
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'notificationReadStates' || 
          event.key === 'hr_unread_notifications_count') {
        checkUnreadNotifications();
      }
      
      if (event.key === 'hr_unread_messages') {
        checkUnreadMessages();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkUnreadNotifications]);
  
  useEffect(() => {
    const handleNotificationUpdate = (event) => {
      if (event.detail && typeof event.detail.count !== 'undefined') {
        const newCount = event.detail.count;
        if (newCount !== unreadNotifications) {
          setUnreadNotifications(newCount);
          localStorage.setItem('hr_unread_notifications_count', newCount.toString());
        }
      }
    };
    
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [unreadNotifications]);
  
  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (companyData) {
        setCompany(companyData);
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
      
      const currentCompany = orgsArray.length > 0 ? orgsArray[0] : null;
      setCompany(currentCompany);
    } catch (err) {
      setCompany(null);
    }
  };
  
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
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
        const meResponse = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (meResponse.data && meResponse.data.success) {
          const user = meResponse.data.data;
          setUserData(user);
          setEmployeeData(user.employee || null);
          localStorage.setItem('userData', JSON.stringify(user));
          setLoading(false);
          return;
        }
      } else {
        const response = await axios.get(`/api/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.success) {
          const user = response.data.data;
          setUserData(user);
          setEmployeeData(user.employee || null);
          localStorage.setItem('userData', JSON.stringify(user));
        } else if (response.data) {
          setUserData(response.data);
          setEmployeeData(response.data.employee || null);
          localStorage.setItem('userData', JSON.stringify(response.data));
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
          setEmployeeData(user.employee || null);
          localStorage.setItem('userData', JSON.stringify(user));
        }
      } catch (meErr) {}
    } finally {
      setLoading(false);
    }
  };
  
  //Get profile picture from userData or employeeData
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
  
  // Get the actual profile picture to display
  const getProfilePicture = () => {
    // First try employee photo if available
    if (employeeData && employeeData.photo) {
      return employeeData.photo;
    }
    
    // Then try user photo
    if (userData && userData.photo) {
      return userData.photo;
    }
    
    return null;
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
    
    return 'HR Manager';
  };
  
  //Get user's personal email
  const getUserEmail = () => {
    if (userData && userData.email) {
      return userData.email;
    }
    
    // Don't fall back to company email - show placeholder instead
    return 'Email not available';
  };
  
  //Get user's personal phone number
  const getUserPhone = () => {
    if (employeeData && employeeData.phone) {
      return employeeData.phone;
    }
    
    if (userData && userData.phone) {
      return userData.phone;
    }
    
    // Don't fall back to company phone - show placeholder instead
    return 'Phone not available';
  };
  
  //Get user's role
  const getUserRole = () => {
    if (userData && userData.role) {
      const roleMap = {
        'hr': 'HR Manager',
        'employee': 'Employee',
        'attendancemanager': 'Attendance Manager'
      };
      return roleMap[userData.role] || userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    }
    
    if (employeeData) {
      if (employeeData.jobTitle) {
        return employeeData.jobTitle;
      }
      
      if (employeeData.role) {
        return employeeData.role.charAt(0).toUpperCase() + employeeData.role.slice(1);
      }
    }
    
    return 'HR Manager';
  };
  
  const getLogoUrl = (logo) => {
    if (!logo || logo === 'undefined' || logo === 'null') {
      return null;
    }
    
    if (typeof logo === 'string' && (logo.startsWith('http://') || logo.startsWith('https://'))) {
      return logo;
    }
    
    if (typeof logo === 'string' && (logo.startsWith('/') || logo.startsWith('uploads/'))) {
      const path = logo.startsWith('/') ? logo : `/${logo}`;
      return `${path}`;
    }
    
    if (logo && typeof logo === 'object') {
      if (logo.url) {
        const url = logo.url;
        return url.startsWith('http') ? url : `${url}`;
      }
      if (logo.path) {
        return `${logo.path}`;
      }
    }
    
    return null;
  };
  
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
    if (!companyName) return 'HR';
    const words = companyName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };
  
  const getLogoColor = () => {
    return '#2c5aa0';
  };
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('loginResponse');
    sessionStorage.removeItem('authToken');
    
    navigate('/');
  };
  
  const handleNotifications = (e) => {
    if (e) e.stopPropagation();
    
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    localStorage.setItem('hr_unread_notifications_count', '0');
    
    try {
      const notificationStates = localStorage.getItem('notificationReadStates');
      if (notificationStates) {
        const states = JSON.parse(notificationStates);
        const updatedStates = {};
        Object.keys(states).forEach(key => {
          updatedStates[key] = true;
        });
        localStorage.setItem('notificationReadStates', JSON.stringify(updatedStates));
      }
    } catch (error) {
    }
    
    setUnreadNotifications(0);
    
    window.dispatchEvent(new CustomEvent('notificationRead', {
      detail: { timestamp: new Date().toISOString() }
    }));
    
    if (setActiveSection) {
      const notificationBtn = document.querySelector('.notification-icon-hr');
      if (notificationBtn) {
        notificationBtn.classList.add('clicked');
        setTimeout(() => notificationBtn.classList.remove('clicked'), 300);
      }
      
      setActiveSection('notifications');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const handleChat = (e) => {
    if (e) e.stopPropagation();
    
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (setActiveSection) {
      const chatBtn = document.querySelector('.chat-icon-hr');
      if (chatBtn) {
        chatBtn.classList.add('clicked');
        setTimeout(() => chatBtn.classList.remove('clicked'), 300);
      }
      
      setActiveSection('chat');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  if (loading) {
    return (
      <nav className="hr-navbar">
        <div className="company-info-section-hr">
          <div className="company-logo-hr">
            <div 
              className="logo-circle-hr"
              style={{ 
                background: `linear-gradient(135deg, #2c5aa0 0%, #2c5aa080 100%)` 
              }}
            >
              <span className="logo-text-hr">...</span>
            </div>
          </div>
          
          <div className="company-details-hr">
            <div className="company-header-hr">
              <h2 className="company-name-hr">Loading...</h2>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  const currentCompany = company;
  const logoUrl = currentCompany ? getLogoUrl(currentCompany.logo) : null;
  const profilePicPath = getProfilePicture();
  const profilePicUrl = getProfilePicUrl(profilePicPath);
  const userRole = getUserRole();
  
  return (
    <nav className="hr-navbar">
      <div className="company-info-section-hr">
        <div className="company-logo-hr">
          <div 
            className="logo-circle-hr"
            style={{ 
              background: logoUrl ? 'transparent' : `linear-gradient(135deg, ${getLogoColor()} 0%, ${getLogoColor()}80 100%)` 
            }}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${currentCompany?.name || 'Company'} Logo`}
                className="logo-image-hr"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="logo-text-hr">${getLogoInitials(currentCompany?.name || 'HR')}</span>`;
                  e.target.parentElement.style.background = `linear-gradient(135deg, ${getLogoColor()} 0%, ${getLogoColor()}80 100%)`;
                }}
              />
            ) : (
              <span className="logo-text-hr">{getLogoInitials(currentCompany?.name || 'HR')}</span>
            )}
          </div>
        </div>
        
        <div className="company-details-hr">
          <div className="company-header-hr">
            <h2 className="company-name-hr">{currentCompany ? currentCompany.name : 'HR Dashboard'}</h2>
            <div className="hr-role-badge-hr">
              <Briefcase size={14} />
              <span>HR Dashboard</span>
            </div>
          </div>
          {currentCompany && (
            <div className="company-meta-line-hr">
              <div className="industry-info-hr">
                <Building2 size={14} />
                <span className="industry-text-hr">{currentCompany.industry || 'Industry not specified'}</span>
              </div>
              {currentCompany.registrationNumber && (
                <div className="registration-info-hr">
                  <IdCard size={14} />
                  <span className="registration-text-hr">Reg: {currentCompany.registrationNumber}</span>
                </div>
              )}
              {currentCompany.status && (
                <div className={`status-info-hr ${currentCompany.status}`}>
                  <Circle size={10} />
                  <span className="status-text-hr">{currentCompany.status}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="navbar-right-section-hr">
        <div className="datetime-container-hr">
          <div className="date-display-hr">
            <Calendar size={16} />
            <span className="date-text-hr">{formatDate(currentDateTime)}</span>
          </div>
          <div className="time-display-hr">
            <Clock size={16} />
            <span className="time-text-hr">{formatTime(currentDateTime)}</span>
          </div>
        </div>
        
        <div className="navbar-icons-hr">
          <button 
            className={`nav-icon-hr chat-icon-hr ${isAnimating ? 'animating' : ''}`}
            onClick={handleChat}
            title="Announcements"
            aria-label="Open Chat"
            disabled={isAnimating}
          >
            <Megaphone size={20} />
            {unreadMessages > 0 && (
              <span className="icon-badge-hr message-badge">{unreadMessages}</span>
            )}
          </button>
          
          <button 
            className={`nav-icon-hr notification-icon-hr ${isAnimating ? 'animating' : ''} ${unreadNotifications > 0 ? 'has-notifications' : ''}`}
            onClick={handleNotifications}
            title={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
            aria-label={`View Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
            disabled={isAnimating}
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="icon-badge-hr notification-badge">{unreadNotifications}</span>
            )}
          </button>
          
          <button 
            className="nav-icon-hr logout-icon-hr" 
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
          
          <div className="user-profile-hr">
            <div className="user-avatar-hr">
              {profilePicUrl ? (
                <img 
                  src={profilePicUrl} 
                  alt={getUserFullName()}
                  className="hr-user-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('with-initials');
                    e.target.parentElement.innerHTML = `<span class="profile-initials-hr">${getUserInitials()}</span>`;
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #2c5aa0 0%, #0ea5e9 100%)';
                  }}
                />
              ) : (
                <div 
                  className="profile-initials-container-hr"
                  style={{ 
                    background: 'linear-gradient(135deg, #2c5aa0 0%, #0ea5e9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <span 
                    className="profile-initials-hr"
                    style={{
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    {getUserInitials()}
                  </span>
                </div>
              )}
            </div>
            <div className="user-info-hr">
              <div className="user-role-hr">
                <Briefcase size={12} />
                <span>{userRole}</span>
              </div>
              <span className="user-name-hr">{getUserFullName()}</span>
              <div className="user-contact-hr">
                {getUserEmail() && getUserEmail() !== 'Email not available' && (
                  <div className="user-email-hr">
                  <span>{getUserEmail()}</span>
                  </div>
                )}
                {getUserPhone() && getUserPhone() !== 'Phone not available' && (
                  <div className="user-phone-hr">
                    <Phone size={10} />
                    <span>{getUserPhone()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HRNavbar;