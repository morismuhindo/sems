const router = require('express').Router();
const { uploadLogo } = require('../middleware/upload');
const verifyToken = require("../middleware/auth");
const {
  createOrganisation,
  updateOrganisation,
  getAllOrganisations,
  getOrganisationById,
  deleteOrganisation
} = require('../controllers/Organisation');

// Create organisation
router.post('/createOrg', createOrganisation);

// Upload logo
router.post("/logo", verifyToken, uploadLogo, (req, res) => {
  res.json({
    success: true,
    message: "Logo uploaded successfully",
    url: req.file.url
  });
});

// Get all organisations
router.get('/org', getAllOrganisations);

// Get organisation by ID
router.get('/:id', getOrganisationById);

// Update organisation
router.put('/:id', updateOrganisation);

// Delete organisation
router.delete('/:id', deleteOrganisation);

module.exports = router;