const Organisation = require("../models/Organisation");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const {sendWelcomeEmail} = require("../emailconfig/emailService");

const RegisterHr = async (req,res) => {
    try{
        const {fullname, email,password} = req.body;

        const totalUsers = await User.countDocuments();
        if(totalUsers > 0){
            return res.status(400).json({
                message:"HR already Registered",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "hr",
        });

        await newUser.save();

        try {
            const emailService = require("../emailconfig/emailService");
            await emailService.sendWelcomeEmail(
                email, 
                fullname, 
                'Smart Employee Management System (SEMS)',
                'hr'
            );
        } catch (emailError) {}

        res.status(201).json({
            message: "HR created successfully",
            user:{
                id: newUser._id,
                fullname: newUser.fullname,
                email:newUser.email,
                role:newUser.role,
            }
        });

    }catch(error){
        res.status(500).json({
            message: "Server Error"
        })
    }
}

//Login
const Login = async (req, res) => {
    try {
        const { loginId, password } = req.body;
        
        if (!loginId || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Login ID and password are required" 
            });
        }

        let user = null;
        const loginIdLower = loginId.toLowerCase();
        
        user = await User.findOne({
            $or: [
                { email: loginIdLower },
                { employeeCode: loginId }
            ]
        });

        if (!user) {
            const employee = await Employee.findOne({
                $or: [
                    { employeeCode: loginId },
                    { email: loginIdLower }
                ]
            });

            if (employee) {
                if (employee.status !== "active") {
                    return res.status(403).json({
                        success: false,
                        message: `Your employee account is ${employee.status}. Please contact HR.`
                    });
                }

                user = await User.findOne({ employee: employee._id });
                
                if (!user) {
                    let userPassword;
                    
                    if (employee.password && employee.password.startsWith('$2')) {
                        userPassword = employee.password;
                    } else {
                        userPassword = await bcrypt.hash(employee.employeeCode, 10);
                    }

                    user = new User({
                        fullname: `${employee.firstname} ${employee.lastname}`,
                        email: employee.email ? employee.email.toLowerCase() : null,
                        password: userPassword,
                        employee: employee._id,
                        employeeCode: employee.employeeCode,
                        role: employee.role || 'employee',
                        organisation: employee.organisation,
                        status: 'active'
                    });

                    await user.save();
                    
                    employee.userId = user._id;
                    await employee.save();
                }
            }
        }

        if (!user) {
            const isEmail = loginId.includes('@');
            const isEmployeeCode = /^[A-Z0-9]+$/i.test(loginId);
            
            let errorMessage = "Account not found. ";
            
            if (isEmail) {
                errorMessage += `No account found with email: ${loginId}`;
            } else if (isEmployeeCode) {
                errorMessage += `No account found with employee code: ${loginId}`;
            } else {
                errorMessage += `Please check your login ID and try again.`;
            }
            
            return res.status(404).json({
                success: false,
                message: errorMessage
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: `Your user account is ${user.status}. Please contact administrator.`
            });
        }

        let isPasswordValid = false;
        
        isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid && user.employee) {
            const employee = await Employee.findById(user.employee).select('password');
            
            if (employee && employee.password && employee.password.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(password, employee.password);
                
                if (isPasswordValid) {
                    user.password = employee.password;
                    await user.save();
                }
            }
        }

        if (!isPasswordValid) {
            let guidance = "";
            
            if (!user.email && user.employeeCode === loginId) {
                guidance = " For employee code login, please use your employee code as password.";
            } else if (user.email && user.email.toLowerCase() === loginIdLower) {
                guidance = " Please check your email password.";
            }
            
            return res.status(400).json({
                success: false,
                message: `Invalid password`
            });
        }

        if (user.employee && !user.employeeCode) {
            const employee = await Employee.findById(user.employee);
            if (employee) {
                user.employeeCode = employee.employeeCode;
                await user.save();
            }
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                employeeId: user.employee,
                email: user.email
            },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );

        sendLoginNotificationToHR(user, req).catch(error => {
            console.error('Login notification failed:', error);
        });

        sendWelcomeBackEmail(user).catch(error => {
            console.error('Welcome email failed:', error);
        });

        const responseUser = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            employeeCode: user.employeeCode || null,
            employeeId: user.employee || null
        };

        if (user.employee) {
            try {
                const employee = await Employee.findById(user.employee)
                    .select('firstname lastname photo department organisation jobTitle')
                    .populate('department', 'name')
                    .populate('organisation', 'name');
                
                if (employee) {
                    responseUser.employeeDetails = {
                        firstname: employee.firstname,
                        lastname: employee.lastname,
                        fullname: `${employee.firstname} ${employee.lastname}`,
                        photo: extractPhotoUrl(employee.photo),
                        department: employee.department?.name,
                        organisation: employee.organisation?.name,
                        jobTitle: employee.jobTitle
                    };
                }
            } catch (populateError) {
            }
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: responseUser
        });

    } catch (error) {
        console.error('Login error:', error);

        if (error.code === 11000) {
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { email: loginId?.toLowerCase() },
                        { employeeCode: loginId }
                    ]
                });

                if (existingUser) {
                    const isMatch = await bcrypt.compare(password, existingUser.password);
                    if (isMatch) {
                        const token = jwt.sign(
                            { id: existingUser._id, role: existingUser.role },
                            process.env.JWT_SECRET || 'secretkey',
                            { expiresIn: '7d' }
                        );

                        return res.status(200).json({
                            success: true,
                            message: "Login successful",
                            token,
                            user: {
                                id: existingUser._id,
                                fullname: existingUser.fullname,
                                email: existingUser.email,
                                role: existingUser.role,
                                employeeCode: existingUser.employeeCode || null
                            }
                        });
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: `Incorrect password for account ${existingUser.email || existingUser.employeeCode}`
                        });
                    }
                }

                return res.status(409).json({
                    success: false,
                    message: "Account conflict detected. Please contact support for assistance."
                });
            } catch (recoveryError) {
                // Continue to generic error
            }
        }

        res.status(500).json({
            success: false,
            message: "Server error during login",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const sendLoginNotificationToHR = async (user, req) => {
    try {
        const hrUsers = await User.find({ role: 'hr' }).select('email fullname');
        
        if (hrUsers.length === 0) {
            return;
        }

        let employeeDetails = {};
        if (user.employee) {
            const employee = await Employee.findById(user.employee)
                .populate('department', 'name code')
                .populate('organisation', 'name');
            
            if (employee) {
                employeeDetails = {
                    employeeCode: employee.employeeCode,
                    department: employee.department?.name || 'N/A',
                    organisation: employee.organisation?.name || 'N/A',
                    jobTitle: employee.jobTitle || 'N/A'
                };
            }
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const loginTime = new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });

        const transporter = require("../emailconfig/emailConfig");

        const loginNotificationTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background: #f5f5f5;
        margin: 0;
        padding: 20px;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
    }
    .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
    }
    .header .subtitle {
        margin-top: 10px;
        opacity: 0.9;
        font-size: 14px;
    }
    .content {
        padding: 30px;
    }
    .alert-box {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-left: 4px solid #f39c12;
        padding: 15px;
        margin: 20px 0;
        border-radius: 5px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .alert-box .icon {
        font-size: 24px;
    }
    .login-details {
        background: #f8f9fa;
        padding: 25px;
        border-radius: 8px;
        margin: 25px 0;
    }
    .detail-row {
        display: flex;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e9ecef;
    }
    .detail-row:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    .detail-label {
        font-weight: 600;
        color: #2c3e50;
        min-width: 150px;
    }
    .detail-value {
        color: #495057;
        flex: 1;
    }
    .role-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .role-hr {
        background: #dc3545;
        color: white;
    }
    .role-employee {
        background: #28a745;
        color: white;
    }
    .role-admin {
        background: #6f42c1;
        color: white;
    }
    .footer {
        text-align: center;
        padding: 25px;
        background: #f8f9fa;
        color: #6c757d;
        font-size: 13px;
        border-top: 1px solid #dee2e6;
    }
    .security-note {
        background: #e7f3ff;
        border: 1px solid #b3d7ff;
        padding: 15px;
        border-radius: 5px;
        margin-top: 20px;
        font-size: 13px;
    }
    .timestamp {
        color: #6c757d;
        font-size: 12px;
        text-align: right;
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px dashed #dee2e6;
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
        body {
            padding: 10px;
            background: #f5f5f5;
        }
        .container {
            max-width: 100%;
            border-radius: 8px;
            margin: 0 auto;
        }
        .header {
            padding: 25px 15px;
        }
        .header h1 {
            font-size: 20px;
        }
        .header .subtitle {
            font-size: 13px;
            margin-top: 8px;
        }
        .content {
            padding: 20px;
        }
        .alert-box {
            padding: 12px;
            margin: 15px 0;
            display: block;
        }
        .alert-box .icon {
            display: none;
        }
        .login-details {
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: block;
            margin-bottom: 15px;
            padding-bottom: 15px;
        }
        .detail-label {
            min-width: auto;
            margin-bottom: 5px;
            display: block;
        }
        .detail-value {
            display: block;
        }
        .role-badge {
            padding: 4px 10px;
            font-size: 11px;
        }
        .security-note {
            padding: 12px;
            margin-top: 15px;
        }
        .security-note ul {
            padding-left: 20px;
            margin: 8px 0;
        }
        .timestamp {
            text-align: center;
            font-size: 11px;
            margin-top: 15px;
            padding-top: 10px;
        }
        .footer {
            padding: 20px 15px;
            font-size: 12px;
        }
    }

    /* Extra small devices */
    @media only screen and (max-width: 480px) {
        .header {
            padding: 20px 12px;
        }
        .header h1 {
            font-size: 18px;
        }
        .content {
            padding: 15px;
        }
        .login-details {
            padding: 15px;
        }
        .detail-row {
            margin-bottom: 12px;
            padding-bottom: 12px;
        }
        .footer {
            padding: 15px 12px;
            font-size: 11px;
        }
    }
</style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>System Login Notification</h1>
                        <div class="subtitle">Smart Employee Management System (SEMS) Security Alert</div>
                    </div>
                    
                    <div class="content">
                        <div class="alert-box">
                            <div class="icon"></div>
                            <div>
                                <strong>Security Notice:</strong> A user has successfully logged into Smart Employee Management System (SEMS).
                            </div>
                        </div>
                        
                        <h3>Login Details</h3>
                        <div class="login-details">
                            <div class="detail-row">
                                <div class="detail-label">User Name:</div>
                                <div class="detail-value">${user.fullname}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Email Address:</div>
                                <div class="detail-value">${user.email}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">User Role:</div>
                                <div class="detail-value">
                                    <span class="role-badge role-${user.role}">
                                        ${user.role.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            ${employeeDetails.employeeCode ? `
                            <div class="detail-row">
                                <div class="detail-label">Employee Code:</div>
                                <div class="detail-value">${employeeDetails.employeeCode}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Department:</div>
                                <div class="detail-value">${employeeDetails.department}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Job Title:</div>
                                <div class="detail-value">${employeeDetails.jobTitle}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Organization:</div>
                                <div class="detail-value">${employeeDetails.organisation}</div>
                            </div>
                            ` : ''}
                            
                            <div class="detail-row">
                                <div class="detail-label">Login Time:</div>
                                <div class="detail-value">${loginTime}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">IP Address:</div>
                                <div class="detail-value">${ipAddress}</div>
                            </div>
                            <div class="detail-row">
                                <div class="detail-label">Device/Browser:</div>
                                <div class="detail-value">${userAgent.substring(0, 100)}</div>
                            </div>
                        </div>
                        
                        <div class="security-note">
                            <strong>Action Items for HR:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Verify this login was expected</li>
                                <li>Review user's recent system activity</li>
                                <li>Check for any unusual access patterns</li>
                                <li>Contact user if login appears suspicious</li>
                            </ul>
                        </div>
                        
                        <div class="timestamp">
                            Notification generated: ${new Date().toISOString()}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated security notification from the Smart Employee Management System (SEMS).</p>
                        <p>&copy; ${new Date().getFullYear()} SEMS. All rights reserved.</p>
                        <p><em>Please do not reply to this email. Contact system administrator if needed.</em></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        for (const hrUser of hrUsers) {
            try {
                const mailOptions = {
                    from: `"SEMS Security" <${process.env.EMAIL_USER}>`,
                    to: hrUser.email,
                    subject: `Login Alert: ${user.fullname} logged into SEMS`,
                    html: loginNotificationTemplate
                };

                await transporter.sendMail(mailOptions);
            } catch (hrEmailError) {}
        }

        if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL !== process.env.EMAIL_USER) {
            try {
                const mailOptions = {
                    from: `"SEMS Security" <${process.env.EMAIL_USER}>`,
                    to: process.env.ADMIN_EMAIL,
                    subject: `Login Alert: ${user.fullname} logged into SEMS`,
                    html: loginNotificationTemplate
                };

                await transporter.sendMail(mailOptions);
            } catch (adminEmailError) {}
        }

    } catch (error) {}
};

