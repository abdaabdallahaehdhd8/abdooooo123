const express = require("express");
const {
  requestWithdraw,
  handleWithdraw,
  getAllWithdrawals,
} = require("../controllers/withdrawController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// تقديم طلب السحب (مستخدم عادي - يحتاج توكن)
router.post("/", verifyToken, requestWithdraw);

// قبول أو رفض طلب السحب (أدمن)
router.patch("/:id", verifyToken, isAdmin, handleWithdraw);

// جلب جميع طلبات السحب (أدمن)
router.get("/", verifyToken, isAdmin, getAllWithdrawals);

module.exports = router;
