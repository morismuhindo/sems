
const fs = require("fs");
const path = require("path");

// Read logo file and convert to base64 data URL
const logoPath = path.join(__dirname, "sems.png");
const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
const logoDataUrl = `data:image/png;base64,${logoBase64}`;

// Organization admin welcome email template
const welcomeEmailTemplate = (username, organisationName, logoUrl = null) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        padding: 20px;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
    }
    ${logoUrl ? `.logo {
        max-width: 150px;
        margin-bottom: 20px;
    }` : ''}
    .header h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
    }
    .org-name {
        font-weight: 700;
        color: #fff;
    }
    .content {
        padding: 40px;
    }
    .content h2{
        color: #764ba2;
        margin-top: 0;
    }
    .features {
        background: #f8f9fa;
        padding: 25px;
        border-radius: 10px;
        margin: 25px 0;
    }
    .features ul {
        list-style: none;
        padding: 0;
    }
    .features li {
        padding: 8px 0;
        display: flex;
        align-items: center;
    }
    .features li:before {
        content: "✓";
        color: #764ba2;
        font-weight: bold;
        margin-right: 10px;
    }
    .button {
        display: inline-block;
        padding: 15px 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-decoration: none;
        border-radius: 50px;
        margin: 20px 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: transform 0.3s;
    }
    .button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(118, 75, 162, 0.3);
    }
    .footer {
        text-align: center;
        padding: 30px;
        background: #f8f9fa;
        color: #666;
        font-size: 14px;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
        body {
            padding: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            border-radius: 10px;
        }
        .header {
            padding: 30px 15px;
        }
        .header h1 {
            font-size: 24px;
            line-height: 1.3;
        }
        ${logoUrl ? `.logo {
            max-width: 120px;
            margin-bottom: 15px;
        }` : ''}
        .content {
            padding: 25px;
        }
        .content h2 {
            font-size: 20px;
        }
        .features {
            padding: 20px;
            margin: 20px 0;
        }
        .features li {
            padding: 6px 0;
            font-size: 14px;
        }
        .button {
            display: block;
            padding: 14px 20px;
            text-align: center;
            margin: 20px auto;
            width: 100%;
            box-sizing: border-box;
        }
        .footer {
            padding: 20px;
            font-size: 13px;
        }
    }
    
    /* Extra small devices */
    @media only screen and (max-width: 480px) {
        .header h1 {
            font-size: 20px;
        }
        .content {
            padding: 20px;
        }
        .content h2 {
            font-size: 18px;
        }
        .features {
            padding: 15px;
        }
        .footer {
            padding: 15px;
            font-size: 12px;
        }
        ${logoUrl ? `.logo {
            max-width: 100px;
        }` : ''}
    }
</style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${organisationName} Logo" class="logo">` : ''}
                    <h1>Welcome to <span class="org-name">Smart Employee Management System (SEMS)</span></h1>
                    <p>HR Management System</p>
                </div>
                
                <div class="content">
                    <h2>Hello ${username},</h2>
                    
                    <p>We thank your Company ${organisationName} for chosing Smart Employee Management System (SEMS) for managing their employee data, departments, and organizational structure.</p>
                    
                    <div class="features">
                        <h3>Key Features:</h3>
                        <ul>
                            <li>Comprehensive Employee Management</li>
                            <li>Department & Organizational Structure</li>
                            <li>Real-time Analytics & Reports</li>
                            <li>Secure Access Control</li>
                            <li>Performance Tracking</li>
                            <li>Leave & Attendance Management</li>
                        </ul>
                    </div>
                    
                    
                    <p>Best regards,<br>
                    <strong>The SEM Team</strong></p>
                </div>
                
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Smart Employee Management System (SEMS). All rights reserved.</p>
                    <p>This email was sent to you as a registered user of ${organisationName} HR Management System.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// HR administrator welcome email template
const hrWelcomeTemplate = (username, organisationName, logoUrl = null) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .header {
                    background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
                    color: white;
                    padding: 40px 20px;
                    text-align: center;
                }
                ${logoUrl ? `.logo {
                    max-width: 150px;
                    margin-bottom: 20px;
                }` : ''}
                .header h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                }
                .content {
                    padding: 40px;
                }
                .badge {
                    background: #4a6491;
                    color: white;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-size: 14px;
                    display: inline-block;
                    margin-bottom: 20px;
                    font-weight: bold;
                }
                .org-name {
                    color: #000;
                    font-weight: 700;
                }
                .admin-features {
                    background: #f0f4f8;
                    padding: 25px;
                    border-radius: 10px;
                    margin: 25px 0;
                }
                .admin-features h3 {
                    color: #2c3e50;
                }
                .footer {
                    text-align: center;
                    padding: 30px;
                    background: #f8f9fa;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    ${logoUrl ? `<img src="${logoUrl}" alt="${organisationName} Logo" class="logo">` : ''}
                    <h1>Welcome to <span class="org-name">${organisationName}</span></h1>
                    <p>HR Administrator Registration</p>
                </div>
                
                <div class="content">
                    <div class="badge">HR Administrator</div>
                    <h2>Dear ${username},</h2>
                    
                    <p>Congratulations! You have been successfully registered as the <strong>HR Administrator</strong> for <span class="org-name">${organisationName}</span>.</p>
                    
                    <div class="admin-features">
                        <h3>Your Administrative Privileges:</h3>
                        <ul>
                            <li>Full System Access & Control for ${organisationName}</li>
                            <li>Create & Manage Employee Profiles</li>
                            <li>Department Structure Management</li>
                            <li>Generate Organizational Reports</li>
                            <li>User Permissions & Access Control</li>
                            <li>System Configuration Settings</li>
                        </ul>
                    </div>
                    
                    <p><strong>Important:</strong> As the HR Administrator for ${organisationName}, you have complete access to all system features. Please ensure you follow security best practices.</p>
                    
                    <p>To get started, log in to the system and set up your organization's structure.</p>
                    
                    <p>Best regards,<br>
                    <strong>${organisationName} System Administration</strong></p>
                </div>
                
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} ${organisationName}</p>
                    <p><em>Confidential - For HR Administrators Only</em></p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Employee welcome email template
