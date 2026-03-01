import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2, Plus, Pencil, Trash2, Search, Filter,
  Calendar, ArrowUpDown, X, CheckCircle, AlertCircle,
  Download, Eye, MoreVertical, Hash, FileText, Globe,
  Briefcase, ChevronDown, ChevronUp, Info, Save, Ban
} from 'lucide-react';
import './departments.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorD, setErrorD] = useState('');
  const [successD, setSuccessD] = useState('');
  const [searchTermD, setSearchTermD] = useState('');
  const [showModalD, setShowModalD] = useState(false);
  const [modalType, setModalType] = useState('add'); 
  const [currentDeptD, setCurrentDeptD] = useState(null);
  const [uploadingD, setUploadingD] = useState(false);
  const [loadingOrgsD, setLoadingOrgsD] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  
  const [sortConfigD, setSortConfigD] = useState({ key: 'createdAt', direction: 'desc' });

  const [formDataD, setFormDataD] = useState({
    departmentId: '',
    name: '',
    code: '',
    organisation: '',
    description: '',
    status: 'active'
  });

  const statusOptions = ['active', 'inactive'];

  useEffect(() => {
    fetchDepartmentsD();
    fetchOrganisationsD();
  }, []);

  useEffect(() => {
    let timer;
    if (errorD || successD) {
      timer = setTimeout(() => {
        setErrorD('');
        setSuccessD('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [errorD, successD]);

  const fetchDepartmentsD = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/depart/Departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let deptsArray = [];
      if (Array.isArray(response.data)) {
        deptsArray = response.data;
      } else if (response.data && response.data.data) {
        deptsArray = Array.isArray(response.data.data) ? response.data.data : Object.values(response.data.data);
      } else if (response.data && response.data.success && response.data.data) {
        deptsArray = Array.isArray(response.data.data) ? response.data.data : Object.values(response.data.data);
      }
      
      setDepartments(deptsArray || []);
      setErrorD('');
    } catch (err) {
      setErrorD('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganisationsD = async () => {
    try {
      setLoadingOrgsD(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/org/org', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let orgsArray = [];
      
      if (Array.isArray(res.data)) {
        orgsArray = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        orgsArray = res.data.data;
      } else if (res.data && res.data.data && typeof res.data.data === 'object') {
        orgsArray = Object.values(res.data.data);
      } else if (res.data && typeof res.data === 'object') {
        orgsArray = Object.values(res.data);
      }
      
      setOrganisations(Array.isArray(orgsArray) ? orgsArray : []);
      
    } catch (err) {
      setOrganisations([]);
    } finally {
      setLoadingOrgsD(false);
    }
  };

  const handleSearchD = (e) => {
    setSearchTermD(e.target.value);
  };

  const handleSortD = (key) => {
    let direction = 'asc';
    if (sortConfigD.key === key && sortConfigD.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigD({ key, direction });
  };

  const filteredDepartmentsD = departments.filter(dept => {
    const matchesSearch = 
      dept.name?.toLowerCase().includes(searchTermD.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchTermD.toLowerCase()) ||
      dept.departmentId?.toLowerCase().includes(searchTermD.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTermD.toLowerCase());
    
    return matchesSearch;
  });

  const sortedDepartmentsD = [...filteredDepartmentsD].sort((a, b) => {
    if (sortConfigD.key) {
      const aValue = a[sortConfigD.key];
      const bValue = b[sortConfigD.key];
      
      if (aValue < bValue) {
        return sortConfigD.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfigD.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const handleInputChangeD = (e) => {
    const { name, value } = e.target;
    setFormDataD(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitD = async (e) => {
    e.preventDefault();
    setUploadingD(true);
    setErrorD('');
    setSuccessD('');

    try {
      const token = localStorage.getItem('token');
      
      if (modalType === 'edit') {
        await axios.put(`/api/depart/${currentDeptD._id}`, formDataD, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessD('Department updated successfully!');
      } else {
        await axios.post('/api/depart/createDepartment', formDataD, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessD('Department created successfully!');
      }

      setTimeout(() => {
        setShowModalD(false);
        resetFormD();
        fetchDepartmentsD();
      }, 1500);
    } catch (err) {
      setErrorD(err.response?.data?.message || 'Failed to save department');
    } finally {
      setUploadingD(false);
    }
  };

  const openAddModal = () => {
    resetFormD();
    setModalType('add');
    setShowModalD(true);
    setErrorD('');
    setSuccessD('');
  };

  const openEditModal = (department) => {
    setFormDataD({
      departmentId: department.departmentId || '',
      name: department.name || '',
      code: department.code || '',
      organisation: department.organisation || '',
      description: department.description || '',
      status: department.status || 'active'
    });
    setCurrentDeptD(department);
    setModalType('edit');
    setShowModalD(true);
    setErrorD('');
    setSuccessD('');
  };

  const openViewModal = (department) => {
    setFormDataD({
      departmentId: department.departmentId || '',
      name: department.name || '',
      code: department.code || '',
      organisation: department.organisation || '',
      description: department.description || '',
      status: department.status || 'active'
    });
    setCurrentDeptD(department);
    setModalType('view');
    setShowModalD(true);
    setErrorD('');
    setSuccessD('');
  };

  const handleDeleteD = (department) => {
    setDeptToDelete(department);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteD = async () => {
    if (!deptToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/depart/${deptToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessD('Department deleted successfully!');
      setShowDeleteConfirm(false);
      setDeptToDelete(null);
      fetchDepartmentsD();
    } catch (err) {
      setErrorD(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const resetFormD = () => {
    setFormDataD({
      departmentId: '',
      name: '',
      code: '',
      organisation: '',
      description: '',
      status: 'active'
    });
    setCurrentDeptD(null);
  };

  const clearFiltersD = () => {
    setSearchTermD('');
  };

  const getOrganisationNameD = (orgId) => {
    const org = organisations.find(o => o._id === orgId);
    return org ? org.name : orgId || 'Not assigned';
  };

  const getStatusBadgeD = (status) => {
    const statusMap = {
      active: { className: 'status-badge-activeD', icon: <CheckCircle size={14} /> },
      inactive: { className: 'status-badge-inactiveD', icon: <AlertCircle size={14} /> }
    };
    
    const statusInfo = statusMap[status] || statusMap.inactive;
    
    return (
      <span className={`status-badgeD ${statusInfo.className}`}>
        {statusInfo.icon}
        <span className="ml-1D capitalize">{status}</span>
      </span>
    );
  };

  const closeModal = () => {
    setShowModalD(false);
    resetFormD();
    setErrorD('');
    setSuccessD('');
  };

  if (loading && departments.length === 0) {
    return (
      <div className="departments-containerD">
        <div className="loading-spinnerD">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="departments-containerD">
      {/* Header Section */}
      <div className="dashboard-headerD">
        <h1>
          <Building2 size={28} />
          Departments Management
        </h1>
        <button 
          className="add-btnD"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Search Section */}
      <div className="filter-sectionD">
        <div className="search-containerD">
          <Search className="search-iconD" />
          <input
            type="text"
            className="search-inputD"
            placeholder="Search departments by name, code, or description..."
            value={searchTermD}
            onChange={handleSearchD}
          />
          {searchTermD && (
            <button className="clear-search-btnD" onClick={() => setSearchTermD('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summaryD">
        <div className="results-countD">
          {filteredDepartmentsD.length} of {departments.length} departments shown
          {searchTermD && ` (filtered by: "${searchTermD}")`}
        </div>
      </div>

      {/* Departments Table */}
      <div className="departments-table-containerD">
        <table className="departments-tableD">
          <thead>
            <tr>
              <th>
                <div className="table-headerD">
                  <span>Department</span>
                  <button 
                    className="sort-btnD"
                    onClick={() => handleSortD('name')}
                  >
                    {sortConfigD.key === 'name' ? (
                      sortConfigD.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={14} />}
                  </button>
                </div>
              </th>
              <th>
                <div className="table-headerD">
                  <span>Code</span>
                  <button 
                    className="sort-btnD"
                    onClick={() => handleSortD('code')}
                  >
                    {sortConfigD.key === 'code' ? (
                      sortConfigD.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={14} />}
                  </button>
                </div>
              </th>
              <th>Department ID</th>
              
              <th>Description</th>
              <th>Status</th>
              <th>
                <div className="table-headerD">
                  <span>Created Date</span>
                  <button 
                    className="sort-btnD"
                    onClick={() => handleSortD('createdAt')}
                  >
                    {sortConfigD.key === 'createdAt' ? (
                      sortConfigD.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    ) : <ArrowUpDown size={14} />}
                  </button>
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDepartmentsD.length > 0 ? (
              sortedDepartmentsD.map((dept) => (
                <tr key={dept._id}>
                  <td>
                    <div className="dept-infoD">
                      <div className="dept-avatarD">
                        <Building2 size={20} />
                      </div>
                      <div className="dept-detailsD">
                        <div className="dept-nameD">{dept.name}</div>
                        <div className="dept-emailD">
                          <Hash size={12} />
                          {dept.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-codeD">{dept.code}</span>
                  </td>
                  <td>
                    <span className="department-idD">
                      <Hash size={12} />
                      {dept.departmentId || 'N/A'}
                    </span>
                  </td>
                  
                  <td>
                    <div className="description-contentD">
                      <FileText size={12} />
                      <span title={dept.description || 'No description available'}>
                        {dept.description ? (
                          dept.description.length > 50 
                            ? `${dept.description.substring(0, 50)}...` 
                            : dept.description
                        ) : 'No description'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {getStatusBadgeD(dept.status || 'active')}
                  </td>
                  <td>
                    <div className="created-dateD">
                      <Calendar size={12} />
                      {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="actionsD">
                      <button 
                        className="viewD"
                        onClick={() => openViewModal(dept)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="editD"
                        onClick={() => openEditModal(dept)}
                        title="Edit Department"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="deleteD"
                        onClick={() => handleDeleteD(dept)}
                        title="Delete Department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="no-results-contentD">
                    <Building2 size={48} />
                    <h3>No departments found</h3>
                    <p>Try adjusting your search or add a new department</p>
                    <button 
                      className="reset-filters-btnD"
                      onClick={clearFiltersD}
                    >
                      Clear Search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Department Modal - Different types: add, edit, view */}
      {showModalD && (
        <div className="modal-overlayD" onClick={closeModal}>
          <div className="modal-contentD" onClick={(e) => e.stopPropagation()}>
            <div className="modal-headerD">
              <h2 className={`modal-titleD modal-title-${modalType}D`}>
                {modalType === 'add' && <Plus size={24} />}
                {modalType === 'edit' && <Pencil size={24} />}
                {modalType === 'view' && <Eye size={24} />}
                <span>
                  {modalType === 'add' && 'Add New Department'}
                  {modalType === 'edit' && 'Edit Department'}
                  {modalType === 'view' && 'Department Details'}
                </span>
              </h2>
              <button 
                className="modal-close-btnD"
                onClick={closeModal}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Messages - Inside the modal */}
            {errorD && <div className="modal-errorD">{errorD}</div>}
            {successD && <div className="modal-successD">{successD}</div>}

            <form onSubmit={modalType === 'view' ? (e) => { e.preventDefault(); } : handleSubmitD} className="department-formD">
              <div className="form-gridD">
                <div className="form-sectionD">
                  <h3 className="section-titleD">
                    <Building2 size={20} /> Department Information
                  </h3>
                  
                  <div className="form-groupD">
                    <label><Hash size={16} /> Department ID {modalType !== 'view' && '*'}</label>
                    <input
                      type="text"
                      name="departmentId"
                      autoComplete="off"
                      value={formDataD.departmentId}
                      onChange={handleInputChangeD}
                      required={modalType !== 'view'}
                      placeholder="DEP001"
                      readOnly={modalType === 'view'}
                      className={modalType === 'view' ? 'read-only-inputD' : ''}
                    />
                  </div>

                  <div className="form-rowD">
                    <div className="form-groupD">
                      <label>Department Name {modalType !== 'view' && '*'}</label>
                      <input
                        type="text"
                        name="name"
                        autoComplete="off"
                        value={formDataD.name}
                        onChange={handleInputChangeD}
                        required={modalType !== 'view'}
                        placeholder="Engineering Department"
                        readOnly={modalType === 'view'}
                        className={modalType === 'view' ? 'read-only-inputD' : ''}
                      />
                    </div>
                    <div className="form-groupD">
                      <label>Department Code {modalType !== 'view' && '*'}</label>
                      <input
                        type="text"
                        name="code"
                        autoComplete="off"
                        value={formDataD.code}
                        onChange={handleInputChangeD}
                        required={modalType !== 'view'}
                        placeholder="ENG"
                        maxLength="10"
                        readOnly={modalType === 'view'}
                        className={modalType === 'view' ? 'read-only-inputD' : ''}
                      />
                      <small className="form-hintD">Short code (max 10 characters)</small>
                    </div>
                  </div>

                  <div className="form-rowD">
                    <div className="form-groupD">
                      <label><Globe size={16} /> Organisation {modalType !== 'view' && '*'}</label>
                      <select
                        name="organisation"
                        value={formDataD.organisation}
                        onChange={handleInputChangeD}
                        required={modalType !== 'view'}
                        disabled={modalType === 'view' || loadingOrgsD || organisations.length === 0}
                        className={modalType === 'view' ? 'read-only-selectD' : ''}
                      >
                        <option value="">Select Organisation</option>
                        {loadingOrgsD ? (
                          <option value="" disabled>Loading organisations...</option>
                        ) : organisations.length > 0 ? (
                          organisations.map(org => (
                            org && (org._id || org.id) ? (
                              <option key={org._id || org.id} value={org._id || org.id}>
                                {org.name || 'Unnamed Organisation'}
                              </option>
                            ) : null
                          ))
                        ) : (
                          <option value="" disabled>No organisations available</option>
                        )}
                      </select>
                     
                    </div>
                    <div className="form-groupD">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formDataD.status}
                        onChange={handleInputChangeD}
                        disabled={modalType === 'view'}
                        className={modalType === 'view' ? 'read-only-selectD' : ''}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                      {modalType === 'view' && (
                        <div className="view-status-displayD">
                          {getStatusBadgeD(formDataD.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-sectionD">
                <h3 className="section-titleD">
                  <FileText size={20} /> Additional Information
                </h3>
                
                <div className="form-groupD">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formDataD.description}
                    onChange={handleInputChangeD}
                    rows="3"
                    placeholder="Describe the department's purpose and responsibilities..."
                    readOnly={modalType === 'view'}
                    className={modalType === 'view' ? 'read-only-textareaD' : ''}
                  />
                  {modalType === 'view' && !formDataD.description && (
                    <div className="no-descriptionD">No description provided</div>
                  )}
                </div>
              </div>

              <div className="form-actionsD">
                <button
                  type="button"
                  className="cancel-btnD"
                  onClick={closeModal}
                  disabled={uploadingD}
                >
                  {modalType === 'view' ? 'Close' : 'Cancel'}
                </button>
                
                {modalType !== 'view' && (
                  <button
                    type="submit"
                    className={`submit-btnD ${modalType === 'edit' ? 'submit-edit-btnD' : 'submit-add-btnD'}`}
                    disabled={uploadingD}
                  >
                    {uploadingD ? (
                      <>
                        <span className="spinnerD"></span>
                        Saving...
                      </>
                    ) : modalType === 'edit' ? (
                      <>
                        <Save size={16} />
                        Update Department
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Department
                      </>
                    )}
                  </button>
                )}
                
                {modalType === 'view' && currentDeptD && (
                  <button
                    type="button"
                    className="edit-from-view-btnD"
                    onClick={() => {
                      closeModal();
                      openEditModal(currentDeptD);
                    }}
                  >
                    <Pencil size={16} />
                    Edit Department
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modalD">
          <div className="delete-confirm-contentD" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-headerD">
              <AlertCircle size={32} className="delete-warning-iconD" />
              <h3>Confirm Delete</h3>
            </div>
            <p className="delete-confirm-messageD">
              Are you sure you want to delete the department "<strong>{deptToDelete?.name}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="delete-confirm-actionsD">
              <button className="cancel-delete-btnD" onClick={() => setShowDeleteConfirm(false)}>
                <Ban size={16} />
                Cancel
              </button>
              <button className="confirm-delete-btnD" onClick={confirmDeleteD}>
                <Trash2 size={16} />
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;