const sendWelcomeBackEmail = async (user) => {
    try {
        const transporter = require("../emailconfig/emailConfig");
        const loginTime = new Date().toLocaleString();

        const mailOptions = {
            from: `"SEMS" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Welcome back to SEMS, ${user.fullname.split(' ')[0]}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <style>
    body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        background: #f5f5f5;
        margin: 0;
        padding: 20px;
    }
    .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header { 
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
        color: white; 
        padding: 30px 20px; 
        text-align: center; 
    }
    .header h2 {
        margin: 0;
        font-size: 24px;
    }
    .content { 
        padding: 30px; 
    }
    .footer { 
        text-align: center; 
        padding: 20px; 
        background: #f8f9fa; 
        color: #6c757d; 
        font-size: 13px;
        border-top: 1px solid #dee2e6;
    }
    .login-info {
        background: #e8f5e9;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        border-left: 4px solid #28a745;
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
        body {
            padding: 10px;
            background: #f5f5f5;
        }
        .container {
            max-width: 100%;
            border-radius: 8px;
            margin: 0 auto;
        }
        .header {
            padding: 25px 15px;
        }
        .header h2 {
            font-size: 20px;
        }
        .header p {
            font-size: 14px;
            margin-top: 8px;
        }
        .content {
            padding: 20px;
        }
        .login-info {
            padding: 15px 12px;
            margin: 15px 0;
        }
        ul {
            padding-left: 20px;
            margin: 15px 0;
        }
        li {
            margin-bottom: 8px;
        }
        .footer {
            padding: 15px;
            font-size: 12px;
        }
    }

    /* Extra small devices */
    @media only screen and (max-width: 480px) {
        .header {
            padding: 20px 12px;
        }
        .header h2 {
            font-size: 18px;
        }
        .content {
            padding: 15px;
        }
        .login-info p {
            margin: 10px 0;
        }
        ul {
            padding-left: 18px;
        }
        li {
            font-size: 14px;
        }
        .footer {
            padding: 12px;
            font-size: 11px;
        }
    }
</style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Welcome Back!</h2>
                            <p>Smart Employee Management System</p>
                        </div>
                        
                        <div class="content">
                            <p>Hi ${user.fullname},</p>
                            
                            <div class="login-info">
                                <p><strong>Login Time:</strong> ${loginTime}</p>
                                <p><strong>Account:</strong> ${user.email}</p>
                                <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                            </div>
                            
                            <p><strong>Security Notice:</strong></p>
                            <ul>
                                <li>If this was you, no action is needed</li>
                                <li>If this wasn't you, please contact HR immediately</li>
                                <li>Change your password if you suspect unauthorized access</li>
                                <li>Always log out when using shared devices</li>
                            </ul>
                            
                            <p>Stay secure and productive!</p>
                            
                            <p>Best regards,<br>
                            <strong>The SEMS Team</strong></p>
                        </div>
                        
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Smart Employee Management System (SEMS)</p>
                            <p><em>This is an automated message. Please do not reply.</em></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {}
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .populate({
        path: 'employee',
        model: 'Employee',
        select: 'employeeCode firstname lastname gender dateOfBirth phone email address photo role organisation department jobTitle employmentType hireDate salaryBase status',
        populate: [
          {
            path: 'organisation',
            select: 'name address phone email'
          },
          {
            path: 'department',
            select: 'name code description'
          }
        ]
      })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .populate({
        path: 'employee',
        model: 'Employee',
        select: '-password',
        populate: [
          {
            path: 'organisation',
            select: 'name address phone email'
          },
          {
            path: 'department',
            select: 'name code description'
          }
        ]
      })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate({
        path: 'employee',
        model: 'Employee',
        select: '-password',
        populate: [
          {
            path: 'organisation',
            select: 'name address phone email website'
          },
          {
            path: 'department',
            select: 'name code description manager'
          }
        ]
      })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (updateData.currentPassword && updateData.newPassword) {
      const userWithPassword = await User.findById(id).select('+password');
      const isPasswordValid = await bcrypt.compare(updateData.currentPassword, userWithPassword.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      if (updateData.currentPassword === updateData.newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }
      
      if (updateData.newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      
      const hashedPassword = await bcrypt.hash(updateData.newPassword, 10);
      
      updateData.password = hashedPassword;
      updateData.passwordChanged = true;
      updateData.passwordChangedAt = new Date();
      
      delete updateData.currentPassword;
      delete updateData.newPassword;
    } else {
      delete updateData.password;
      delete updateData.passwordChanged;
      delete updateData.passwordChangedAt;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'employee',
      model: 'Employee',
      select: '-password',
      populate: [
        {
          path: 'organisation',
          select: 'name'
        },
        {
          path: 'department',
          select: 'name code'
        }
      ]
    })
    .select('-password');
    
    if (updateData.email && updatedUser.employee) {
      await Employee.findByIdAndUpdate(
        updatedUser.employee._id,
        { $set: { email: updateData.email.toLowerCase() } },
        { new: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: updateData.password ? 'Password changed successfully' : 'User updated successfully',
      data: updatedUser
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    await User.findByIdAndDelete(id);
    
    if (user.employee) {
      await Employee.findByIdAndUpdate(
        user.employee,
        { $set: { status: 'inactive' } },
        { new: true }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

const getUsersByEmployeeName = async (req, res) => {
  try {
    const { name } = req.params;
    
    const employees = await Employee.find({
      $or: [
        { firstname: { $regex: name, $options: 'i' } },
        { lastname: { $regex: name, $options: 'i' } },
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstname", " ", "$lastname"] },
              regex: name,
              options: "i"
            }
          }
        }
      ]
    }).select('_id');
    
    const employeeIds = employees.map(emp => emp._id);
    
    const users = await User.find({ employee: { $in: employeeIds } })
      .populate({
        path: 'employee',
        model: 'Employee',
        select: 'employeeCode firstname lastname email phone department position',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .select('-password')
      .sort({ fullname: 1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
};

const getUsersByEmployeeRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const employees = await Employee.find({ role })
      .select('_id');
    
    const employeeIds = employees.map(emp => emp._id);
    
    const users = await User.find({ employee: { $in: employeeIds } })
      .populate({
        path: 'employee',
        model: 'Employee',
        select: 'employeeCode firstname lastname email phone department position role',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .select('-password')
      .sort({ fullname: 1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users by role'
    });
  }
};

const getUserByEmployeeCode = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    
    const employee = await Employee.findOne({ employeeCode });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const user = await User.findOne({ employee: employee._id })
      .populate({
        path: 'employee',
        model: 'Employee',
        select: '-password',
        populate: [
          {
            path: 'organisation',
            select: 'name address phone email'
          },
          {
            path: 'department',
            select: 'name code description'
          }
        ]
      })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this employee'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

module.exports = {
    RegisterHr,
    Login,
    getAllUsers,
    getSingleUser,
    getMyProfile,
    updateUser,
    deleteUser,
    getUsersByEmployeeName,
    getUsersByEmployeeRole,
    getUserByEmployeeCode
};