// controllers/depositController.js
const asyncHandler = require("express-async-handler");
const fetch = require("node-fetch"); // لجلب سعر الصرف
const Deposit = require("../models/depositModel");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Settings = require("../models/Settings"); // إعدادات النظام
const io = require("../socket").getIO();
const path = require("path");
const fs = require("fs");

// استيراد دالة توزيع عمولات الإحالة
const { applyReferralCommission } = require("../controllers/userController");

// مسار مجلد uploads
const uploadDir = path.join(__dirname, "../uploads");

// دالة لجلب سعر الصرف من API خارجي
async function getExchangeRate() {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    const rateEGP = data.rates.EGP;
    if (!rateEGP) {
      throw new Error("لم يتم العثور على معدل تحويل EGP في البيانات.");
    }
    return rateEGP;
  } catch (error) {
    console.error("خطأ في جلب معدل الصرف:", error);
    return 30; // قيمة افتراضية احتياطية
  }
}

/**
 * ✅ طلب إيداع من قبل المستخدم (POST /api/deposits)
 */
const requestDeposit = asyncHandler(async (req, res) => {
  const { amount, senderPhone, selectedWallet, networkName, networkAddress } = req.body;

  // 1) التحقق من المدخلات الأساسية
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "❌ يجب إدخال مبلغ صالح للإيداع" });
  }
  if (!selectedWallet) {
    return res.status(400).json({ error: "❌ يجب اختيار المحفظة أو تحديدها" });
  }

  // 2) جلب إعدادات النظام
  const settings = await Settings.findOne();
  if (!settings) {
    return res.status(500).json({ error: "❌ إعدادات النظام غير موجودة" });
  }

  // 3) تحديد نوع الإيداع (USDT أم جنيه)
  const isUSDT = selectedWallet === "usdt";
  if (isUSDT) {
    if (amount < settings.minDepositUSDT) {
      return res
        .status(400)
        .json({ error: `الحد الأدنى للإيداع بالـ USDT هو ${settings.minDepositUSDT}` });
    }
  } else {
    if (amount < settings.minDepositEGP) {
      return res
        .status(400)
        .json({ error: `الحد الأدنى للإيداع بالجنيه هو ${settings.minDepositEGP}` });
    }
  }

  // 4) الحصول على صورة الإثبات من req.files
  let proofImage = null;
  if (req.files && req.files.proofImage) {
    const proofFile = req.files.proofImage;

    // إنشاء اسم فريد للملف
    const fileName = Date.now() + "-" + proofFile.name.replace(/\s+/g, "-");
    const savePath = path.join(uploadDir, fileName);

    // نقل الملف إلى مجلد "uploads"
    proofFile.mv(savePath, (err) => {
      if (err) {
        console.error("خطأ أثناء نقل الملف:", err);
        return res.status(500).json({ error: "خطأ أثناء رفع الملف" });
      }
    });
    proofImage = `uploads/${fileName}`;
  }

  // 5) التأكد من إدخال رقم الهاتف للإيداع المحلي
  if (!isUSDT && !senderPhone) {
    return res.status(400).json({ error: "❌ يجب إدخال رقم الهاتف للإيداع المحلي" });
  }

  // 6) إنشاء سجل جديد للإيداع بحالة "pending"
  const deposit = await Deposit.create({
    user: req.user.userId,
    amount: parseFloat(amount),
    senderPhone: senderPhone || "",
    selectedWallet,
    proofImage,
    networkName: networkName || "",
    networkAddress: networkAddress || "",
    status: "pending",
  });

  // 7) إنشاء معاملة جديدة
  const newTransaction = await Transaction.create({
    user: req.user.userId,
    amount: parseFloat(amount),
    type: "deposit",
    status: "pending",
    currency: isUSDT ? "USDT" : "جنيه",
    date: new Date(),
  });

  // 8) بث المعاملة عبر Socket.IO
  io.emit("newTransaction", newTransaction);

  // إرسال الرد مع بيانات الإيداع والمعاملة
  res.status(201).json({
    message: "✅ تم إرسال طلب الإيداع بنجاح",
    deposit,
    transaction: newTransaction,
  });
});

/**
 * ✅ جلب جميع طلبات الإيداع (للأدمن فقط)
 */
const getAllDeposits = asyncHandler(async (req, res) => {
  const deposits = await Deposit.find().populate(
    "user",
    "name email phone balance usdtBalance"
  );
  res.status(200).json(deposits);
});

/**
 * ✅ تحديث حالة الإيداع (موافقة / رفض) - للأدمن فقط
 */
const updateDepositStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const deposit = await Deposit.findById(id);
  if (!deposit) {
    return res.status(404).json({ error: "❌ الإيداع غير موجود" });
  }
  if (deposit.status === "approved") {
    return res
      .status(400)
      .json({ error: "🚨 لا يمكن تغيير حالة إيداع تم الموافقة عليه مسبقًا" });
  }

  deposit.status = status;
  await deposit.save();

  if (status === "approved") {
    const user = await User.findById(deposit.user);
    if (user) {
      const depositAmount = parseFloat(deposit.amount) || 0;
      const rateEGP = await getExchangeRate();
      let depositValueInLocal = depositAmount;

      if (deposit.selectedWallet === "usdt") {
        user.usdtBalance = (user.usdtBalance || 0) + depositAmount;
        depositValueInLocal = depositAmount * rateEGP;
        user.balance += depositValueInLocal;
      } else {
        user.balance += depositValueInLocal;
        const depositValueInUsdt = depositAmount / rateEGP;
        user.usdtBalance = (user.usdtBalance || 0) + depositValueInUsdt;
      }

      const now = new Date();
      user.totalDeposit = (user.totalDeposit || 0) + depositValueInLocal;

      if (
        !user.dailyDepositDate ||
        new Date(user.dailyDepositDate).toDateString() !== now.toDateString()
      ) {
        user.dailyDeposit = depositValueInLocal;
        user.dailyDepositDate = now;
      } else {
        user.dailyDeposit += depositValueInLocal;
      }

      const currentMonth = now.getMonth() + 1;
      if (user.monthlyDepositMonth !== currentMonth) {
        user.monthlyDeposit = depositValueInLocal;
        user.monthlyDepositMonth = currentMonth;
      } else {
        user.monthlyDeposit += depositValueInLocal;
      }

      await user.save();

      io.emit("balanceUpdated", {
        userId: user._id,
        newLocalBalance: user.balance,
        newUsdtBalance: user.usdtBalance,
      });

      const newTransaction = await Transaction.create({
        user: deposit.user,
        amount: deposit.amount,
        type: "deposit",
        status: "approved",
        currency: deposit.selectedWallet === "usdt" ? "USDT" : "جنيه",
        date: new Date(),
      });
      io.emit("newTransaction", newTransaction);

      await applyReferralCommission(user._id, depositValueInLocal);
    }
  } else {
    const transaction = await Transaction.findOne({
      user: deposit.user,
      amount: deposit.amount,
      type: "deposit",
    });
    if (transaction) {
      transaction.status = "rejected";
      await transaction.save();
      io.emit("newTransaction", transaction);
    }
  }

  res.json({
    message: `✅ تم ${status === "approved" ? "الموافقة على" : "رفض"} الإيداع`,
    deposit,
  });
});

/**
 * ✅ الموافقة على الإيداع (مسار بديل)
 */
const approveDeposit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deposit = await Deposit.findById(id);
  if (!deposit) {
    return res.status(404).json({ message: "❌ الإيداع غير موجود" });
  }
  if (deposit.status === "approved") {
    return res
      .status(400)
      .json({ message: "🚨 تمت الموافقة على هذا الإيداع مسبقًا" });
  }
  const user = await User.findById(deposit.user);
  if (!user) {
    return res.status(404).json({ message: "❌ المستخدم غير موجود" });
  }

  const depositAmount = parseFloat(deposit.amount) || 0;
  const rateEGP = await getExchangeRate();
  let depositValueInLocal = depositAmount;

  if (deposit.selectedWallet === "usdt") {
    user.usdtBalance = (user.usdtBalance || 0) + depositAmount;
    depositValueInLocal = depositAmount * rateEGP;
    user.balance += depositValueInLocal;
  } else {
    user.balance += depositValueInLocal;
    const depositValueInUsdt = depositAmount / rateEGP;
    user.usdtBalance = (user.usdtBalance || 0) + depositValueInUsdt;
  }

  deposit.status = "approved";
  await deposit.save();
  await user.save();

  const existingTransaction = await Transaction.findOne({
    user: deposit.user,
    amount: deposit.amount,
    type: "deposit",
    status: "approved",
  });
  if (!existingTransaction) {
    const newTransaction = await Transaction.create({
      user: deposit.user,
      amount: deposit.amount,
      type: "deposit",
      status: "approved",
      currency: deposit.selectedWallet === "usdt" ? "USDT" : "جنيه",
      date: new Date(),
    });
    io.emit("newTransaction", newTransaction);
  }
  io.emit("balanceUpdated", {
    userId: user._id,
    newLocalBalance: user.balance,
    newUsdtBalance: user.usdtBalance,
  });

  if (deposit.selectedWallet === "usdt") {
    await applyReferralCommission(user._id, depositAmount);
  } else {
    await applyReferralCommission(user._id, depositValueInLocal);
  }

  res.json({
    message: "✅ تمت الموافقة على الإيداع",
    newLocalBalance: user.balance,
    newUsdtBalance: user.usdtBalance,
  });
});

/**
 * ✅ جلب سجل الإيداع للمستخدم الحالي (GET /api/deposits/history)
 */
const getDepositHistory = asyncHandler(async (req, res) => {
  const deposits = await Deposit.find({ user: req.user.userId }).sort({ createdAt: -1 });
  res.status(200).json(deposits);
});

module.exports = {
  requestDeposit,
  getAllDeposits,
  updateDepositStatus,
  approveDeposit,
  getDepositHistory, // أضفنا هذه الدالة
};
