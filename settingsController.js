const Settings = require("../models/Settings");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const asyncHandler = require("express-async-handler");
const fetch = require("node-fetch");

// ----------------------------------
// بث التحديث إلى الواجهة الأمامية
// ----------------------------------
const sendWalletUpdate = () => {
  if (global.io) {
    global.io.emit("walletsUpdated");
  } else {
    console.warn("⚠️ `global.io` غير معرف، لم يتم إرسال التحديث!");
  }
};

// ----------------------------------
// الإعدادات والمحافظ
// ----------------------------------

// ✅ جلب الإعدادات والمحافظ
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ error: "لم يتم العثور على إعدادات" });
    }
    res.json(settings);
  } catch (error) {
    console.error("❌ خطأ في جلب الإعدادات:", error);
    res.status(500).json({ error: "خطأ في جلب الإعدادات" });
  }
};

// ✅ تحديث الحد الأدنى للإيداع والسحب
const updateLimits = async (req, res) => {
  try {
    const { minDepositEGP, minDepositUSDT, minWithdrawEGP, minWithdrawUSDT } = req.body;
    
    if (
      minDepositEGP == null ||
      minDepositUSDT == null ||
      minWithdrawEGP == null ||
      minWithdrawUSDT == null ||
      isNaN(minDepositEGP) ||
      isNaN(minDepositUSDT) ||
      isNaN(minWithdrawEGP) ||
      isNaN(minWithdrawUSDT)
    ) {
      return res.status(400).json({ error: "يجب إدخال قيم صحيحة للإيداع والسحب" });
    }

    let settings = (await Settings.findOne()) || new Settings();

    settings.minDepositEGP = Number(minDepositEGP);
    settings.minDepositUSDT = Number(minDepositUSDT);
    settings.minWithdrawEGP = Number(minWithdrawEGP);
    settings.minWithdrawUSDT = Number(minWithdrawUSDT);

    await settings.save();

    res.json({ message: "✅ تم تحديث الإعدادات بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في تحديث الإعدادات:", error);
    res.status(500).json({ error: "خطأ في تحديث الإعدادات" });
  }
};

// ------------------------
// USDT Wallets Endpoints
// ------------------------

const addUSDTWallet = async (req, res) => {
  try {
    const { address, qr, network, minDeposit } = req.body;
    if (!address) {
      return res.status(400).json({ error: "عنوان المحفظة مطلوب" });
    }

    let settings = (await Settings.findOne()) || new Settings();
    if (!Array.isArray(settings.usdtWallets)) {
      settings.usdtWallets = [];
    }

    if (settings.usdtWallets.some((w) => w.address === address)) {
      return res.status(400).json({ error: "المحفظة موجودة بالفعل" });
    }

    settings.usdtWallets.push({
      address,
      qr: qr || "",
      network: network || "",
      minDeposit: Number(minDeposit) || 0,
    });

    await settings.save();

    res.json({ message: "✅ تم إضافة محفظة USDT بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في إضافة محفظة USDT:", error);
    res.status(500).json({ error: "خطأ في إضافة محفظة USDT" });
  }
};

const updateUSDTWallet = async (req, res) => {
  try {
    const { address, qr, network, minDeposit } = req.body;
    const walletAddress = req.params.address;
    if (!walletAddress) {
      return res.status(400).json({ error: "عنوان المحفظة مطلوب للتحديث" });
    }

    let settings = (await Settings.findOne()) || new Settings();
    if (!Array.isArray(settings.usdtWallets)) {
      settings.usdtWallets = [];
    }

    const index = settings.usdtWallets.findIndex((w) => w.address === walletAddress);
    if (index === -1) {
      return res.status(404).json({ error: "لم يتم العثور على محفظة USDT للتحديث" });
    }

    settings.usdtWallets[index] = {
      address,
      qr: qr || "",
      network: network || "",
      minDeposit: Number(minDeposit) || 0,
    };

    await settings.save();

    res.json({ message: "✅ تم تحديث محفظة USDT بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في تحديث محفظة USDT:", error);
    res.status(500).json({ error: "خطأ في تحديث محفظة USDT" });
  }
};

const deleteUSDTWallet = async (req, res) => {
  try {
    const walletAddress = req.params.address;
    if (!walletAddress) {
      return res.status(400).json({ error: "عنوان المحفظة مطلوب للحذف" });
    }

    let settings = await Settings.findOne();
    if (!settings || !Array.isArray(settings.usdtWallets)) {
      return res.status(404).json({ error: "لم يتم العثور على إعدادات أو محافظ USDT" });
    }

    const index = settings.usdtWallets.findIndex((w) => w.address === walletAddress);
    if (index === -1) {
      return res.status(404).json({ error: "لم يتم العثور على محفظة USDT" });
    }

    settings.usdtWallets.splice(index, 1);
    await settings.save();

    res.json({ message: "🗑️ تم حذف محفظة USDT بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في حذف محفظة USDT:", error);
    res.status(500).json({ error: "خطأ في حذف محفظة USDT" });
  }
};

// ---------------------------
// Local Wallets Endpoints
// ---------------------------

// بدلاً من حقل name واحد، نجعل اسمين بالعربي والإنجليزي: name_ar, name_en
const addOrUpdateLocalWallet = async (req, res) => {
  try {
    const { name_ar, name_en, number, logo } = req.body;

    // تحقق من إدخال الاسم بالعربي والإنجليزي + رقم المحفظة
    if (!name_ar || !name_en || !number) {
      return res.status(400).json({ error: "الاسم بالعربي والإنجليزي ورقم المحفظة مطلوبان" });
    }

    let settings = (await Settings.findOne()) || new Settings();
    if (!Array.isArray(settings.localWallets)) {
      settings.localWallets = [];
    }

    // بحث عن المحفظة إن كانت موجودة
    const existingWalletIndex = settings.localWallets.findIndex(
      (wallet) => wallet.number === number
    );

    if (existingWalletIndex !== -1) {
      // تحديث المحفظة إذا كانت موجودة
      settings.localWallets[existingWalletIndex] = {
        name_ar,
        name_en,
        number,
        logo: logo || "",
      };
    } else {
      // إضافة محفظة جديدة
      settings.localWallets.push({
        name_ar,
        name_en,
        number,
        logo: logo || "",
      });
    }

    await settings.save();
    res.json({ message: "✅ تم حفظ المحفظة بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في حفظ المحفظة:", error);
    res.status(500).json({ error: "خطأ في حفظ المحفظة" });
  }
};

const deleteLocalWallet = async (req, res) => {
  try {
    const { number } = req.params;

    let settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ error: "لم يتم العثور على إعدادات" });
    }

    const walletIndex = settings.localWallets.findIndex(
      (wallet) => wallet.number === number
    );
    if (walletIndex === -1) {
      return res.status(404).json({ error: "لم يتم العثور على المحفظة" });
    }

    settings.localWallets.splice(walletIndex, 1);
    await settings.save();

    res.json({ message: "🗑️ تم حذف المحفظة بنجاح", settings });
    process.nextTick(() => sendWalletUpdate());
  } catch (error) {
    console.error("❌ خطأ في حذف المحفظة:", error);
    res.status(500).json({ error: "خطأ في حذف المحفظة" });
  }
};

// ---------------------------
// Other Endpoints
// ---------------------------

const updateWalletImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "رابط الصورة مطلوب" });
    }

    let settings = (await Settings.findOne()) || new Settings();
    settings.walletImage = imageUrl;
    await settings.save();

    res.json({ message: "✅ تم تحديث صورة المحفظة بنجاح", settings });
  } catch (error) {
    console.error("❌ خطأ في تحديث صورة المحفظة:", error);
    res.status(500).json({ error: "❌ خطأ في تحديث صورة المحفظة" });
  }
};

const updateRewardGift = async (req, res) => {
  try {
    const { rewardGift } = req.body;

    let settings = (await Settings.findOne()) || new Settings();
    settings.rewardGift = rewardGift || "";
    await settings.save();

    res.json({ message: "✅ تم تحديث الهدية بنجاح", settings });
  } catch (error) {
    console.error("❌ خطأ في تحديث الهدية:", error);
    res.status(500).json({ error: "خطأ في تحديث الهدية" });
  }
};

const sendRewardToUser = async (req, res) => {
  try {
    const { userId, amount, message, currency } = req.body;

    if (!userId || !amount || isNaN(amount)) {
      return res.status(400).json({ error: "❌ يجب إدخال userId ومبلغ صحيح للمكافأة" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "❌ المستخدم غير موجود" });
    }

    let rewardCurrency = "جنيه";
    let finalAmount = Number(amount);
    let amountInEGP = finalAmount;

    // إذا كانت المكافأة بعملة USDT
    if (currency && currency.toLowerCase() === "usdt") {
      rewardCurrency = "USDT";
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await response.json();
      const rateEGP = data.rates.EGP || 30;
      user.usdtBalance = (user.usdtBalance || 0) + finalAmount;
      amountInEGP = finalAmount * rateEGP;
      user.balance += amountInEGP;
    } else {
      user.balance += finalAmount;
    }
    await user.save();

    const newTransaction = await Transaction.create({
      user: userId,
      amount: finalAmount,
      type: "مكافاه",
      status: "مكتمل",
      currency: rewardCurrency,
      date: new Date(),
      message: message || "",
    });

    return res.json({
      message: "✅ تم إرسال المكافأة بنجاح",
      user,
      transaction: newTransaction,
    });
  } catch (error) {
    console.error("❌ خطأ في إرسال المكافأة:", error);
    res.status(500).json({ error: "❌ خطأ في إرسال المكافأة" });
  }
};

// ----------------------------------
module.exports = {
  getSettings,
  updateLimits,
  addUSDTWallet,
  updateUSDTWallet,
  deleteUSDTWallet,
  addOrUpdateLocalWallet,
  deleteLocalWallet,
  updateWalletImage,
  updateRewardGift,
  sendRewardToUser,
  sendWalletUpdate
};
