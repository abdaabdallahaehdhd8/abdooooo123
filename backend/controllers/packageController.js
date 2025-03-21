const Package = require("../models/PackageModel");
const User = require("../models/User");
const UserPackage = require("../models/UserPackage");
const asyncHandler = require("express-async-handler");

// جلب جميع الباقات الاستثمارية
const getPackages = async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الباقات:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء جلب الباقات، حاول لاحقًا." });
  }
};

// شراء باقة مع تسجيل عملية الشراء
const purchasePackage = asyncHandler(async (req, res) => {
  const { packageId, packageName, packagePrice, isUSDT, dailyProfit, days } = req.body;

  if (!packageId || !packageName || !packagePrice || dailyProfit === undefined || !days) {
    return res.status(400).json({ message: "❌ بيانات الباقة ناقصة" });
  }

  const userId = req.user && req.user.userId ? req.user.userId : null;
  if (!userId) {
    return res.status(400).json({ message: "❌ المستخدم غير موجود" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "❌ المستخدم غير موجود" });
  }

  const packagePriceNum = Number(packagePrice);
  const dailyProfitNum = Number(dailyProfit);
  const daysNum = Number(days);
  const purchaseTime = new Date();

  const userPackage = new UserPackage({
    user: userId,
    packageId,
    packageName,
    purchaseTime,
    dailyProfit: dailyProfitNum,
    days: daysNum,
  });

  await userPackage.save();
  await user.save();

  console.log("✅ تم شراء الباقة بنجاح");
  res.json({ message: "✅ تم شراء الباقة بنجاح!", newUserPackage: userPackage });
});

// إضافة باقة جديدة (للأدمن) مع الحقول الجديدة
const addPackage = async (req, res) => {
  try {
    const {
      name_ar,
      name_en,
      days,
      price,
      dailyProfit,
      price_usdt,
      dailyProfit_usdt,
      details_ar,
      details_en,
      imageUrl,
      isUSDT,
    } = req.body;

    if (
      !name_ar ||
      !name_en ||
      !price ||
      !days ||
      !dailyProfit ||
      !imageUrl
    ) {
      return res.status(400).json({ message: "❌ جميع الحقول مطلوبة!" });
    }

    const newPackage = new Package({
      name_ar,
      name_en,
      days,
      price,
      dailyProfit,
      price_usdt: price_usdt || 0,
      dailyProfit_usdt: dailyProfit_usdt || 0,
      details_ar: details_ar || "",
      details_en: details_en || "",
      imageUrl,
      isUSDT: !!isUSDT,
    });

    await newPackage.save();
    res.status(201).json({ message: "✅ تم إضافة الباقة بنجاح", package: newPackage });
  } catch (error) {
    console.error("❌ خطأ أثناء إضافة الباقة:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء إضافة الباقة، حاول لاحقًا." });
  }
};

// تعديل بيانات الباقة (للأدمن) مع الحقول الجديدة
const updatePackage = async (req, res) => {
  try {
    const {
      name_ar,
      name_en,
      days,
      price,
      dailyProfit,
      price_usdt,
      dailyProfit_usdt,
      details_ar,
      details_en,
      isUSDT,
      imageUrl
    } = req.body;

    const packageExists = await Package.findById(req.params.id);
    if (!packageExists) {
      return res.status(404).json({ message: "❌ الباقة غير موجودة!" });
    }

    await Package.findByIdAndUpdate(req.params.id, {
      name_ar,
      name_en,
      days,
      price,
      dailyProfit,
      price_usdt: price_usdt || 0,
      dailyProfit_usdt: dailyProfit_usdt || 0,
      details_ar,
      details_en,
      isUSDT,
      imageUrl
    });

    res.json({ message: "✅ تم تعديل الباقة بنجاح" });
  } catch (error) {
    console.error("❌ خطأ أثناء تعديل الباقة:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء تعديل الباقة، حاول لاحقًا." });
  }
};

// حذف باقة (للأدمن)
const deletePackage = async (req, res) => {
  try {
    const packageExists = await Package.findById(req.params.id);
    if (!packageExists) {
      return res.status(404).json({ message: "❌ الباقة غير موجودة!" });
    }
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: "🗑️ تم حذف الباقة بنجاح" });
  } catch (error) {
    console.error("❌ خطأ أثناء حذف الباقة:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء حذف الباقة، حاول لاحقًا." });
  }
};

// جلب الباقات المشتراة من قبل المستخدم مع populate
const getUserPackages = async (req, res) => {
  try {
    const userId = req.user.userId;
    // استخدم populate لجلب الحقول المطلوبة من نموذج Package
    const userPackages = await UserPackage.find({ user: userId })
      .sort({ purchaseTime: -1 })
      .populate("packageId", "name_ar name_en days"); // الحقول التي تحتاجها

    res.json(userPackages);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب باقات المستخدم:", error);
    res.status(500).json({ message: "❌ حدث خطأ أثناء جلب باقات المستخدم، حاول لاحقًا." });
  }
};


module.exports = {
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
  purchasePackage,
  getUserPackages,
};
