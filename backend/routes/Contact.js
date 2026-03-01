// routes/contactRoutes.js
const router = require("express").Router();
const { submitContactForm, testEmail } = require("../controllers/Contact");

// Submit contact form (public endpoint - no authentication required)
router.post("/contact", submitContactForm);

// Test email configuration (optional, could add authentication if needed)
router.post("/contact/test", testEmail);

module.exports = router;