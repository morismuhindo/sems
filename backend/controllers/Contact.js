const { semsTransporter } = require('../emailconfig/semsconfig');

// Submit contact form
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message, phone } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, subject, and message are required'
            });
        }

        // Email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Check if SEMS email is configured
        const semsEmail = process.env.SEMS_USER || process.env.SEMS_EMAIL || process.env.EMAIL_USER;
        if (!semsEmail) {
            return res.status(500).json({
                success: false,
                message: 'Email system is not properly configured'
            });
        }

        // Create reference ID
        const referenceId = `SEMS-${Date.now().toString().slice(-8)}`;

        // Send email to SEMS
        const semsMailOptions = {
            from: `"SEMS Contact Form" <${semsEmail}>`,
            to: semsEmail,
            replyTo: email,
            subject: `Contact Form: ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media only screen and (max-width: 600px) {
                            .container {
                                width: 100% !important;
                                padding: 10px !important;
                            }
                            .header {
                                padding: 15px 10px !important;
                            }
                            .content {
                                padding: 15px !important;
                            }
                            .info-table {
                                font-size: 14px !important;
                            }
                            .action-buttons {
                                flex-direction: column !important;
                                gap: 10px !important;
                            }
                            .action-buttons a {
                                width: 100% !important;
                                text-align: center !important;
                            }
                            .timestamp {
                                margin-top: 10px !important;
                                text-align: center !important;
                                width: 100% !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white;">
                        <!-- Header -->
                        <div class="header" style="background-color: #2563eb; color: white; padding: 25px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">SEMS Contact Form</h1>
                            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">New Inquiry Received</p>
                        </div>
                        
                        <!-- Content -->
                        <div class="content" style="padding: 30px;">
                            <div style="margin-bottom: 25px;">
                                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                                    Contact Information
                                </h2>
                                
                                <table class="info-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 35%; color: #64748b; font-weight: 600;">Name</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Email</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <a href="mailto:${email}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${email}</a>
                                        </td>
                                    </tr>
                                    ${phone ? `
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Phone</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                            <a href="tel:${phone}" style="color: #059669; text-decoration: none; font-weight: 500;">${phone}</a>
                                        </td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Subject</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${subject}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Reference ID</td>
                                        <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">${referenceId}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="margin-bottom: 25px;">
                                <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 18px;">Message</h3>
                                <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; border-radius: 4px;">
                                    <p style="margin: 0; line-height: 1.6; color: #334155; white-space: pre-wrap; font-size: 15px;">
                                        ${message}
                                    </p>
                                </div>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px dashed #cbd5e1;">
                                <div class="action-buttons" style="display: flex; gap: 15px; flex-wrap: wrap;">
                                    <a href="mailto:${email}" 
                                       style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 14px;">
                                        Reply to ${name.split(' ')[0]}
                                    </a>
                                    ${phone ? `
                                    <a href="tel:${phone}" 
                                       style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 14px;">
                                        Call ${name.split(' ')[0]}
                                    </a>
                                    ` : ''}
                                    <span class="timestamp" style="margin-left: auto; color: #94a3b8; font-size: 13px; align-self: center;">
                                        ${new Date().toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #1e293b; padding: 20px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                                This message was submitted via the SEMS website contact form.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
SEMS CONTACT FORM SUBMISSION
============================

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}
Reference ID: ${referenceId}

Message:
${message}

---
Submitted via SEMS website contact form on ${new Date().toLocaleString()}
Reply to: ${email}
            `
        };

        // Send confirmation email to user
        const userMailOptions = {
            from: `"SEMS Support" <${semsEmail}>`,
            to: email,
            subject: 'Thank you for contacting SEMS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @media only screen and (max-width: 600px) {
                            .container {
                                width: 100% !important;
                                padding: 0 !important;
                            }
                            .header {
                                padding: 20px 15px !important;
                            }
                            .content {
                                padding: 20px 15px !important;
                            }
                            .details-grid {
                                grid-template-columns: 1fr !important;
                                gap: 10px !important;
                            }
                            .summary-box {
                                padding: 15px !important;
                            }
                            .next-steps {
                                padding: 15px !important;
                            }
                            .footer {
                                padding: 15px !important;
                                font-size: 11px !important;
                            }
                        }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white;">
                        <!-- Header -->
                        <div class="header" style="background: linear-gradient(135deg, #1e293b, #2563eb); color: white; padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">SEMS</h1>
                            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Smart Employee Management System</p>
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                                <h2 style="margin: 0; font-size: 22px; font-weight: 600;">Message Received</h2>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="content" style="padding: 30px;">
                            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                                Dear <strong style="color: #1e293b;">${name}</strong>,
                            </p>
                            
                            <p style="font-size: 16px; color: #334155; line-height: 1.6; margin: 0 0 25px 0;">
                                Thank you for reaching out to SEMS (Smart Employee Management System). We have successfully received your inquiry and our team will review it shortly.
                            </p>
                            
                            <div class="summary-box" style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 0 0 25px 0; border-left: 4px solid #2563eb;">
                                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600;">Your Inquiry Details</h3>
                                
                                <div class="details-grid" style="display: grid; grid-template-columns: auto 1fr; gap: 12px 20px; margin-bottom: 20px;">
                                    <div style="color: #64748b; font-weight: 500;">Reference ID</div>
                                    <div style="color: #1e293b; font-weight: 600;">${referenceId}</div>
                                    
                                    <div style="color: #64748b; font-weight: 500;">Subject</div>
                                    <div style="color: #1e293b; font-weight: 500;">${subject}</div>
                                    
                                    <div style="color: #64748b; font-weight: 500;">Submitted</div>
                                    <div style="color: #1e293b;">
                                        ${new Date().toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                
                                <div style="margin-top: 20px;">
                                    <div style="color: #64748b; font-weight: 500; margin-bottom: 8px;">Message Preview</div>
                                    <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155; line-height: 1.5;">
                                        ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="next-steps" style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 0 0 25px 0; border: 1px solid #dbeafe;">
                                <h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px; font-weight: 600;">What to Expect Next</h4>
                                <ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6;">
                                    <li>Our team will review your inquiry within <strong>24-48 hours</strong></li>
                                    <li>You will receive a response at <strong>${email}</strong></li>
                                    <li>For urgent matters, you can email us directly</li>
                                </ul>
                            </div>
                            
                            <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
                                <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; font-weight: 600;">Best Regards,</p>
                                <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 700;">The SEMS Team</p>
                                <p style="margin: 8px 0 0 0;">
                                    <a href="mailto:${semsEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${semsEmail}</a>
                                </p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer" style="background-color: #1e293b; padding: 20px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                                This is an automated confirmation message. Please do not reply to this email.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Copyright ${new Date().getFullYear()} SEMS - Smart Employee Management System. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Dear ${name},

Thank you for contacting SEMS (Smart Employee Management System).

We have successfully received your inquiry and our team will review it shortly.

INQUIRY DETAILS:
- Reference ID: ${referenceId}
- Subject: ${subject}
- Submitted: ${new Date().toLocaleString()}

WHAT TO EXPECT:
- Our team typically responds within 24-48 hours
- You will receive a response at ${email}
- For urgent matters, email us directly at ${semsEmail}

Best regards,
The SEMS Team
${semsEmail}

This is an automated confirmation. Please do not reply to this email.
Copyright ${new Date().getFullYear()} SEMS - Smart Employee Management System. All rights reserved.
            `
        };

        // Send both emails using SEMS transporter
        const [semsEmailResult, userEmailResult] = await Promise.allSettled([
            semsTransporter.sendMail(semsMailOptions),
            semsTransporter.sendMail(userMailOptions)
        ]);

        // Check if emails were sent successfully
        if (semsEmailResult.status === 'rejected') {
            console.error('Failed to send email to SEMS:', semsEmailResult.reason);
        }
        
        if (userEmailResult.status === 'rejected') {
            console.error('Failed to send confirmation email to user:', userEmailResult.reason);
        }

        // If both emails failed
        if (semsEmailResult.status === 'rejected' && userEmailResult.status === 'rejected') {
            return res.status(500).json({
                success: false,
                message: 'Failed to send your message. Please try again later.'
            });
        }

        // Return success
        return res.status(200).json({
            success: true,
            message: 'Thank you for contacting SEMS. We have received your message and will respond shortly.',
            data: {
                referenceId,
                name,
                email,
                subject,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Simple test endpoint
exports.testEmail = async (req, res) => {
    try {
        const semsEmail = process.env.SEMS_USER || process.env.SEMS_EMAIL || process.env.EMAIL_USER;
        
        const testMailOptions = {
            from: semsEmail,
            to: semsEmail,
            subject: 'SEMS Contact System Test',
            text: 'This is a test email from SEMS contact system.',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1e293b; text-align: center;">SEMS Contact System Test</h2>
                    <p style="color: #334155; text-align: center;">
                        This email confirms that your SEMS contact system is working properly.
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center;">
                        <p style="margin: 0; color: #059669; font-weight: bold;">
                            System Status: Operational
                        </p>
                        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
                            Test completed at ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            `
        };

        await semsTransporter.sendMail(testMailOptions);
        
        return res.status(200).json({
            success: true,
            message: `Test email sent successfully to ${semsEmail}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
};