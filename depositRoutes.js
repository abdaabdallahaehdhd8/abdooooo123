const express = require("express");
const {
  requestDeposit,
  getAllDeposits,
  updateDepositStatus,
  approveDeposit,
  getDepositHistory,
} = require("../controllers/depositController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const path = require("path");
const fs = require("fs");

const router = express.Router();

// إنشاء مجلد "uploads" إن لم يكن موجودًا
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// مسار لجلب سجل الإيداع للمستخدم الحالي
router.get("/history", verifyToken, getDepositHistory);

// جلب جميع الإيداعات (للأدمن)
router.get("/", verifyToken, isAdmin, getAllDeposits);

// تحديث حالة الإيداع (موافقة / رفض)
router.patch("/:id", verifyToken, isAdmin, updateDepositStatus);

// الموافقة على إيداع
router.post("/approve/:id", verifyToken, isAdmin, approveDeposit);

// مسار طلب الإيداع
// (لم نعد نستخدم multer هنا؛ سنعتمد على express-fileupload في server.js)
router.post("/", verifyToken, requestDeposit);

module.exports = router;
