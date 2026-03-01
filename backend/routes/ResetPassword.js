const router = require("express").Router();
const {
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword
} = require("../controllers/ResetPassword");

const verifyToken = require("../middleware/auth");

router.post("/forgot-password", forgotPassword);
router.get("/validate-reset/:token", validateResetToken);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;