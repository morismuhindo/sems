const router = require("express").Router();
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  applyForLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  cancelLeave,
  updateLeave,
  deleteLeave,
  getLeaveStats
} = require("../controllers/Leave"); 

// Apply for leave
router.post("/leave", verifyToken, authorizeRoles("employee", "hod"), applyForLeave);

// Get leaves
router.get("/allLeave", verifyToken, authorizeRoles("hr", "hod", "employee"), getLeaves);

// Get leave by ID
router.get("/leave/:id", verifyToken, authorizeRoles("hr", "hod", "employee"), getLeaveById);

// Approve leave
router.put("/leave/:id/approve", verifyToken, authorizeRoles("hr", "hod"), approveLeave);

// Reject leave
router.put("/leave/:id/reject", verifyToken, authorizeRoles("hr", "hod"), rejectLeave);

// Cancel leave
router.put("/leave/:id/cancel", verifyToken, authorizeRoles("employee", "hod"), cancelLeave);

// Update leave
router.put("/leave/:id", verifyToken, authorizeRoles("employee"), updateLeave);

// Delete leave
router.delete("/leave/:id", verifyToken, authorizeRoles("employee"), deleteLeave);

// Get leave statistics
router.get("/leave-stats", verifyToken, authorizeRoles("hr", "hod"), getLeaveStats);

module.exports = router;