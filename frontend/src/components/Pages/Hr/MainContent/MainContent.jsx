import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  Clock,
  MessageCircle,
  Bell,
  Building2,
  Award,
  UserCheck,
  UserX,
  IdCard,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  Search,
  Download,
  Plus,
  Filter,
  BarChart3,
  Menu,
  Megaphone
} from 'lucide-react';
import './MainContent.css';

import Dashboard from '../DashboardComponents/Main/Dashboard';
import Employees from '../DashboardComponents/Employee/Employees';
import Attendance from '../DashboardComponents/Attendance/AttendanceDashboard';
import Leave from '../DashboardComponents/Leave/Leave';
import Documents from '../DashboardComponents/Documents/Documents';
import Announcements from '../DashboardComponents/Announcements/Announcements';
import Notifications from '../DashboardComponents/Notifications/Notifications';
import Departments from '../DashboardComponents/Departments/Departments';
import User from '../DashboardComponents/Users/Users';
import EmployeeIDCards from '../DashboardComponents/EmployeeIDCards/EmployeeIDCards';
import AuditLogs from '../DashboardComponents/AuditLogs/AuditLogs';
import Organisation from '../DashboardComponents/Organisation/Organisation';

// Main content area component for HR dashboard
const MainContent = ({ companyData, activeSection, setActiveSection }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeComponent, setActiveComponent] = useState(activeSection || 'dashboard');
  const [isMobileView, setIsMobileView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentBodyRef = useRef(null);
  const prevActiveSectionRef = useRef(activeSection || 'dashboard');

  // Sync activeSection prop with local state
  useEffect(() => {
    if (activeSection && activeSection !== prevActiveSectionRef.current) {
      setIsTransitioning(true);
      
      prevActiveSectionRef.current = activeSection;
      
      setTimeout(() => {
        setActiveComponent(activeSection);
        
        if (contentBodyRef.current) {
          contentBodyRef.current.classList.add('content-transition');
          setTimeout(() => {
            if (contentBodyRef.current) {
              contentBodyRef.current.classList.remove('content-transition');
            }
          }, 300);
        }
        
        setTimeout(() => setIsTransitioning(false), 300);
      }, 10);
    }
  }, [activeSection]);

  // Check for mobile view and set initial state
  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 900;
      setIsMobileView(mobile);
      
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Initial sync on component mount
  useEffect(() => {
    if (activeSection && activeSection !== activeComponent) {
      setActiveComponent(activeSection);
      prevActiveSectionRef.current = activeSection;
    }
  }, []);

  // Sidebar navigation links
  const sidebarLinks = [
    {
      id: 'dashboard',
      label: 'Statistics',
      icon: <BarChart3 className='icons' size={20} />,
      color: '#2c5aa0',
      component: <Dashboard />
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: <Users className='icons' size={20} />,
      color: '#2c9a7a',
      component: <Employees />
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <Clock className='icons' size={20} />,
      color: '#4a6fa5',
      component: <Attendance />
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: <Calendar className='icons' size={20} />,
      color: '#27ae60',
      component: <Leave />
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className='icons' size={20} />,
      color: '#e67e22',
      component: <Documents />
    },
    {
      id: 'chat',
      label: 'Announcements',
      icon: <Megaphone className='icons' size={20} />,
      color: '#9b59b6',
      component: <Announcements />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className='icons' size={20} />,
      color: '#1abc9c',
      component: <Notifications />
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: <Building2 className='icons' size={20} />,
      color: '#e74c3c',
      component: <Departments />
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <UserCheck className='icons' size={20} />,
      color: '#2c5aa0',
      component: <User />
    },
    {
      id: 'idcards',
      label: 'Employee ID Cards',
      icon: <IdCard className='icons' size={20} />,
      color: '#2c9a7a',
      component: <EmployeeIDCards />
    },
    {
      id: 'auditlogs',
      label: 'Audit Logs',
      icon: <ClipboardList className='icons' size={20} />,
      color: '#4a6fa5',
      component: <AuditLogs />
    },
    {
      id: 'organisation',
      label: 'Organisation',
      icon: <Shield className='icons' size={20} />,
      color: '#27ae60',
      component: <Organisation companyData={companyData} />
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Handle sidebar link click
  const handleLinkClick = (componentId) => {
    if (isTransitioning) {
      return;
    }
    
    setIsTransitioning(true);
    
    setActiveComponent(componentId);
    
    if (setActiveSection) {
      setActiveSection(componentId);
    }
    
    if (isMobileView) {
      setIsSidebarCollapsed(true);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeLink = sidebarLinks.find(link => link.id === activeComponent);

  return (
    <div className="main-content-container">
      {/* Collapsible sidebar */}
      <aside className={`sidebar-hr ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileView ? 'mobile' : ''}`}>
        <div className="sidebar-header-hr">
          {!isSidebarCollapsed && (
            <div className="sidebar-title-hr">
              <Shield size={24} />
              <h3>HR Management</h3>
            </div>
          )}
          <button 
            className="sidebar-toggle-hr"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            disabled={isTransitioning}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav-hr">
          <div className="sidebar-section-hr">
            <h4 className="section-title-hr">Core HR</h4>
            <ul className="sidebar-links-hr">
              {sidebarLinks.slice(0, 4).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hr ${activeComponent === link.id ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                    disabled={isTransitioning}
                  >
                    <span className="link-icon-hr" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hr">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section-hr">
            <h4 className="section-title-hr">Documents & Comms</h4>
            <ul className="sidebar-links-hr">
              {sidebarLinks.slice(4, 7).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hr ${activeComponent === link.id ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                    disabled={isTransitioning}
                  >
                    <span className="link-icon-hr" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hr">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section-hr">
            <h4 className="section-title-hr">Employee Management</h4>
            <ul className="sidebar-links-hr">
              {sidebarLinks.slice(7, 13).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hr ${activeComponent === link.id ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                    disabled={isTransitioning}
                  >
                    <span className="link-icon-hr" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hr">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section-hr">
            <ul className="sidebar-links-hr">
              {sidebarLinks.slice(13).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hr ${activeComponent === link.id ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                    disabled={isTransitioning}
                  >
                    <span className="link-icon-hr" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hr">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main content area */}
      <main className={`content-area-hr ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="content-header-hr">
          <div className="content-title-section-hr">
            {isMobileView && (
              <button 
                className="mobile-toggle-btn"
                onClick={toggleSidebar}
                aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
                disabled={isTransitioning}
              >
                <Menu size={20} />
              </button>
            )}
            
          </div>
        </div>

        <div 
          className="content-body-hr" 
          ref={contentBodyRef}
          key={activeComponent}
        >
          {activeLink?.component || (
            <div className="default-content-hr">
              <div className="welcome-card-hr">
                <h2>Welcome to HR Management System</h2>
                <p>Select a module from the sidebar to manage your HR operations.</p>
                <div className="quick-stats-hr">
                  <div className="quick-stat-item-hr">
                    <Users size={24} />
                    <span>Manage Employees</span>
                  </div>
                  <div className="quick-stat-item-hr">
                    <Clock size={24} />
                    <span>Track Attendance</span>
                  </div>
                  <div className="quick-stat-item-hr">
                    <Calendar size={24} />
                    <span>Process Leave</span>
                  </div>
                  <div className="quick-stat-item-hr">
                    <FileText size={24} />
                    <span>Handle Documents</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MainContent;