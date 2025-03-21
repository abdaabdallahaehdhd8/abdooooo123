const express = require("express");
const {
  getSettings,
  updateLimits,
  addUSDTWallet,
  updateUSDTWallet,
  deleteUSDTWallet,
  addOrUpdateLocalWallet,
  deleteLocalWallet,
  updateWalletImage,
  updateRewardGift,
  sendRewardToUser, // ← إضافة
} = require("../controllers/settingsController");
const { uploadImage } = require("../controllers/uploadController");

// إذا كنت تريد السماح فقط للإدمن بإرسال المكافآت، استورد الدوال verifyToken, isAdmin:
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// جلب الإعدادات
router.get("/", getSettings);

// تحديث حدود الإيداع والسحب
router.put("/limits", updateLimits);
router.post("/updateLimits", updateLimits);

// محافظ USDT
router.post("/usdt", addUSDTWallet);
router.put("/usdt/:address", updateUSDTWallet);
router.delete("/usdt/:address", deleteUSDTWallet);

// المحافظ المحلية
router.post("/wallet", addOrUpdateLocalWallet);
router.delete("/wallet/:number", deleteLocalWallet);

// تحديث صورة المحفظة العامة
router.put("/wallet-image", updateWalletImage);

// رفع صورة
router.post("/upload", uploadImage);

// تحديث هدية المستخدم
router.put("/reward-gift", updateRewardGift);

// ✅ إرسال مكافأة لمستخدم (للأدمن عادةً)
router.post("/reward", verifyToken, isAdmin, sendRewardToUser);

module.exports = router;
