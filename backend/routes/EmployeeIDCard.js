const router = require("express").Router();
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/role");

const {
  getAllIDCards,
  getIDCardById,
  deleteIDCard
} = require("../controllers/EmployeeIDCard");

// Get all ID cards
router.get("/all", getAllIDCards);

// Get ID card by ID
router.get("/single/:id", getIDCardById);

router.delete("/deleteIdCard/:id", deleteIDCard);



module.exports = router;