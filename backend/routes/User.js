const router = require("express").Router();
const {
  RegisterHr,
  Login,
  getAllUsers,
  getSingleUser,
  getMyProfile,
  updateUser,
  deleteUser,
  getUsersByEmployeeName,
  getUsersByEmployeeRole,
  getUserByEmployeeCode
} = require("../controllers/User");

const authorizeRoles = require("../middleware/role");
const verifyToken = require("../middleware/auth");

// Authentication routes
router.post("/registerHR", RegisterHr);
router.post("/login", Login);

// Get current user profile
router.get("/me", verifyToken, getMyProfile);

// Get all users (HR only)
router.get("/", verifyToken, authorizeRoles("hr"), getAllUsers);

// Get user by ID
router.get("/:id", verifyToken, getSingleUser);

// Update user
router.put("/:id", verifyToken, authorizeRoles("hr", "employee","hod"), updateUser);

// Delete user (HR only)
router.delete("/:id", verifyToken, authorizeRoles("hr"), deleteUser);

// Search users by name (HR only)
router.get("/search/name/:name", verifyToken, authorizeRoles("hr"), getUsersByEmployeeName);

module.exports = router;