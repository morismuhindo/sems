import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Attendance.css';

const Attendancecomponent = () => {
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState('');   
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  
  const [employeeImageError, setEmployeeImageError] = useState(false);
  const [resultImageError, setResultImageError] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser) {
          setError('No user found. Please login first.');
          navigate('/login');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const allowedRoles = ['attendancemanager', 'hr'];
        
        if (!parsedUser.role || !allowedRoles.includes(parsedUser.role.toLowerCase())) {
          setError('Access denied. You do not have permission to access attendance management.');
          navigate('/unauthorized');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        setError('Error verifying user permissions. Please login again.');
        navigate('/login');
      }
    };

    checkAuthorization();
  }, [navigate]);

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

  const getImageUrl = (photoPath) => {
    if (!photoPath || photoPath === 'null' || photoPath === 'undefined' || photoPath === '') {
      return null;
    }
    
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    let cleanPath = photoPath;
    if (cleanPath.startsWith('./')) {
      cleanPath = cleanPath.substring(2);
    }
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    return `/${cleanPath}`;
  };

  const getMethodDisplayName = (method) => {
    if (!method) return 'Employee Code';
    
    const methodMap = {
      'code': 'Employee Code',
      'qrcode': 'QR Code',
      'biometric': 'Biometric',
      'manual': 'Manual Entry'
    };
    
    return methodMap[method] || method;
  };

  const handleVerify = async () => {
    if (!authorized) {
      setError('You are not authorized to perform this action.');
      return;
    }

    if (!employeeCode.trim()) {
      setError('Please enter employee code');
      return;
    }

    setError('');
    setVerificationData(null);
    setEmployeeImageError(false);
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/attend/verify',
        { employeeCode: employeeCode },
        {
          ...getAuthHeaders(),
          validateStatus: function (status) {
            return (status >= 200 && status < 300) || status === 404;
          }
        }
      );

      if (response.data.success) {
        setVerificationData(response.data.data);
        setError('');
        
        const hasAlreadyClockedOut = 
          (response.data.data && response.data.data.message && 
           response.data.data.message.toLowerCase().includes('already clocked out')) ||
          (response.data.data && response.data.data.attendanceStatus === 'completed') ||
          (response.data.message && response.data.message.toLowerCase().includes('already clocked out'));
        
        if (hasAlreadyClockedOut) {
          setError('Employee has already clocked out for today.');
        }
      } else {
        setError(response.data.message);
        setVerificationData(null);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (err.response.status === 403) {
          setError('Access denied. You do not have permission to verify attendance.');
        } else {
          if (err.response.data && err.response.data.message && 
              err.response.data.message.toLowerCase().includes('already clocked out')) {
            setError('Employee has already clocked out for today.');
          } else {
            setError(err.response.data ? err.response.data.message : `Server error: ${err.response.status}`);
          }
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check your network connection.');
      } else if (err.message === 'No authentication token found') {
        setError('Please login to continue.');
        navigate('/login');
      } else {
        setError('Error verifying employee: ' + err.message);
      }
      setVerificationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!authorized) {
      setError('You are not authorized to perform this action.');
      return;
    }

    if (!verificationData || !verificationData.employee) {
      setError('Please verify employee first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setResultImageError(false);

    try {
      const response = await axios.post(
        '/api/attend/clock-in',
        {
          employeeCode: verificationData.employee.employeeCode,
          recordedBy: user ? (user._id || user.id) : null,
          recordedRole: user ? user.role : null,
          method: 'code'
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setAttendanceResult(response.data.data);
        setSuccessMessage(response.data.message);
        setVerificationData(null);
        setEmployeeCode('');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (err.response.status === 403) {
          setError('Access denied. You do not have permission to record attendance.');
        } else {
          setError(err.response.data ? err.response.data.message : 'Error clocking in');
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check your network.');
      } else if (err.message === 'No authentication token found') {
        setError('Please login to continue.');
        navigate('/login');
      } else {
        setError('Error clocking in: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!authorized) {
      setError('You are not authorized to perform this action.');
      return;
    }

    if (!verificationData || !verificationData.employee) {
      setError('Please verify employee first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setResultImageError(false);

    try {
      const response = await axios.post(
        '/api/attend/clock-out',
        {
          employeeCode: verificationData.employee.employeeCode,
          recordedBy: user ? (user._id || user.id) : null,
          recordedRole: user ? user.role : null,
          method: 'code'
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setAttendanceResult(response.data.data);
        setSuccessMessage(response.data.message);
        setVerificationData(null);
        setEmployeeCode('');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else if (err.response.status === 403) {
          setError('Access denied. You do not have permission to record attendance.');
        } else {
          setError(err.response.data ? err.response.data.message : 'Error clocking out');
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check your network.');
      } else if (err.message === 'No authentication token found') {
        setError('Please login to continue.');
        navigate('/login');
      } else {
        setError('Error clocking out: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmployeeCode('');
    setVerificationData(null);
    setAttendanceResult(null);
    setError('');
    setSuccessMessage('');
    setEmployeeImageError(false);
    setResultImageError(false);
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  const hasAlreadyClockedOut = () => {
    if (!verificationData) return false;
    
    const message = verificationData.message || '';
    const attendanceStatus = verificationData.attendanceStatus || '';
    
    return message.toLowerCase().includes('already clocked out') || 
           attendanceStatus === 'completed' ||
           (verificationData.canClockIn === false && verificationData.canClockOut === false);
  };

  if (!authorized) {
    return (
      <div className="loading-containerA">
        <div className="loading-spinnerA"></div>
        <p className="loading-textA">Checking permissions...</p>
      </div>
    );
  }

  return (
    <div className="attendance-containerA">
      <div className="attendance-wrapperA">
        <div className="attendance-gridA">
          <div className="attendance-cardA">
            <h2 className="card-titleA">Mark Attendance</h2>
            
            <div className="code-sectionA">
              <div className="input-sectionA">
                <label className="section-labelA">Employee Code</label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="Enter employee code (e.g., ENGM001)"
                  className="employee-inputA"
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={handleVerify}
                disabled={loading || !employeeCode.trim()}
                className="verify-buttonA"
              >
                {loading ? 'Verifying...' : 'Verify Employee'}
              </button>
            </div>

            {error && (
              <div className="error-messageA">
                <div className="error-contentA">
                  <span className="error-iconA">ERROR:</span>
                  <p className="error-textA">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="success-messageA">
                <div className="success-contentA">
                  <span className="success-iconA">SUCCESS:</span>
                  <p className="success-textA">{successMessage}</p>
                </div>
              </div>
            )}
          </div>

          <div className="action-columnA">
            {verificationData && verificationData.employee && (
              <div className="verification-cardA">
                <h2 className="card-titleA">Employee Verified</h2>
                
                <div className="employee-info-cardA">
                  <div className="employee-headerA">
                    {verificationData.employee.photo && !employeeImageError ? (
                      <img 
                        src={getImageUrl(verificationData.employee.photo)} 
                        alt={`${verificationData.employee.firstname || ''} ${verificationData.employee.lastname || ''}`}
                        className="employee-photoA"
                        onError={() => setEmployeeImageError(true)}
                      />
                    ) : (
                      <div className="employee-avatarA">
                        {verificationData.employee.firstname ? verificationData.employee.firstname[0] : 'E'}
                      </div>
                    )}
                    <div className="employee-detailsA">
                      <h3 className="employee-nameA">
                        {verificationData.employee.firstname || ''} {verificationData.employee.lastname || ''}
                      </h3>
                      <p className="employee-codeA">Employee Code: {verificationData.employee.employeeCode || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="employee-metaA">
                    <div className="meta-itemA">
                      <span className="meta-labelA">Department:</span>
                      <span className="meta-valueA">{verificationData.employee.department ? verificationData.employee.department.name : 'N/A'}</span>
                    </div>
                    <div className="meta-itemA">
                      <span className="meta-labelA">Position:</span>
                      <span className="meta-valueA">{verificationData.employee.jobTitle || 'N/A'}</span>
                    </div>
                    <div className="meta-itemA">
                      <span className="meta-labelA">Status:</span>
                      <span className={`status-valueA ${verificationData.employee.status || 'active'}`}>
                        {verificationData.employee.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="suggestion-boxA">
                  <p className="suggestion-labelA">Suggested Action:</p>
                  <p className="suggestion-textA">
                    {hasAlreadyClockedOut() 
                      ? 'Employee has already clocked out for today. No further action needed.'
                      : verificationData.suggestedAction === 'clock-out' 
                        ? 'Employee has already clocked in today. You can clock out.'
                        : 'Employee can clock in now.'}
                  </p>
                </div>

                <div className="action-buttonsA">
                  <button
                    onClick={handleClockIn}
                    disabled={loading || !verificationData.canClockIn || hasAlreadyClockedOut()}
                    className={`action-buttonA clock-in-buttonA ${!verificationData.canClockIn || hasAlreadyClockedOut() ? 'disabled-buttonA' : ''}`}
                  >
                    Clock In
                  </button>
                  
                  <button
                    onClick={handleClockOut}
                    disabled={loading || !verificationData.canClockOut || hasAlreadyClockedOut()}
                    className={`action-buttonA clock-out-buttonA ${!verificationData.canClockOut || hasAlreadyClockedOut() ? 'disabled-buttonA' : ''}`}
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            )}

            {attendanceResult && attendanceResult.employee && (
              <div className="result-cardA">
                <h2 className="card-titleA">Attendance Recorded</h2>
                
                <div className="result-contentA">
                
                  
                  <div className="result-detailsA">
                    <div className="detail-rowA">
                      <span className="detail-labelA">Employee:</span>
                      <span className="detail-valueA">
                        {attendanceResult.employee.firstname} {attendanceResult.employee.lastname}
                      </span>
                    </div>
                    
                    <div className="detail-rowA">
                      <span className="detail-labelA">Employee Code:</span>
                      <span className="detail-valueA">{attendanceResult.employee.employeeCode}</span>
                    </div>
                    
                    <div className="detail-rowA">
                      <span className="detail-labelA">Status:</span>
                      <span className={`status-badgeA ${attendanceResult.status || 'pending'}`}>
                        {(attendanceResult.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="detail-rowA">
                      <span className="detail-labelA">Recorded By:</span>
                      <span className="detail-valueA">
                        {user ? user.firstname : ''} {user ? user.lastname : ''} ({user ? user.role : ''})
                      </span>
                    </div>
                    
                    {attendanceResult.clockIn && (
                      <div className="detail-rowA">
                        <span className="detail-labelA">Clock In:</span>
                        <span className="detail-valueA">{formatDateTime(attendanceResult.clockIn)}</span>
                      </div>
                    )}
                    
                    {attendanceResult.clockOut && (
                      <div className="detail-rowA">
                        <span className="detail-labelA">Clock Out:</span>
                        <span className="detail-valueA">{formatDateTime(attendanceResult.clockOut)}</span>
                      </div>
                    )}
                    
                    <div className="detail-rowA">
                      <span className="detail-labelA">Method:</span>
                      <span className="detail-valueA">{getMethodDisplayName(attendanceResult.method)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={resetForm}
                  className="reset-buttonA"
                  disabled={loading}
                >
                  Mark Another Attendance
                </button>
              </div>
            )}

            {!verificationData && !attendanceResult && (
              <div className="instructions-cardA">
                <h2 className="card-titleA">How to Use</h2>
                <div className="instructions-listA">
                  <div className="instruction-itemA">
                    <div className="step-numberA">1</div>
                    <div className="step-contentA">
                      <h3 className="step-titleA">Enter Employee Code</h3>
                      <p className="step-descriptionA">Enter the employee's unique code in the input field</p>
                    </div>
                  </div>
                  
                  <div className="instruction-itemA">
                    <div className="step-numberA">2</div>
                    <div className="step-contentA">
                      <h3 className="step-titleA">Verify Employee</h3>
                      <p className="step-descriptionA">Click "Verify Employee" to confirm employee details</p>
                    </div>
                  </div>
                  
                  <div className="instruction-itemA">
                    <div className="step-numberA">3</div>
                    <div className="step-contentA">
                      <h3 className="step-titleA">Clock In/Out</h3>
                      <p className="step-descriptionA">Click clock in or clock out button based on suggested action</p>
                    </div>
                  </div>
                  
                  <div className="instruction-itemA">
                    <div className="step-numberA">4</div>
                    <div className="step-contentA">
                      <h3 className="step-titleA">Complete</h3>
                      <p className="step-descriptionA">Attendance will be recorded and confirmation shown</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {(verificationData || attendanceResult) && (
          <div className="reset-sectionA">
            <button
              onClick={resetForm}
              className="reset-linkA"
              disabled={loading}
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendancecomponent;

