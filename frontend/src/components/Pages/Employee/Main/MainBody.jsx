import React, { useState, useEffect } from 'react';
import { 
  User,
  Clock,
  Calendar,
  MessageCircle,
  IdCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  FileText,
  LogOut,
  HelpCircle,
  Shield,
   Megaphone
} from 'lucide-react';
import './MainBody.css';

import Attendance from './Attendance';
import EmployeeLeave from './Leave';
import Announcements from './Announcements/AnnouncementsEm';
import EmployeeProfile from './Profile';
import EmployeeOrganization from './Organisation';
import Document from './Document';

const MainBody = ({ employeeData, activeSection, setActiveSection }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeComponent, setActiveComponent] = useState('profile');
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    if (activeSection) {
      setActiveComponent(activeSection);
    }
  }, [activeSection]);

  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 1024;
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

  const employeeSidebarLinks = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User className='iconsP' size={20} />,
      color: '#2c9a7a',
      component: <EmployeeProfile employeeData={employeeData} />
    },
    {
      id: 'Attendance',
      label: 'Attendance',
      icon: <Clock className='iconsP' size={20} />,
      color: '#2c9a7a',
      component: <Attendance employeeData={employeeData} />
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: <Calendar className='iconsP' size={20} />,
      color: '#27ae60',
      component: <EmployeeLeave employeeId={employeeData?.id} />
    },
    {
      id: 'chat',
      label: 'Announcements',
      icon: < Megaphone className='iconsP' size={20} />,
      color: '#9b59b6',
      component: <Announcements employeeId={employeeData?.id} />
    },


    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className='iconsP' size={20} />,
      color: '#e67e22',
      component: <Document employeeId={employeeData?.id} />
    },
    
    {
      id: 'organization',
      label: 'Organization',
      icon: <Building2 className='iconsP' size={20} />,
      color: '#27ae60',
      component: <EmployeeOrganization employeeData={employeeData} />
    }
  ];

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLinkClick = (componentId) => {
    setActiveComponent(componentId);
    
    if (setActiveSection) {
      setActiveSection(componentId);
    }
    
    if (isMobileView) {
      setIsSidebarCollapsed(true);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const activeLink = employeeSidebarLinks.find(link => link.id === activeComponent);

  return (
    <div className="main-content-containerP employee-dashboardP">
      <aside className={`sidebar-hrP ${isSidebarCollapsed ? 'collapsedP' : ''} ${isMobileView ? 'mobileP' : ''}`}>
        <div className="sidebar-header-hrP">
          {!isSidebarCollapsed && (
            <div className="sidebar-title-hrP">
              <Shield size={24} />
              <h3>Employee Portal</h3>
            </div>
          )}
          <button 
            className="sidebar-toggle-hrP"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav-hrP">
          <div className="sidebar-section-hrP">
            <h4 className="section-title-hrP">Main Menu</h4>
            <ul className="sidebar-links-hrP">
              {employeeSidebarLinks.slice(0, 4).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hrP ${activeComponent === link.id ? 'activeP' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                  >
                    <span className="link-icon-hrP" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hrP">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-section-hrP">
            <h4 className="section-title-hrP">Resources</h4>
            <ul className="sidebar-links-hrP">
              {employeeSidebarLinks.slice(4, 8).map((link) => (
                <li key={link.id}>
                  <button
                    className={`sidebar-link-hrP ${activeComponent === link.id ? 'activeP' : ''}`}
                    onClick={() => handleLinkClick(link.id)}
                    title={isSidebarCollapsed ? link.label : ''}
                  >
                    <span className="link-icon-hrP" style={{ color: link.color }}>
                      {link.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="link-label-hrP">{link.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

      </aside>

      <main className="content-area-hrP">
        <div className="content-header-hrP">
          <div className="content-title-section-hrP">
            {isMobileView && (
              <button 
                className="mobile-toggle-btnP"
                onClick={toggleSidebar}
              >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            )}
            <h1 className="content-title-hrP">
              {activeLink?.label || 'Employee Portal'}
            </h1>
          </div>
          
          <div className="content-actions-hrP">
            
          </div>
        </div>

        <div className="content-body-hrP">
          <div className="component-wrapper-hrP">
            {activeLink?.component || (
              <div className="default-content-hrP">
                <div className="welcome-card-hrP">
                  <div className="welcome-iconP">
                    <User size={32} />
                  </div>
                  <h2>Employee Portal</h2>
                  <p>
                    Select a module from the sidebar to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainBody;