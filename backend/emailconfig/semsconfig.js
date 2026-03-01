const nodemailer = require("nodemailer");

// Create transporter specifically for SEMS emails
const semsTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SEMS_EMAIL,
        pass: process.env.SEMS_PASS
    }
});

// Verify transporter configuration
semsTransporter.verify((error, success) => {
    if (error) {
        console.log('SEMS email transporter error:', error);
    } else {
        console.log('SEMS email server is ready to send messages');
    }
});

module.exports = {semsTransporter};