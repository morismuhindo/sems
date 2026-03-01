const router = require("express").Router();
const {
  clockIn, clockOut, verifyEmployeeCode,
  getAllAttendance, getAttendanceById, getEmployeeAttendance,
  updateAttendance, deleteAttendance, markAbsentAutomatically,
  getTodaySummary, markAbsentForDateRange, getHodDepartmentAttendance,
  getHodTodaySummary
} = require("../controllers/Attendance");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

// Public route for employee code verification
router.post("/verify", verifyEmployeeCode);

// System automation routes
router.post("/auto-mark-absent", markAbsentAutomatically);
router.post("/mark-range", markAbsentForDateRange);
router.get("/summary/today", getTodaySummary);

// Clock in/out routes
router.post("/clock-in", verifyToken, authorizeRoles("attendancemanager", "hr"), clockIn);
router.post("/clock-out", verifyToken, authorizeRoles("attendancemanager", "hr"), clockOut);

// Employee attendance routes
router.get("/employee/:employeeCode", verifyToken, getEmployeeAttendance);

// Attendance management routes
router.get("/attend", verifyToken, authorizeRoles("hr", "employee", "hod"), getAllAttendance);
router.get("/single/:id", verifyToken, getAttendanceById);
router.put("/:id", verifyToken, authorizeRoles("hr"), updateAttendance);
router.delete("/:id", verifyToken, authorizeRoles("hr"), deleteAttendance);

// HOD department routes
router.get('/department', verifyToken, authorizeRoles("hod"), getHodDepartmentAttendance);
router.get('/department/today', verifyToken, authorizeRoles("hod"), getHodTodaySummary);

module.exports = router;