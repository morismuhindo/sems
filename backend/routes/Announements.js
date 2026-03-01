const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  hrCreateSystemAnnouncement,
  hrCreateDepartmentAnnouncement,
  hodCreateAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats
} = require("../controllers/Announcements");

router.post(
  "/system",
  verifyToken,
  authorizeRoles("hr"),
  hrCreateSystemAnnouncement
);

router.post(
  "/department",
  verifyToken,
  authorizeRoles("hr"),
  hrCreateDepartmentAnnouncement
);

router.post(
  "/hod",
  verifyToken,
  authorizeRoles("hod"),
  hodCreateAnnouncement
);

router.get("/all", verifyToken, getAnnouncements);

router.get(
  "/stats",
  verifyToken,
  authorizeRoles("hr", "hod"),
  getAnnouncementStats
);

router.put("/:id", verifyToken, updateAnnouncement);
router.delete("/:id", verifyToken, deleteAnnouncement);

module.exports = router;