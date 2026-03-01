import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Users, Edit, Trash2, PlusCircle, User, Calendar, 
  Briefcase, Shield, Search, Filter, X, AlertCircle
} from "lucide-react";
import EmployeeModal from "./EmployeeModal";
import "./Employee.css";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedEmployment, setSelectedEmployment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const departments = ["all", ...new Set(employees
    .map(emp => emp.department?.name)
    .filter(Boolean)
    .sort())];
  
  const employmentTypes = ["all", ...new Set(employees
    .map(emp => emp.employmentType)
    .filter(Boolean)
    .sort())];
  
  const statuses = ["all", ...new Set(employees
    .map(emp => emp.status)
    .filter(Boolean)
    .sort())];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setUnauthorized(true);

    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "hr") return setUnauthorized(true);

    fetchEmployees();
  }, [refreshTrigger]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/employees/allEmployees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data.employees);
      setFilteredEmployees(res.data.employees);
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let results = employees;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(emp => 
        emp.firstname.toLowerCase().includes(term) ||
        emp.lastname.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.employeeCode.toLowerCase().includes(term) ||
        emp.jobTitle?.toLowerCase().includes(term) ||
        emp.department?.name?.toLowerCase().includes(term)
      );
    }

    if (selectedDepartment !== "all") {
      results = results.filter(emp => 
        emp.department?.name === selectedDepartment
      );
    }

    if (selectedEmployment !== "all") {
      results = results.filter(emp => 
        emp.employmentType === selectedEmployment
      );
    }

    if (selectedStatus !== "all") {
      results = results.filter(emp => 
        emp.status === selectedStatus
      );
    }

    setFilteredEmployees(results);
  }, [employees, searchTerm, selectedDepartment, selectedEmployment, selectedStatus]);

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    
    setDeleting(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`/api/employees/employee/${employeeToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees((prev) => prev.filter((emp) => emp._id !== employeeToDelete._id));
      setError("");
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    } catch (err) {
      setError("Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (employee) => {
    setEmployeeToEdit(employee);
    setShowAddModal(true);
  };

  const handleAddEmployee = () => {
    setEmployeeToEdit(null);
    setShowAddModal(true);
  };

  const handleEmployeeAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedEmployment("all");
    setSelectedStatus("all");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge-activeHrEm';
      case 'inactive': return 'status-badge-inactiveHrEm';
      case 'on-leave': return 'status-badge-on-leaveHrEm';
      case 'terminated': return 'status-badge-terminatedHrEm';
      default: return 'status-badge-defaultHrEm';
    }
  };

  const getEmploymentTypeBadge = (type) => {
    switch (type) {
      case 'full-time': return 'employment-fulltimeHrEm';
      case 'part-time': return 'employment-parttimeHrEm';
      case 'contract': return 'employment-contractHrEm';
      case 'intern': return 'employment-internHrEm';
      case 'permanent': return 'employment-permanentHrEm';
      default: return 'employment-otherHrEm';
    }
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;
    
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substr(2, 9);
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      const cleanPath = photoPath.split('?')[0];
      return `${cleanPath}?t=${timestamp}&r=${random}`;
    }
    
    if (photoPath.startsWith('/uploads')) {
      return `${photoPath}?t=${timestamp}&r=${random}`;
    }
    
    if (photoPath.startsWith('uploads')) {
      return `/${photoPath}?t=${timestamp}&r=${random}`;
    }
    
    return `/uploads/${photoPath}?t=${timestamp}&r=${random}`;
  };

  if (unauthorized) return <h2 className="unauthHrEm">Unauthorized</h2>;
  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="employee-dashboardHrEm">
      <div className="dashboard-headerHrEm">
        <h1>
          <Users size={32} /> Employee Management
        </h1>
        <button className="add-btnHrEm" onClick={handleAddEmployee}>
          <PlusCircle size={20} /> Add Employee
        </button>
      </div>

      {error && <p className="errorHrEm">{error}</p>}

      <div className="filter-sectionHrEm">
        <div className="search-containerHrEm">
          <input
            type="text"
            placeholder="Search employees by name, email, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-inputHrEm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="clear-search-btnHrEm"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className="filter-toggle-btnHrEm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? "Hide Filters" : "Show Filters"}
          {(selectedDepartment !== "all" || selectedEmployment !== "all" || selectedStatus !== "all") && (
            <span className="active-filter-countHrEm">3</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="filter-controlsHrEm">
          <div className="filter-groupHrEm">
            <label className="filter-labelHrEm">
              <Briefcase size={16} />
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-selectHrEm"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupHrEm">
            <label className="filter-labelHrEm">
              <Calendar size={16} />
              Employment Type
            </label>
            <select
              value={selectedEmployment}
              onChange={(e) => setSelectedEmployment(e.target.value)}
              className="filter-selectHrEm"
            >
              {employmentTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-groupHrEm">
            <label className="filter-labelHrEm">
              <Shield size={16} />
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-selectHrEm"
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
            className="clear-filters-btnHrEm"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      )}

      <div className="results-summaryHrEm">
        <span className="results-countHrEm">
          Showing {filteredEmployees.length} of {employees.length} employees
        </span>
        {(selectedDepartment !== "all" || selectedEmployment !== "all" || selectedStatus !== "all") && (
          <span className="active-filtersHrEm">
            <Filter size={14} />
            Filters active: 
            {selectedDepartment !== "all" && ` ${selectedDepartment}`}
            {selectedEmployment !== "all" && ` • ${selectedEmployment}`}
            {selectedStatus !== "all" && ` • ${selectedStatus}`}
          </span>
        )}
      </div>

      <div className="employee-table-containerHrEm">
        <table className="employee-tableHrEm">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr className="no-results-rowHrEm">
                <td colSpan="10" className="no-results-cellHrEm">
                  <div className="no-results-contentHrEm">
                    <Search size={48} />
                    <h3>No employees found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button 
                      onClick={clearFilters}
                      className="reset-filters-btnHrEm"
                    >
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const imageUrl = getImageUrl(emp.photo);
                
                return (
                  <tr key={emp._id}>
                    <td>
                      {imageUrl ? (
                        <img 
                          src={imageUrl}
                          alt={`${emp.firstname} ${emp.lastname}`} 
                          className="employee-avatarHrEm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="employee-avatar-placeholderHrEm"
                        style={{ display: !imageUrl ? 'flex' : 'none' }}
                      >
                        <User size={20} />
                      </div>
                    </td>
                    <td className="employee-codeHrEm">{emp.employeeCode}</td>
                    <td className="employee-nameHrEm">
                      <div className="name-wrapperHrEm">
                        <div className="nameHrEm">{emp.firstname} {emp.lastname}</div>
                        <div className="role-badgeHrEm">
                          <Shield size={12} /> {emp.role}
                        </div>
                      </div>
                    </td>
                    <td className="employee-emailHrEm">{emp.email}</td>
                    <td className="job-titleHrEm">
                      <div className="job-title-contentHrEm">
                        <Briefcase size={14} />
                        <span>{emp.jobTitle || "Not specified"}</span>
                      </div>
                    </td>
                    <td className="departmentHrEm">
                      {emp.department ? (
                        <div className="department-infoHrEm">
                          <div className="dept-nameHrEm">{emp.department.name}</div>
                          <div className="dept-codeHrEm">{emp.department.code}</div>
                        </div>
                      ) : "N/A"}
                    </td>
                    <td>
                      <span className={`employment-badgeHrEm ${getEmploymentTypeBadge(emp.employmentType)}`}>
                        {emp.employmentType || "N/A"}
                      </span>
                    </td>
                    <td className="hire-dateHrEm">
                      <div className="hire-date-contentHrEm">
                        <Calendar size={14} />
                        <span>{emp.hireDate ? formatDate(emp.hireDate) : "N/A"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badgeHrEm ${getStatusBadgeClass(emp.status)}`}>
                        {emp.status || "unknown"}
                      </span>
                    </td>
                    <td className="actionsHrEm">
                      <button className="editHrEm" title="Edit" onClick={() => handleEdit(emp)}>
                        <Edit size={16} />
                      </button>
                      <button className="deleteHrEm" title="Delete" onClick={() => handleDeleteClick(emp)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEmployeeToEdit(null);
        }}
        onEmployeeAdded={handleEmployeeAdded}
        employeeToEdit={employeeToEdit}
      />

      {showDeleteConfirm && (
        <div className="modal-overlay2HrEm" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="delete-confirm-contentHrEm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-headerHrEm">
              <AlertCircle size={32} className="delete-warning-iconHrEm" />
              <h3>Confirm Delete</h3>
            </div>
            <p className="delete-confirm-messageHrEm">
              Are you sure you want to delete the employee "<strong>{employeeToDelete?.firstname} {employeeToDelete?.lastname}</strong>" ({employeeToDelete?.employeeCode})? 
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actionsHrEm">
              <button 
                className="cancel-delete-btnHrEm" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btnHrEm" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinnerHrEm"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;