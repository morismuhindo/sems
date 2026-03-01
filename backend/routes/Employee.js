const router = require("express").Router();
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");
const { uploadProfilePic } = require("../middleware/upload");

const {
  createEmployee,
  allEmployees,
  singleEmployee,
  updateEmployee,
  deleteEmployee,
  getMyDepartmentEmployees,
  extractEmployeeCode
} = require("../controllers/Employee");

// Profile picture upload
router.post("/profilePic", verifyToken, uploadProfilePic, (req, res) => {
  res.json({
    success: true,
    message: "Profile picture uploaded successfully",
    url: req.file.url
  });
});

// Create employee
router.post("/createEmployee", createEmployee);

// Get all employees (HR only)
router.get("/allEmployees", verifyToken, authorizeRoles("hr"), allEmployees);

// Employee management routes
router.get("/employee/:id", verifyToken, singleEmployee);
router.put("/employee/:id", verifyToken, authorizeRoles("hr"), updateEmployee);
router.delete("/employee/:id", verifyToken, authorizeRoles("hr"), deleteEmployee);

// Get HOD's department employees
router.get("/my-department", verifyToken, authorizeRoles("hod"), getMyDepartmentEmployees);


module.exports = router;