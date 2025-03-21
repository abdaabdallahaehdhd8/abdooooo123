const express = require("express");
const router = express.Router();
const User = require("../models/User"); // استيراد موديل المستخدم
const { verifyToken } = require("../middleware/authMiddleware"); // التحقق من التوكن

// ✅ جلب رصيد مستخدم معين
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId, "balance usdtBalance"); // جلب الرصيد و رصيد USDT إن وجد

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    res.json({ balance: user.balance, usdtBalance: user.usdtBalance });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الرصيد:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الرصيد" });
  }
});

// ✅ جلب جميع أرصدة المستخدمين
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "id balance usdtBalance"); // جلب جميع المستخدمين مع أرصدتهم فقط
    res.json(users);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الأرصدة:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الأرصدة" });
  }
});

// ✅ خصم مبلغ من رصيد المستخدم (عملية شراء باقة)
// يتم إرسال المبلغ المراد خصمه في الخاصية purchaseAmount من الواجهة
router.put("/purchase", verifyToken, async (req, res) => {
  try {
    // جلب المستخدم من بيانات التوكن
    const userId = req.user && req.user.userId ? req.user.userId : null;
    if (!userId) {
      return res.status(400).json({ error: "المستخدم غير موجود" });
    }

    const { purchaseAmount } = req.body;
    const purchaseNum = Number(purchaseAmount);
    if (isNaN(purchaseNum) || purchaseNum <= 0) {
      return res.status(400).json({ error: "قيمة الشراء غير صحيحة" });
    }

    // البحث عن المستخدم في قاعدة البيانات
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // التأكد من وجود رصيد كافٍ
    if (user.balance < purchaseNum) {
      return res.status(400).json({ error: "ليس لديك رصيد كافٍ" });
    }

    // خصم مبلغ الشراء من الرصيد
    user.balance -= purchaseNum;
    await user.save();

    res.json({
      message: "✅ تم خصم المبلغ بنجاح",
      balance: user.balance
    });
  } catch (error) {
    console.error("❌ خطأ أثناء خصم المبلغ:", error);
    res.status(500).json({ error: "حدث خطأ أثناء خصم المبلغ" });
  }
});

module.exports = router;
