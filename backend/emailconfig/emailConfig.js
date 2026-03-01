const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('Email transporter error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

module.exports = transporter;






// const nodemailer = require("nodemailer");

// // Create transporter for general emails
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // Create transporter specifically for SEMS emails
// const semsTransporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.SEMS_USER || process.env.SEMS_EMAIL || process.env.EMAIL_USER,
//         pass: process.env.SEMS_PASS || process.env.EMAIL_PASS
//     }
// });

// // Verify both transporter configurations
// transporter.verify((error, success) => {
//     if (error) {
//         console.log('General email transporter error:', error);
//     } else {
//         console.log('General email server is ready to send messages');
//     }
// });

// semsTransporter.verify((error, success) => {
//     if (error) {
//         console.log('SEMS email transporter error:', error);
//     } else {
//         console.log('SEMS email server is ready to send messages');
//     }
// });

// // Export both transporters
// module.exports = {
//     transporter,        
//     semsTransporter     
// };