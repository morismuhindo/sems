import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import ProtectedRoute from "./components/Security/ProtectedRoute";
import Footer from "./components/Footer/Footer";
import ServerStatusIndicator from "./components/ServerStatus/ServerStatusIndicator";
import { ServerStatusProvider, useServerStatus } from "./components/ServerStatus/ServerStatusContext";

// Pages (imports remain the same)
import Login from "./components/Pages/Auth/Login";
import RegisterHr from "./components/Pages/Auth/RegisterHr";
import HrDashboard from "./components/Pages/Hr/HrDashboard";
import EmployeeDashboard from "./components/Pages/Employee/EmployeeDashboard";
import Attendance from "./components/Pages/Attendance/Attendance";
import HodDashboard from "./components/Pages/Hod/HodDashboard";
import ForgotPassword from "./components/Pages/Auth/ForgotPassword";
import ResetPassword from "./components/Pages/Auth/ResetPassword";
import PrivacyPolicy from "./components/Security/PrivancyPolicy";
import TermsAndConditions from "./components/Security/TermsAndConditions";
import SEMSContactForm from "./components/Security/SEMSContactForm";

/* Navbar and Footer only on auth pages */
const Layout = ({ children }) => {
  const location = useLocation();
  const showAuthLayout =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password/:token";

  return (
    <>
      {showAuthLayout && <Navbar />}
      {children}
      {showAuthLayout && <Footer />}
    </>
  );
};

// Create a wrapper component that uses the server status
const AppContent = () => {
  const { isServerDown, isChecking, checkServerHealth } = useServerStatus();

  return (
    <BrowserRouter>
      <ServerStatusIndicator 
        isServerDown={isServerDown}
        isChecking={isChecking}
        onRetry={checkServerHealth}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterHr />} />
          
          {/* Add these new routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Dashboards */}
          <Route
            path="/dashboard/hr"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HrDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/employee"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/attendance"
            element={
              <ProtectedRoute allowedRoles={["attendancemanager"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/hod"
            element={
              <ProtectedRoute allowedRoles={["hod"]}>
                <HodDashboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/privacy"
            element={<PrivacyPolicy />}
          />

          <Route 
            path="/terms"
            element={<TermsAndConditions />}
          />

          <Route 
            path="/contact"
            element={<SEMSContactForm />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <ServerStatusProvider>
      <AppContent />
    </ServerStatusProvider>
  );
};

export default App;