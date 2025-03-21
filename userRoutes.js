const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserBalance,
  searchUsers,
  getReferredUsers,
  getTeamStats,
  getReferralRanking  // ← الدالة الجديدة
  // updateUserCurrency تم إزالته
} = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// مسارات المصادقة وإدارة المستخدمين
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, getUserProfile);
router.get("/", verifyToken, isAdmin, getAllUsers);

// مسار جلب الرصيد
router.get("/balance", verifyToken, getUserBalance);

// مسار تحديث حالة المستخدم (حظر، تعليق، تنشيط، حذف) - للأدمن
router.patch("/:id", verifyToken, isAdmin, updateUserStatus);

// مسار جلب الملف الشخصي
router.get("/profile", verifyToken, getUserProfile);

// مسار البحث عن المستخدمين (للأدمن)
router.get("/search", verifyToken, isAdmin, searchUsers);

// مسارات إحصائيات الفريق والأعضاء المحالين
router.get("/referred-users", verifyToken, getReferredUsers);
router.get("/team-stats", verifyToken, getTeamStats);

// مسار ترتيب الإحالات (أفضل 10 أعضاء)
router.get("/referral-ranking", verifyToken, getReferralRanking);

module.exports = router;
