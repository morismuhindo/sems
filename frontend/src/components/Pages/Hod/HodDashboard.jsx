// Update this component - HodDashboard.jsx
import React, { useState } from "react";
import Navbar from "./Navbar/Navbar";
import MainBody from "./MainHod/MainBody";

const HodDashboard = () => {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div>
      {/* Pass setActiveSection to Navbar */}
      <Navbar setActiveSection={setActiveSection} />
      
      {/* Pass both activeSection and setActiveSection to MainBody */}
      <MainBody 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
    </div>
  );
};

export default HodDashboard;
