const express = require("express");
const router = express.Router();
const TransactionController = require("../controllers/TransactionController");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ جلب المعاملات الخاصة بالمستخدم فقط
router.get("/", verifyToken, TransactionController.getUserTransactions);

// ✅ إضافة معاملة جديدة
router.post("/", verifyToken, TransactionController.addTransaction);

module.exports = router;
