const router = require("express").Router();

const {
  createDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentStatistics,
  searchDocuments,
  uploadSingle 
} = require("../controllers/Document"); 

const verifyToken = require("../middleware/auth");
const allowedRoles = require("../middleware/role");

// Create document (HR only)
router.post(
  "/create", 
  verifyToken, 
  allowedRoles("hr"), 
  uploadSingle, 
  createDocument
);

// Get all documents
router.get("/all", verifyToken, allowedRoles("hr", "hod", "employee"), getAllDocuments);

// Get document by ID
router.get("/single/:id", verifyToken, allowedRoles("hr", "hod", "employee"), getDocumentById);

// Update document (HR only)
router.put(
  "/update/:id", 
  verifyToken, 
  allowedRoles("hr"), 
  uploadSingle, 
  updateDocument
);

// Delete document (HR only)
router.delete("/delete/:id", verifyToken, allowedRoles("hr"), deleteDocument);

// Get document statistics (HR only)
router.get("/stats", verifyToken, allowedRoles("hr"), getDocumentStatistics);

// Search documents
router.get("/search", verifyToken, allowedRoles("hr","hod","employee"), searchDocuments);

module.exports = router;