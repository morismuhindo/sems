const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require("../emailconfig/emailConfig");

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return same response for security (even if user doesn't exist or inactive)
        if (!user || user.status !== 'active') {
            return res.status(200).json({
                success: true,
                message: "If your email is registered, you will receive a reset link."
            });
        }

        // Generate shorter token (works better with plain token storage)
        const resetToken = Math.random().toString(36).substring(2, 15);
        
        // Store plain token (no hashing to avoid comparison issues)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await user.save();


        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: `"SEMS Support" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request - Smart Employee Management System (SEMS)',
            html: `
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
                            padding: 30px; 
                            text-align: center; 
                        }
                        .header h2 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content { 
                            padding: 30px; 
                        }
                        .button { 
                            display: inline-block; 
                            background: #28a745; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { 
                            text-align: center; 
                            padding: 20px; 
                            background: #f8f9fa; 
                            color: #6c757d; 
                            font-size: 13px;
                            border-top: 1px solid #dee2e6;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Password Reset Request</h2>
                            <p>Smart Employee Management System (SEMS)</p>
                        </div>
                        <div class="content">
                            <p>Hi ${user.fullname},</p>
                            <p>You requested to reset your password for your SEMS account. Click below to reset it:</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            
                            <p>Or copy this link:</p>
                            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
                            
                            <p><strong>This link expires in 15 minutes.</strong></p>
                            <p>If you didn't request this, please ignore this email or contact support.</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message from SEMS. Do not reply.</p>
                            <p>&copy; ${new Date().getFullYear()} Smart Employee Management System</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email."
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        

        // Find user by plain token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
            status: 'active'
        }).select('email fullname');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        
        res.status(200).json({
            success: true,
            message: "Token is valid",
            data: { email: user.email, name: user.fullname }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;


        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Find user by plain token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
            status: 'active'
        }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash the new password
        user.password = await bcrypt.hash(password, 10);
        user.passwordChanged = true;
        user.passwordChangedAt = new Date();
        
        // Invalidate the reset token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save();

        // Send confirmation email
        await transporter.sendMail({
            from: `"SEMS Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Changed Successfully - Smart Employee Management System (SEMS)',
            html: `
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
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                            color: white; 
                            padding: 30px; 
                            text-align: center; 
                        }
                        .header h2 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content { 
                            padding: 30px; 
                        }
                        .security-box { 
                            background: #fff3cd; 
                            border: 1px solid #ffeaa7; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { 
                            text-align: center; 
                            padding: 20px; 
                            background: #f8f9fa; 
                            color: #6c757d; 
                            font-size: 13px;
                            border-top: 1px solid #dee2e6;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Password Changed Successfully</h2>
                            <p>SEMS Security Notification</p>
                        </div>
                        <div class="content">
                            <p>Hi ${user.fullname},</p>
                            <p>Your password has been changed successfully at ${new Date().toLocaleString()}.</p>
                            
                            <div class="security-box">
                                <p><strong>Security Notice:</strong></p>
                                <p>If you didn't make this change, please:</p>
                                <ul>
                                    <li>Contact HR immediately</li>
                                    <li>Review your account activity</li>
                                    <li>Enable two-factor authentication if available</li>
                                </ul>
                            </div>
                            
                            <p>This is an automated security notification.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Smart Employee Management System</p>
                            <p>This is an automated security message. Do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both passwords required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.passwordChanged = true;
        user.passwordChangedAt = new Date();
        await user.save();

        // Optional: Send email notification
        await transporter.sendMail({
            from: `"SEMS Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Changed - Smart Employee Management System (SEMS)',
            html: `
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
                            padding: 30px; 
                            text-align: center; 
                        }
                        .header h2 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content { 
                            padding: 30px; 
                        }
                        .info-box { 
                            background: #e7f3ff; 
                            border: 1px solid #b3d7ff; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { 
                            text-align: center; 
                            padding: 20px; 
                            background: #f8f9fa; 
                            color: #6c757d; 
                            font-size: 13px;
                            border-top: 1px solid #dee2e6;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Password Updated</h2>
                            <p>SEMS Account Security</p>
                        </div>
                        <div class="content">
                            <p>Hi ${user.fullname},</p>
                            <p>Your SEMS account password was changed successfully at ${new Date().toLocaleString()}.</p>
                            
                            <div class="info-box">
                                <p><strong>Change Details:</strong></p>
                                <p>• Time: ${new Date().toLocaleString()}</p>
                                <p>• Account: ${user.email}</p>
                                <p>• Role: ${user.role}</p>
                            </div>
                            
                            <p>If you made this change, no further action is needed.</p>
                            <p>If you didn't change your password, contact HR immediately.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Smart Employee Management System</p>
                            <p>This is an automated security notification.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    forgotPassword,
    validateResetToken,
    resetPassword,
    changePassword
};