const transporter = require("./emailConfig.js");
const { welcomeEmailTemplate, employeeWelcomeTemplate, hrWelcomeTemplate } = require("./emailTemplates.js");

// Send welcome email based on user role
const sendWelcomeEmail = async (userEmail, username, organisationName, role = 'user') => {
    try {
        let subject, template;
        
        // Select appropriate template based on role
        switch(role.toLowerCase()) {
            case 'hr':
                subject = `Welcome to ${organisationName} HR Registration Successful!`;
                template = hrWelcomeTemplate(username, organisationName);
                break;
            case 'employee':
                subject = `Welcome to ${organisationName} Employee Account Created!`;
                template = employeeWelcomeTemplate(username, organisationName);
                break;
            default:
                subject = `Welcome to ${organisationName}!`;
                template = welcomeEmailTemplate(username, organisationName);
        }

        const mailOptions = {
            from: `"${organisationName} HR System" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: subject,
            html: template
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${role}:`, userEmail);
        return result;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};

// Send employee login credentials email
const sendEmployeeCredentials = async (employeeEmail, employeeName, employeeCode, password, organisationName) => {
    try {
        const mailOptions = {
            from: `"${organisationName} HR System" <${process.env.EMAIL_USER}>`,
            to: employeeEmail,
            subject: `Your ${organisationName} Employee Account Credentials`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
            
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
    .credentials { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2c3e50; }
    .login-button { 
        display: inline-block; 
        background: #2c3e50; 
        color: white; 
        padding: 12px 24px; 
        text-decoration: none; 
        border-radius: 5px; 
        margin: 15px 0; 
    }
    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
    .org-name { color: #2c3e50; font-weight: bold; }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
        .container { 
            padding: 10px; 
            max-width: 100%;
            width: 100%;
        }
        .content { 
            padding: 20px; 
        }
        .header { 
            padding: 15px; 
        }
        .header h2 { 
            font-size: 20px; 
            margin: 10px 0; 
        }
        .login-button { 
            display: block; 
            padding: 15px; 
            text-align: center; 
            margin: 20px auto; 
            width: 100%;
            box-sizing: border-box;
        }
        ul { 
            padding-left: 20px; 
        }
        .credentials {
            margin: 20px 0;
        }
    }
    
    /* Extra small devices */
    @media only screen and (max-width: 480px) {
        .header h2 { 
            font-size: 18px; 
        }
        .content { 
            padding: 15px; 
        }
        .credentials {
            padding: 12px;
        }
    }



                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Welcome to ${organisationName}!</h2>
                            <p>Employee Account Credentials</p>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${employeeName}</strong>,</p>
                            <p>Your employee account has been successfully created in the <span class="org-name">${organisationName}</span> HR Management System.</p>
                            
                            <div class="credentials">
                                <h3>Your Login Credentials:</h3>
                                <p><strong>Employee Code:</strong> ${employeeCode}</p>
                                <p><strong>Temporary Password:</strong> ${password}</p>
                                <p><strong>Login URL:</strong> ${process.env.APP_URL || ''}</p>
                            </div>
                            
                            <p><strong>Important Security Notice:</strong></p>
                            <ul>
                                <li>This is your temporary password</li>
                                <li>Please log in immediately and change your password</li>
                                <li>Do not share your credentials with anyone</li>
                                <li>If you didn't request this account, please contact HR immediately</li>
                            </ul>
                            
                            <center>
                                <a href="${process.env.APP_URL || '#'}" class="login-button">Log In Now</a>
                            </center>
                            
                            <p>For assistance, contact the HR department.</p>
                            <p>Best regards,<br><strong>${organisationName} HR Department</strong></p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} ${organisationName}. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Employee credentials sent for ${organisationName}:`, employeeEmail);
        return result;
    } catch (error) {
        console.error('Error sending employee credentials:', error);
        throw error;
    }
};

module.exports = {
    sendWelcomeEmail,
    sendEmployeeCredentials
};