const employeeWelcomeTemplate = (username, organisationName, employeeCode = null, logoUrl = null) => {
    return `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${organisationName}</title>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        /* Container */
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        /* Header Banner */
        .header-banner {
            background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%);
            padding: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header-banner::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255,255,255,0.1);
            transform: rotate(45deg);
        }
        
        /* Logo Styling */
        ${logoUrl ? `
        .logo-container {
            position: relative;
            z-index: 2;
            margin-bottom: 15px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        ` : ''}
        
        /* Header Content */
        .header-content {
            position: relative;
            z-index: 2;
            color: white;
        }
        
        .header-content h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            margin-bottom: 10px;
        }
        
        .header-content p {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 300;
        }
        
        .org-name {
            font-weight: 700;
            color: org-name;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Main Content */
        .content {
            padding: 40px;
        }
        
        /* Greeting */
        .greeting h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        /* Welcome Message */
        .welcome-message {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        
        .welcome-message p {
            margin-bottom: 15px;
        }
        
        /* Employee ID Card */
        .employee-id {
            background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            text-align: center;
            border-left: 5px solid #2ecc71;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .employee-id h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 20px;
        }
        
        .employee-code {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            letter-spacing: 2px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            display: inline-block;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Next Steps */
        .next-steps {
            background: #f9f9f9;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
            border: 1px solid #e0e0e0;
        }
        
        .next-steps h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .next-steps ol {
            padding-left: 20px;
        }
        
        .next-steps li {
            margin-bottom: 10px;
            color: #555;
        }
        
        /* Final Content */
        .final-content {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
        }
        
        .final-content p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #666;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        /* Responsive Design */
        @media (max-width: 640px) {
            body {
                padding: 10px;
            }
            
            .content {
                padding: 25px;
            }
            
            .header-content h1 {
                font-size: 24px;
            }
            
            .header-content p {
                font-size: 14px;
            }
            
            .greeting h2 {
                font-size: 20px;
            }
            
            .welcome-message {
                font-size: 16px;
            }
            
            .employee-code {
                font-size: 20px;
                padding: 10px;
            }
            
            .employee-id,
            .next-steps {
                padding: 20px;
                margin: 20px 0;
            }
            
            ${logoUrl ? `
            .logo {
                max-width: 120px;
            }
            ` : ''}
        }
        
        @media (max-width: 480px) {
            .header-content h1 {
                font-size: 20px;
            }
            
            .content {
                padding: 20px;
            }
            
            .employee-code {
                font-size: 18px;
                letter-spacing: 1px;
            }
            
            .footer {
                padding: 20px;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white !important;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .header-banner {
                background: #3498db !important;
                -webkit-print-color-adjust: exact;
            }
            
            .employee-id {
                background: #e8f5e9 !important;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Banner -->
        <div class="header-banner">
            ${logoUrl ? `
            <div class="logo-container">
                <img src="${logoUrl}" alt="${organisationName} Logo" class="logo">
            </div>
            ` : ''}
            
            <div class="header-content">
                <h1>Welcome to <span class="org-name">${organisationName}</span>!</h1>
                <p>Official Employee Onboarding</p>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
            <!-- Greeting -->
            <div class="greeting">
                <h2>Dear ${username},</h2>
            </div>
            
            <!-- Welcome Message -->
            <div class="welcome-message">
                <p>On behalf of the entire team at ${organisationName}, we are thrilled to welcome you aboard!</p>
                <p>We're excited about the skills and experience you bring to our organization and look forward to the contributions you'll make.</p>
            </div>
            
            <!-- Employee ID Card -->
            ${employeeCode ? `
            <div class="employee-id">
                <h3>Your Employee Identification</h3>
                <p class="employee-code">${employeeCode}</p>
                <p>Use this code for system access and identification</p>
            </div>
            ` : ''}
            
            <!-- Next Steps -->
            <div class="next-steps">
                <h3>Next Steps:</h3>
                <ol>
                    <li>Complete your profile information in the employee portal</li>
                    <li>Review ${organisationName} policies and guidelines</li>
                    <li>Connect with your team members and department head</li>
                    <li>Attend the new employee orientation (details to follow)</li>
                    <li>Set up your work preferences and systems</li>
                </ol>
            </div>
            
            <!-- Final Content -->
            <div class="final-content">
                <p>Please log in to the ${organisationName} employee portal to access your dashboard and complete the onboarding process.</p>
                
                <p>If you have any questions or need assistance, please contact the HR department.</p>
                
                <p>Once again, welcome to ${organisationName}!<br>
                <strong>The ${organisationName} HR Department</strong></p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${organisationName}</p>
            <p>Human Resources Department</p>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = {
    welcomeEmailTemplate,
    hrWelcomeTemplate,
    employeeWelcomeTemplate
};