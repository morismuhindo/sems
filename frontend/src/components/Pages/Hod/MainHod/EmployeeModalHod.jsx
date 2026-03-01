import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X, User, Mail, Phone, Calendar, Briefcase,
  MapPin, DollarSign, Shield, Hash, Camera, Key, Building, Lock
} from "lucide-react";
import "./Modal.css";

const EmployeeModalHod = ({ 
  isOpen, 
  onClose, 
  onEmployeeAdded, 
  employeeToEdit,
  userRole,                
  hodDepartmentId,         
  hodDepartmentName       
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    address: "",
    jobTitle: "",
    department: "",
    organisation: "",
    employmentType: "",
    salary: "",
    hireDate: new Date().toISOString().split('T')[0],
    status: "active",
    role: "employee",
    photo: "",
    password: "",
    gender: "",
    dateOfBirth: ""
  });

  // Employment type options
  const employmentTypes = [
    "full-time",
    "part-time",
    "contract",
    "intern",
    "permanent"
  ];

  // Status options
  const statusOptions = [
    "active",
    "inactive",
    "on-leave",
    "terminated"
  ];

  // Role options (matching backend)
  const roleOptions = [
    "employee",
    "hr",
    "hod",
    "attendanceManager"
  ];

  // Gender options
  const genderOptions = [
    "Male",
    "Female",
    "Did not Indicate"
  ];

  // Function to get the correct image URL 
  const getImageUrl = (photoPath) => {
    if (!photoPath || photoPath === 'undefined' || photoPath === 'null') {
      return null;
    }
    
    if (typeof photoPath === 'string') {
      if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
      }
      if (photoPath.startsWith('/')) {
        return `${photoPath}`;
      }
      return `/uploads/${photoPath}`;
    }
    
    return null;
  };

  // Fetch departments and organisations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchOrganisations();
    }
  }, [isOpen]);

  // Auto-set department for HOD when creating new employee
  useEffect(() => {
    if (userRole === "hod" && hodDepartmentId && !employeeToEdit) {
      // Auto-set department for HOD when creating new employee
      setFormData(prev => ({
        ...prev,
        department: hodDepartmentId
      }));
    }
  }, [userRole, hodDepartmentId, employeeToEdit, isOpen]);

  // Populate form if editing 
  useEffect(() => {
    if (employeeToEdit) {
      const photoUrl = getImageUrl(employeeToEdit.photo);
      
      setFormData({
        firstname: employeeToEdit.firstname || "",
        lastname: employeeToEdit.lastname || "",
        email: employeeToEdit.email || "",
        phone: employeeToEdit.phone || "",
        address: employeeToEdit.address || "",
        jobTitle: employeeToEdit.jobTitle || "",
        department: employeeToEdit.department?._id || employeeToEdit.department || "",
        organisation: employeeToEdit.organisation?._id || employeeToEdit.organisation || "",
        employmentType: employeeToEdit.employmentType || "full-time",
        salary: employeeToEdit.salary || employeeToEdit.salaryBase || "",
        hireDate: employeeToEdit.hireDate ? new Date(employeeToEdit.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: employeeToEdit.status || "active",
        role: employeeToEdit.role || "employee",
        photo: employeeToEdit.photo || "",
        gender: employeeToEdit.gender || "",
        dateOfBirth: employeeToEdit.dateOfBirth ? new Date(employeeToEdit.dateOfBirth).toISOString().split('T')[0] : ""
      });
      setGeneratedCode(employeeToEdit.employeeCode || "");
      
      // Set photo preview for existing employee
      setPhotoPreview(photoUrl || "");
    } else {
      // Reset form for new employee
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        address: "",
        jobTitle: "",
        department: hodDepartmentId || "",
        organisation: "",
        employmentType: "full-time",
        salary: "",
        hireDate: new Date().toISOString().split('T')[0],
        status: "active",
        role: "employee",
        photo: "",
        password: "",
        gender: "",
        dateOfBirth: ""
      });
      setGeneratedCode("");
      setPhotoPreview("");
    }
    setError("");
    setSuccess("");
  }, [employeeToEdit, isOpen, hodDepartmentId]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/depart/Departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure we're getting an array
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setError("Failed to load departments");
    }
  };

  const fetchOrganisations = async () => {
    try {
      setLoadingOrgs(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/org/org", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Organisations API response:", res.data); // Debug log
      
      // Handle different API response structures
      let orgsArray = [];
      
      if (Array.isArray(res.data)) {
        // Response is already an array
        orgsArray = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        // Response has data array (common pattern)
        orgsArray = res.data.data;
      } else if (res.data && res.data.data && typeof res.data.data === 'object') {
        // Response is an object that needs to be converted to array
        orgsArray = Object.values(res.data.data);
      } else if (res.data && typeof res.data === 'object') {
        // Response is an object with nested data
        orgsArray = Object.values(res.data);
      }
      
      console.log("Processed organisations:", orgsArray); // Debug log
      setOrganisations(Array.isArray(orgsArray) ? orgsArray : []);
      
    } catch (err) {
      console.error("Failed to fetch organisations:", err);
      setError("Failed to load organisations");
      setOrganisations([]); // Set empty array on error
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    const formDataObj = new FormData();
    formDataObj.append("profilePic", file);

    try {
      setUploadingPhoto(true);
      setError(""); // Clear previous errors
      setSuccess(""); // Clear previous success messages
      
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/employees/profilePic",
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.url) {
        const uploadedUrl = res.data.url;
        const fullImageUrl = getImageUrl(uploadedUrl);
        
        setFormData(prev => ({
          ...prev,
          photo: uploadedUrl
        }));
        
        // Update preview with full URL
        if (fullImageUrl) {
          setPhotoPreview(fullImageUrl);
        }
        
        setSuccess("Photo uploaded successfully!");
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      
      // Handle backend error response properly
      let errorMessage = "Failed to upload photo";
      
      if (err.response) {
        // The server responded with an error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      err.response.statusText;
        
        // If there are validation errors from backend
        if (err.response.data?.errors) {
          errorMessage = Object.values(err.response.data.errors).join(', ');
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      }
      
      setError(errorMessage);
      // Clear the local preview on error
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // HOD department validation
    if (userRole === "hod" && hodDepartmentId && formData.department !== hodDepartmentId) {
      setError("You can only add/edit employees in your own department.");
      setLoading(false);
      return;
    }

    // Validation - organisation is required according to backend
    if (!formData.firstname || !formData.lastname || !formData.department || !formData.organisation) {
      setError("First name, last name, department, and organisation are required");
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Prepare data for backend - ensure photo is included
      const employeeData = {
        ...formData,
        salaryBase: formData.salary || 0,
        salary: undefined
      };

      if (!employeeToEdit) {
        // For new employee
        const response = await axios.post(
          "/api/employees/createEmployee",
          employeeData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          }
        );

        if (response.status === 201) {
          setSuccess("Employee created successfully!");
          setGeneratedCode(response.data.data.employeeCode);
          
          // Call the callback to refresh the employee list
          if (onEmployeeAdded) {
            onEmployeeAdded();
          }

          // Close modal after success
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        // For editing existing employee
        const response = await axios.put(
          `/api/employees/employee/${employeeToEdit._id}`,
          employeeData,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          }
        );

        if (response.status === 200) {
          setSuccess("Employee updated successfully!");
          
          // Call the callback to refresh the employee list
          if (onEmployeeAdded) {
            onEmployeeAdded();
          }

          // Close modal after success
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Error saving employee:", err);
      
      // Handle backend error response properly for employee creation/update
      let errorMessage = "Failed to save employee. Please try again.";
      
      if (err.response) {
        // The server responded with an error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      err.response.statusText;
        
        // If there are validation errors from backend
        if (err.response.data?.errors) {
          errorMessage = Object.values(err.response.data.errors).join(', ');
        }
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your connection.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get department name for display
  const getDepartmentDisplayName = () => {
    if (userRole === "hod" && hodDepartmentId) {
      const dept = departments.find(d => d._id === hodDepartmentId);
      return dept ? `${dept.name} (${dept.code})` : hodDepartmentName;
    }
    return "";
  };

  return (
    <div className="modal-overlayEM" onClick={onClose}>
      <div className="modal-contentEM" onClick={(e) => e.stopPropagation()}>
        <div className="modal-headerEM">
          <h2>
            {employeeToEdit ? "Edit Employee" : "Add New Employee"}
            {userRole === "hod" && (
              <span className="hod-badgeEM">
                <Lock size={14} /> HOD Restricted View
              </span>
            )}
          </h2>
          <button className="close-btnEM" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && <div className="alert errorEM">{error}</div>}
        {success && <div className="alert successEM">{success}</div>}

        {/* Show generated code if available */}
        {generatedCode && (
          <div className="generated-code-infoEM">
            <Key size={16} />
            <span>Employee Code: <strong>{generatedCode}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="employee-formEM">
          {/* Photo Upload - FIXED VERSION */}
          <div className="photo-upload-sectionEM">
            <div className="photo-previewEM">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  className="profile-photoEM" 
                  alt="Preview" 
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="photo-placeholderEM"
                style={{ display: photoPreview ? 'none' : 'flex' }}
              >
                <User size={48} />
              </div>
            </div>
            
            <div className="photo-upload-controlsEM">
              <label className={`upload-btnEM ${uploadingPhoto ? "uploadingEM" : ""}`}>
                <Camera size={20} />
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
              
              {(formData.photo || photoPreview) && (
                <button
                  type="button"
                  className="remove-photo-btnEM"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, photo: "" }));
                    setPhotoPreview("");
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
            
            {uploadingPhoto && (
              <small className="form-hintEM">Uploading photo to server...</small>
            )}
          </div>

          <div className="form-gridEM">
            {/* Personal Information */}
            <div className="form-sectionEM">
              <h3 className="section-titleEM">
                <User size={20} /> Personal Information
              </h3>
              
              <div className="form-rowEM">
                <div className="form-groupEM">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    required
                    placeholder="Muhindo"
                  />
                </div>
                <div className="form-groupEM">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    required
                    placeholder="Moris"
                  />
                </div>
              </div>

              <div className="form-rowEM">
                <div className="form-groupEM">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(gender => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-groupEM">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-groupEM">
                <label><Mail size={16} /> Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="muhindomoris@gmail.com"
                />
              </div>

              <div className="form-groupEM">
                <label><Phone size={16} /> Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+256xxxxxxxxx"
                />
              </div>

              <div className="form-groupEM">
                <label><MapPin size={16} /> Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Street, City, Country"
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className="form-sectionEM">
              <h3 className="section-titleEM">
                <Briefcase size={20} /> Employment Information
              </h3>

              <div className="form-groupEM">
                <label><Building size={16} /> Organisation *</label>
                <select
                  name="organisation"
                  value={formData.organisation}
                  onChange={handleChange}
                  required
                  disabled={loadingOrgs}
                >
                  <option value="">Select Organisation</option>
                  {loadingOrgs ? (
                    <option value="" disabled>Loading organisations...</option>
                  ) : organisations.length > 0 ? (
                    organisations.map(org => (
                      <option key={org._id || org.id} value={org._id || org.id}>
                        {org.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No organisations available</option>
                  )}
                </select>
                <small className="form-hintEM">
                  Required for employee code generation
                </small>
                {loadingOrgs && (
                  <small className="form-hintEM">Loading organisations...</small>
                )}
              </div>

              {/* Department Field - Restricted for HOD */}
              <div className="form-groupEM">
                <label>Department *</label>
                {userRole === "hod" && hodDepartmentId ? (
                  <div className="hod-restricted-deptEM">
                    <div className="hod-dept-displayEM">
                      <Lock size={14} />
                      <span className="hod-dept-nameEM">
                        {getDepartmentDisplayName()}
                      </span>
                    </div>
                    <small className="form-hintEM">
                      HODs can only manage employees in their own department
                    </small>
                    {/* Hidden input to still send the department value */}
                    <input 
                      type="hidden" 
                      name="department" 
                      value={hodDepartmentId} 
                    />
                  </div>
                ) : (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                )}
                <small className="form-hintEM">
                  Required for employee code generation
                </small>
              </div>

              <div className="form-groupEM">
                <label>Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                />
              </div>

              <div className="form-rowEM">
                <div className="form-groupEM">
                  <label>Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-groupEM">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.replace("-", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-rowEM">
                <div className="form-groupEM">
                  <label><Shield size={16} /> Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-groupEM">
                  <label><DollarSign size={16} /> Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-groupEM">
                <label><Calendar size={16} /> Hire Date</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password field for new employees only */}
              {!employeeToEdit && (
                <div className="form-groupEM">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                  <small className="form-hintEM">
                    Leave empty for auto-generated password
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="form-actionsEM">
            <button
              type="button"
              className="cancel-btnEM"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btnEM"
              disabled={loading || loadingOrgs}
            >
              {loading ? "Saving..." : employeeToEdit ? "Update Employee" : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModalHod;