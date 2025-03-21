// controllers/withdrawController.js
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const WithdrawRequest = require("../models/WithdrawRequest");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings"); // إعدادات النظام
const io = require("../socket").getIO();

/**
 * دالة جلب سعر الصرف الحالي (USD -> EGP)
 */
async function getExchangeRate() {
  try {
    const exchangeResponse = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
    const rateEGP = exchangeResponse.data.rates.EGP;
    if (!rateEGP) {
      throw new Error("لم يتم العثور على معدل تحويل EGP");
    }
    return rateEGP;
  } catch (error) {
    console.error("❌ خطأ في جلب سعر الصرف:", error);
    return 30; // قيمة افتراضية احتياطية
  }
}

/**
 * ✅ طلب سحب الأموال من قبل المستخدم
 * يتم تطبيق الحد الأدنى للسحب وفقًا للعملة (جنيه أو USDT)
 * إذا كانت طريقة السحب USDT، يتم حساب القيمة بالجنيه وتحديث كلا الرصيدين
 */
const requestWithdraw = asyncHandler(async (req, res) => {
  const {
    amount,
    accountNumber,    // لحالة Vodafone Cash
    withdrawMethod,   // "vodafoneCash" أو "usdt"
    usdtAddress,      // لحالة USDT
    usdtNetwork       // لحالة USDT
  } = req.body;

  // 1) التحقق من المستخدم
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "❌ المستخدم غير موجود" });
  }

  // 2) التحقق من المبلغ الأساسي
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "❌ مبلغ غير صالح" });
  }

  // 3) جلب إعدادات النظام (مثلاً الحد الأدنى للسحب)
  const settings = await Settings.findOne();
  if (!settings) {
    return res.status(404).json({ error: "❌ إعدادات النظام غير موجودة" });
  }

  // 4) تحديد طريقة السحب والتأكد من الحدود والإدخالات المطلوبة
  if (withdrawMethod === "usdt") {
    if (amount < settings.minWithdrawUSDT) {
      return res.status(400).json({ error: `الحد الأدنى للسحب بالـ USDT هو ${settings.minWithdrawUSDT}` });
    }
    if (!usdtAddress || !usdtNetwork) {
      return res.status(400).json({ error: "❌ يرجى إدخال عنوان المحفظة واسم الشبكة للسحب عبر USDT" });
    }
  } else if (withdrawMethod === "vodafoneCash") {
    if (amount < settings.minWithdrawEGP) {
      return res.status(400).json({ error: `الحد الأدنى للسحب بالجنيه هو ${settings.minWithdrawEGP}` });
    }
    if (!accountNumber) {
      return res.status(400).json({ error: "❌ يرجى إدخال رقم المحفظة لسحب Vodafone Cash" });
    }
  } else {
    return res.status(400).json({ error: "❌ طريقة سحب غير معروفة" });
  }

  // 5) التحقق من الرصيد الفعلي
  let amountInEGP = null;
  const exchangeRate = await getExchangeRate();

  if (withdrawMethod === "usdt") {
    amountInEGP = amount * exchangeRate;
    if (user.usdtBalance < amount) {
      return res.status(400).json({ error: "❌ رصيد USDT غير كافٍ" });
    }
    if (user.balance < amountInEGP) {
      return res.status(400).json({
        error: `❌ الرصيد بالجنيه غير كافٍ، تحتاج ${amountInEGP.toFixed(2)} جنيه`
      });
    }
  } else if (withdrawMethod === "vodafoneCash") {
    if (user.balance < amount) {
      return res.status(400).json({ error: "❌ رصيد الجنيه غير كافٍ لسحب فودافون كاش" });
    }
  }

  // 6) إنشاء طلب السحب
  const withdrawRequest = new WithdrawRequest({
    userId: user._id,
    accountNumber: withdrawMethod === "vodafoneCash" ? accountNumber : undefined,
    usdtAddress: withdrawMethod === "usdt" ? usdtAddress : undefined,
    usdtNetwork: withdrawMethod === "usdt" ? usdtNetwork : undefined,
    amount,
    withdrawMethod,
    amountInEGP, // متاح فقط في حالة USDT
    status: "pending",
  });
  await withdrawRequest.save();

  // 7) تسجيل معاملة "pending" مع تضمين خاصية العملة
  let currency;
  if (withdrawMethod === "usdt") {
    currency = "USDT";
  } else {
    currency = "جنيه";
  }
  const transactionData = {
    user: user._id,
    amount, // المبلغ كما هو (بالـ USDT أو بالجنيه)
    type: "withdraw",
    status: "pending",
    date: new Date(),
    withdrawMethod,
    currency,
  };
  if (withdrawMethod === "usdt") {
    transactionData.amountInEGP = amountInEGP;
  }
  const newTransaction = await Transaction.create(transactionData);
  io.emit("newTransaction", newTransaction);

  return res.status(201).json({
    message: "✅ تم إرسال طلب السحب بنجاح",
    withdrawRequest,
  });
});

/**
 * ✅ قبول أو رفض طلب السحب (للأدمن)
 * عند الموافقة:
 * - إذا كانت طريقة السحب USDT: يتم خصم المبلغ من رصيد USDT وخصم القيمة المحوّلة (amountInEGP) من رصيد الجنيه.
 * - إذا كانت طريقة السحب Vodafone Cash: يتم خصم المبلغ من رصيد الجنيه بالإضافة إلى خصم ما يعادله من USDT (بحساب سعر الصرف).
 */
const handleWithdraw = asyncHandler(async (req, res) => {
  const { status } = req.body; // "approved" أو "rejected"
  const withdrawRequest = await WithdrawRequest.findById(req.params.id);
  if (!withdrawRequest) {
    return res.status(404).json({ error: "❌ الطلب غير موجود" });
  }
  if (withdrawRequest.status !== "pending") {
    return res.status(400).json({ error: "❌ الطلب تمت معالجته بالفعل" });
  }

  const user = await User.findById(withdrawRequest.userId);
  if (!user) {
    return res.status(404).json({ error: "❌ المستخدم غير موجود" });
  }

  if (status === "approved") {
    if (withdrawRequest.withdrawMethod === "usdt") {
      const egpNeeded = withdrawRequest.amountInEGP;
      if (user.usdtBalance < withdrawRequest.amount) {
        return res.status(400).json({ error: "❌ رصيد USDT غير كافٍ" });
      }
      if (user.balance < egpNeeded) {
        return res.status(400).json({
          error: `❌ الرصيد بالجنيه غير كافٍ، تحتاج ${egpNeeded.toFixed(2)} جنيه`
        });
      }
      user.usdtBalance -= withdrawRequest.amount;
      user.balance -= egpNeeded;
    } else if (withdrawRequest.withdrawMethod === "vodafoneCash") {
      if (user.balance < withdrawRequest.amount) {
        return res.status(400).json({ error: "❌ رصيد الجنيه غير كافٍ لسحب فودافون كاش" });
      }
      user.balance -= withdrawRequest.amount;
      const exchangeRate = await getExchangeRate();
      const amountInUsdt = withdrawRequest.amount / exchangeRate;
      if (user.usdtBalance < amountInUsdt) {
        return res.status(400).json({
          error: `❌ رصيد USDT غير كافٍ، تحتاج ${amountInUsdt.toFixed(2)} USDT`
        });
      }
      user.usdtBalance -= amountInUsdt;
    } else {
      return res.status(400).json({ error: "❌ طريقة سحب غير معروفة" });
    }

    withdrawRequest.status = "approved";
    await user.save();

    const newTransaction = await Transaction.create({
      user: user._id,
      amount: withdrawRequest.amount,
      type: "withdraw",
      status: "approved",
      date: new Date(),
      withdrawMethod: withdrawRequest.withdrawMethod,
      amountInEGP: withdrawRequest.amountInEGP || undefined,
      // تمرير العملة وفقًا لطريقة السحب
      currency: withdrawRequest.withdrawMethod === "usdt" ? "USDT" : "جنيه"
    });

    io.emit("withdrawStatusUpdated", {
      withdrawId: withdrawRequest._id,
      status: "approved",
    });
    io.emit("newTransaction", newTransaction);

    const newBalance =
      withdrawRequest.withdrawMethod === "usdt" ? user.usdtBalance : user.balance;
    io.emit("balanceUpdated", { userId: user._id, newBalance });
  } else if (status === "rejected") {
    withdrawRequest.status = "rejected";
  } else {
    return res.status(400).json({ error: "❌ حالة غير صالحة" });
  }

  await withdrawRequest.save();
  return res.json({
    message: `✅ تم ${status === "approved" ? "الموافقة على" : "رفض"} الطلب بنجاح`,
    withdrawRequest,
  });
});

/**
 * ✅ جلب جميع طلبات السحب (للأدمن)
 */
const getAllWithdrawals = asyncHandler(async (req, res) => {
  const withdrawals = await WithdrawRequest.find().populate(
    "userId",
    "name email phone balance usdtBalance"
  );
  res.json(withdrawals);
});

module.exports = {
  requestWithdraw,
  handleWithdraw,
  getAllWithdrawals,
};
