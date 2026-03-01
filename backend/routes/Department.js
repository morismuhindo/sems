const router = require("express").Router();
const {createDepartment,getAllDepartments,deleteDepartment,updateDepartment} = require("../controllers/Department");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

// Create new department
router.post("/createDepartment", verifyToken, authorizeRoles("hr", "hod"), createDepartment);

// Get all departments
router.get("/Departments", verifyToken, authorizeRoles("hr", "hod","employee"), getAllDepartments);

// Update department
router.put("/:id", verifyToken, authorizeRoles("hr", "hod"), updateDepartment);

// Delete department
router.delete("/:id", verifyToken, authorizeRoles("hr", "hod"), deleteDepartment);

module.exports = router;