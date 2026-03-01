import React, { useState } from "react";
import MainBody from "./Main/MainBody";
import Navbar from "./Navbar/Navbar";

const EmployeeDashboard = () => {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div>
      <Navbar setActiveSection={setActiveSection} />
      <MainBody 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
    </div>
  );
};

export default EmployeeDashboard;