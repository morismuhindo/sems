import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Users, User, Calendar, 
  Briefcase, Shield, Search, Filter, X, AlertCircle,
  RefreshCw
} from "lucide-react";
import "./EmployeeHod.css";

const EmployeesHod = () => {
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedEmployment, setSelectedEmployment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const [departments, setDepartments] = useState(["all"]);
  const [employmentTypes, setEmploymentTypes] = useState(["all", "full-time", "part-time", "contract", "intern", "permanent"]);
  const [statuses, setStatuses] = useState(["all", "active", "inactive", "on-leave", "terminated"]);

  useEffect(() => {
    const checkAuthorization = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);

        if (!parsedUser.role || parsedUser.role.toLowerCase() !== 'hod') {
          navigate('/unauthorized');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        navigate('/login');
      }
    };

    checkAuthorization();
  }, [navigate]);

  useEffect(() => {
    if (authorized) {
      fetchHodData();
      fetchEmployees();
    }
  }, [authorized]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchHodData = async () => {
    try {
      const response = await axios.get(
        '/api/me',
        getAuthHeaders()
      );

      if (response.data && response.data.success) {
        const user = response.data.data;
        
        if (user.employee) {
          setEmployeeData(user.employee);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const fetchEmployees = async () => {
  try {
    setLoading(true);
    setError("");
    
    const response = await axios.get(
      '/api/employees/my-department',
      getAuthHeaders()
    );

    let employeeList = [];
    
    if (response.data.success) {
      if (response.data.employees && Array.isArray(response.data.employees)) {
        employeeList = response.data.employees;
      } 
      else if (response.data.data && Array.isArray(response.data.data)) {
        employeeList = response.data.data;
      }
    } 
    else if (Array.isArray(response.data)) {
      employeeList = response.data;
    }
    else if (response.data.employees && Array.isArray(response.data.employees)) {
      employeeList = response.data.employees;
    }
    
    if (employeeList.length === 0 && response.data.hodInfo) {
      const hodEmployee = {
        _id: response.data.hodInfo.id,
        firstname: response.data.hodInfo.name?.split(' ')[0] || 'HOD',
        lastname: response.data.hodInfo.name?.split(' ')[1] || '',
        email: response.data.hodInfo.email,
        employeeCode: response.data.hodInfo.employeeCode,
        role: 'hod',
        photo: response.data.hodInfo.photo,
        department: response.data.department,
        status: 'active',
        employmentType: 'full-time',
        jobTitle: 'Head of Department'
      };
      employeeList = [hodEmployee];
    }
    
    setEmployees(employeeList);
    setFilteredEmployees(employeeList);
    
    const uniqueEmpTypes = ["all"];
    employeeList.forEach(emp => {
      if (emp.employmentType && !uniqueEmpTypes.includes(emp.employmentType)) {
        uniqueEmpTypes.push(emp.employmentType);
      }
    });
    setEmploymentTypes(uniqueEmpTypes);
    
    const uniqueStatuses = ["all"];
    employeeList.forEach(emp => {
      if (emp.status && !uniqueStatuses.includes(emp.status)) {
        uniqueStatuses.push(emp.status);
      }
    });
    setStatuses(uniqueStatuses);
    
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate('/login');
    } else if (err.response?.status === 403) {
      setError("You don't have permission to view employees. Only HOD can access.");
    } else if (err.response?.status === 404) {
      try {
        const fallbackResponse = await axios.get(
          '/api/employees/allEmployees',
          getAuthHeaders()
        );
        
        let allEmployees = [];
        if (fallbackResponse.data.success && Array.isArray(fallbackResponse.data.employees)) {
          allEmployees = fallbackResponse.data.employees;
        } else if (Array.isArray(fallbackResponse.data)) {
          allEmployees = fallbackResponse.data;
        }
        
        const hodDeptInfo = response?.data?.department || employeeData?.department;
        const hodDeptId = hodDeptInfo?.id || hodDeptInfo?._id || hodDeptInfo;
        
        const departmentEmployees = allEmployees.filter(emp => {
          if (!emp.department) return false;
          
          if (typeof emp.department === 'object') {
            return emp.department._id === hodDeptId || emp.department.id === hodDeptId;
          }
          return emp.department === hodDeptId;
        });
        
        if (!departmentEmployees.some(emp => emp._id === employeeData?._id || emp.email === employeeData?.email)) {
          const hodEmployee = {
            ...employeeData,
            role: 'hod',
            jobTitle: employeeData?.jobTitle || 'Head of Department',
            status: employeeData?.status || 'active',
            employmentType: employeeData?.employmentType || 'full-time'
          };
          departmentEmployees.unshift(hodEmployee);
        }
        
        setEmployees(departmentEmployees);
        setFilteredEmployees(departmentEmployees);
        
        const uniqueEmpTypes = ["all"];
        departmentEmployees.forEach(emp => {
          if (emp.employmentType && !uniqueEmpTypes.includes(emp.employmentType)) {
            uniqueEmpTypes.push(emp.employmentType);
          }
        });
        setEmploymentTypes(uniqueEmpTypes);
        
        const uniqueStatuses = ["all"];
        departmentEmployees.forEach(emp => {
          if (emp.status && !uniqueStatuses.includes(emp.status)) {
            uniqueStatuses.push(emp.status);
          }
        });
        setStatuses(uniqueStatuses);
        
      } catch (fallbackErr) {
        if (employeeData) {
          const hodEmployee = {
            ...employeeData,
            role: 'hod',
            jobTitle: employeeData.jobTitle || 'Head of Department',
            status: employeeData.status || 'active',
            employmentType: employeeData.employmentType || 'full-time',
            department: hodDeptInfo
          };
          setEmployees([hodEmployee]);
          setFilteredEmployees([hodEmployee]);
        } else {
          setError("Unable to load employees. Please contact HR to add employees to your department.");
        }
      }
    } else {
      setError("Failed to load employees. " + (err.response?.data?.message || ""));
    }
    
  } finally {
    setLoading(false);
  }
};

  const getImageUrl = (photo) => {
    if (!photo) return null;
    
    if (typeof photo === 'string') {
      if (photo.startsWith('http')) {
        return photo;
      }
      return `${photo}`;
    }
    
    if (photo.url) {
      return photo.url.startsWith('http') ? photo.url : `${photo.url}`;
    }
    
    if (photo.path) {
      return `${photo.path}`;
    }
    
    return null;
  };

  useEffect(() => {
    let results = employees;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(emp => {
        const empDeptName = emp.department?.name || '';
          
        return (
          emp.firstname?.toLowerCase().includes(term) ||
          emp.lastname?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          emp.employeeCode?.toLowerCase().includes(term) ||
          emp.jobTitle?.toLowerCase().includes(term) ||
          empDeptName.toLowerCase().includes(term)
        );
      });
    }

    if (selectedEmployment !== "all") {
      results = results.filter(emp => 
        emp.employmentType?.toLowerCase() === selectedEmployment.toLowerCase()
      );
    }

    if (selectedStatus !== "all") {
      results = results.filter(emp => 
        emp.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    setFilteredEmployees(results);
  }, [employees, searchTerm, selectedEmployment, selectedStatus]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedEmployment("all");
    setSelectedStatus("all");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return "Invalid Date";
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'on-leave': 
      case 'onleave': return 'status-on-leave';
      case 'terminated': return 'status-terminated';
      default: return 'status-default';
    }
  };

  const getEmploymentTypeBadge = (type) => {
    if (!type) return 'employment-other';
    
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'full-time': 
      case 'fulltime': return 'employment-fulltime';
      case 'part-time': 
      case 'parttime': return 'employment-parttime';
      case 'contract': return 'employment-contract';
      case 'intern': return 'employment-intern';
      case 'permanent': return 'employment-permanent';
      default: return 'employment-other';
    }
  };

  const getDepartmentName = (department) => {
    if (!department) return "N/A";
    if (typeof department === 'string') return department;
    return department.name || "N/A";
  };

  const getDepartmentCode = (department) => {
    if (!department) return "";
    if (typeof department === 'string') return "";
    return department.code || "";
  };

  const getHodDepartmentInfo = () => {
    if (!employeeData) return { name: "", code: "", id: "" };
    
    if (employeeData.department) {
      if (typeof employeeData.department === 'object') {
        return {
          name: employeeData.department.name || "",
          code: employeeData.department.code || "",
          id: employeeData.department._id || ""
        };
      }
      return {
        name: employeeData.department || "",
        code: "",
        id: employeeData.department
      };
    }
    return { name: "", code: "", id: "" };
  };

  const getHodFullName = () => {
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
    
    return 'HOD User';
  };

  if (!authorized) {
    return (
      <div className="loading-container">
        <RefreshCw className="spinner" size={48} />
        <h2>Checking permissions...</h2>
      </div>
    );
  }

  if (loading && !employees.length) {
    return (
      <div className="loading-container">
        <RefreshCw className="spinner" size={48} />
        <h2>Loading HOD Dashboard...</h2>
      </div>
    );
  }

  const hodDeptInfo = getHodDepartmentInfo();

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <Users size={32} /> Employee Management
          </h1>
          {hodDeptInfo.name && (
            <div className="hod-department-badge">
              <Briefcase size={16} />
              {hodDeptInfo.name} Department
              {hodDeptInfo.code && ` (${hodDeptInfo.code})`}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-container">
          <AlertCircle size={20} />
          <p>{error}</p>
          <button onClick={() => setError('')} className="close-error">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="filter-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search employees by name, email, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="clear-search-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {(selectedDepartment !== "all" || selectedEmployment !== "all" || selectedStatus !== "all") && (
            <span className="active-filter-count">3</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={16} />
              Employment Type
            </label>
            <select
              value={selectedEmployment}
              onChange={(e) => setSelectedEmployment(e.target.value)}
              className="filter-select"
            >
              {employmentTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">
              <Shield size={16} />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === "all" ? "All Status" : status.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={clearFilters}
            className="clear-filters-btn"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      )}

      <div className="results-summary">
        <span className="results-count">
          Showing {filteredEmployees.length} of {employees.length} employees
          {hodDeptInfo.name && ` in ${hodDeptInfo.name} Department`}
        </span>
        {(selectedDepartment !== "all" || selectedEmployment !== "all" || selectedStatus !== "all") && (
          <span className="active-filters">
            <Filter size={14} />
            Filters active: 
            {selectedDepartment !== "all" && ` ${selectedDepartment}`}
            {selectedEmployment !== "all" && ` • ${selectedEmployment}`}
            {selectedStatus !== "all" && ` • ${selectedStatus}`}
          </span>
        )}
      </div>

      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Employment</th>
              <th>Hire Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr className="no-results-row">
                <td colSpan="10" className="no-results-cell">
                  <div className="no-results-content">
                    <Search size={48} />
                    <h3>No employees found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button 
                      onClick={clearFilters}
                      className="reset-filters-btn"
                    >
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const imageUrl = getImageUrl(emp.photo);
                const departmentName = getDepartmentName(emp.department);
                const departmentCode = getDepartmentCode(emp.department);
                
                return (
                  <tr key={emp.id || emp._id}>
                    <td className="employee-photo">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={`${emp.firstname} ${emp.lastname}`} 
                          className="employee-avatar"
                        />
                      ) : (
                        <div className="employee-avatar-placeholder">
                          <User size={20} />
                        </div>
                      )}
                    </td>
                    <td className="employee-code">{emp.employeeCode}</td>
                    <td className="employee-name">
                      <div className="name-wrapper">
                        <div className="name">{emp.firstname} {emp.lastname}</div>
                        <div className="role-badge">
                          <Shield size={12} /> {emp.role || 'employee'}
                        </div>
                      </div>
                    </td>
                    <td className="employee-email">{emp.email || 'N/A'}</td>
                    <td className="job-title">
                      <div className="job-title-content">
                        <Briefcase size={14} />
                        <span>{emp.jobTitle || "Not specified"}</span>
                      </div>
                    </td>
                    <td className="department">
                      {emp.department ? (
                        <div className="department-info">
                          <div className="dept-name">{departmentName}</div>
                          {departmentCode && <div className="dept-code">{departmentCode}</div>}
                        </div>
                      ) : "N/A"}
                    </td>
                    <td>
                      <span className={`employment-badge ${getEmploymentTypeBadge(emp.employmentType)}`}>
                        {emp.employmentType || "N/A"}
                      </span>
                    </td>
                    <td className="hire-date">
                      <div className="hire-date-content">
                        <Calendar size={14} />
                        <span>{formatDate(emp.hireDate)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(emp.status)}`}>
                        {emp.status || "unknown"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesHod;