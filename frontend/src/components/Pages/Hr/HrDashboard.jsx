import HRNavbar from "./HRNavbar/HRNavbar";
import MainContent from "./MainContent/MainContent";
import { useState } from "react";

// Main HR dashboard component
const HrDashboard = ({ companyData }) => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="hr-dashboard">
      {/* Navigation sidebar */}
      <HRNavbar 
        companyData={companyData} 
        setActiveSection={setActiveSection} 
      />
      {/* Main content area */}
      <MainContent 
        companyData={companyData}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
    </div>
  );
};

export default HrDashboard;