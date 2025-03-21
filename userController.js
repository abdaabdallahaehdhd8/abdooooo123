// controllers/userController.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const axios = require("axios");

const User = require("../models/User");
const ReferralCommission = require("../models/ReferralCommission");
const fetch = require("node-fetch"); // إذا كنت تستخدم node-fetch
// أو const axios = require("axios"); // إذا تفضل axios

// ...

// ضع الدالة هنا
async function getExchangeRate() {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    // مثلاً نجلب سعر الـ EGP
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

// وبعدها يمكنك استدعاء getExchangeRate في أي دالة داخل userController
// =====================
// تسجيل مستخدم جديد
// =====================
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, referralCode } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "❌ يجب أن تكون كلمة المرور 8 أحرف على الأقل" });
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return res
      .status(400)
      .json({ error: "البريد الإلكتروني أو رقم الهاتف مسجل بالفعل" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let referredBy = null;

  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(400).json({ error: "❌ كود الإحالة غير صالح" });
    }
    referredBy = referrer._id;
  }

  // ✅ توليد كود إحالة فريد للمستخدم الجديد
  const generateReferralCode = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const newUser = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    referredBy,
    referralCode: generateReferralCode(),
    balance: 0, // الرصيد الافتراضي
  });

  res.status(201).json({
    message: "✅ تم إنشاء الحساب بنجاح",
    user: {
      name,
      email,
      phone,
      referralCode: newUser.referralCode,
      balance: newUser.balance,
    },
  });
});

// =====================
// تسجيل الدخول
// =====================
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  // البحث عن المستخدم باستخدام البريد الإلكتروني أو رقم الهاتف
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({
      error: "البريد الإلكتروني، رقم الهاتف أو كلمة المرور غير صحيحة",
    });
  }

  if (user.banned) {
    return res
      .status(403)
      .json({ error: "❌ حسابك محظور، تواصل مع الدعم." });
  }
  if (user.suspended) {
    return res
      .status(403)
      .json({ error: "⏸️ تم تعليق حسابك، تواصل مع الدعم." });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({
    message: "تم تسجيل الدخول بنجاح",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
    },
  });
});

// =====================
// جلب بيانات الملف الشخصي مع الإحصائيات
// =====================
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  const userStats = {
    name: user.name,
    email: user.email,
    phone: user.phone,
    balance: user.balance,
    dailyDeposit: user.dailyDeposit || 0,
    monthlyDeposit: user.monthlyDeposit || 0,
    totalDeposit: user.totalDeposit || 0,
    dailyProfit: user.dailyProfit || 0,
    monthlyProfit: user.monthlyProfit || 0,
    totalProfit: user.totalProfit || 0,
    dailyReferral: user.dailyReferral || 0,
    monthlyReferral: user.monthlyReferral || 0,
    totalReferral: user.totalReferral || 0,
    referralCode: user.referralCode,
  };

  res.status(200).json(userStats);
});

// =====================
// تحديث الملف الشخصي
// =====================
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;

  await user.save();
  res.status(200).json({ message: "✅ تم تحديث الملف الشخصي بنجاح", user });
});

// =====================
// جلب رصيد المستخدم
// =====================
const getUserBalance = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    if (!userId) {
      return res.status(401).json({ error: "❌ غير مصرح لك بالوصول" });
    }
    const user = await User.findById(userId).select("balance");
    if (!user) {
      return res.status(404).json({ error: "❌ المستخدم غير موجود" });
    }
    res.status(200).json({ balance: user.balance });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الرصيد:", error);
    res.status(500).json({ error: "❌ خطأ في السيرفر أثناء جلب الرصيد" });
  }
};

// =====================
// جلب جميع المستخدمين (للأدمن فقط)
// =====================
const getAllUsers = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "🚫 ليس لديك الصلاحية للوصول إلى المستخدمين" });
  }
  const users = await User.find().select("-password");
  res.status(200).json(users);
});

// =====================
// تحديث حالة المستخدم (حظر، تعليق، تنشيط، حذف)
// =====================
const updateUserStatus = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود" });
  }

  switch (action) {
    case "ban":
      user.banned = true;
      user.suspended = false;
      break;
    case "suspend":
      user.suspended = true;
      user.banned = false;
      break;
    case "activate":
      user.banned = false;
      user.suspended = false;
      break;
    case "delete":
      await User.findByIdAndDelete(req.params.id);
      return res
        .status(200)
        .json({ message: "تم حذف المستخدم بنجاح", userId: req.params.id });
    default:
      return res.status(400).json({ error: "إجراء غير صالح" });
  }

  await user.save();
  res.status(200).json({ message: `تم ${action} المستخدم بنجاح`, user });
});

// =====================
// البحث عن المستخدمين (للأدمن وفي صفحة الإعدادات)
// =====================
const searchUsers = asyncHandler(async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json({ users: [] });

  const regexQuery = new RegExp(query, "i");
  const users = await User.find({
    $or: [{ name: regexQuery }, { email: regexQuery }, { phone: regexQuery }],
  }).select("-password");

  res.json({ users });
});

// =====================
// التحقق من التوكن
// =====================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "❌ يجب تسجيل الدخول للوصول إلى هذا المورد" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "❌ التوكن غير صالح أو منتهي الصلاحية" });
  }
};

// =====================
// التحقق من كون المستخدم إدمن
// =====================
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "🚫 ليس لديك الصلاحية للوصول إلى لوحة التحكم" });
  }
  console.log("✅ الإدمن يتمتع بالصلاحيات");
  next();
};

// =====================
// توزيع عمولات الإحالة بناءً على مستويات العمولة
// =====================
const applyReferralCommission = async (userId, depositLocalValue) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // المستوى الأول
    if (user.referredBy) {
      const level1 = await User.findById(user.referredBy);
      if (level1) {
        const commission1 = depositLocalValue * 0.1; // 10%
        level1.totalReferral += commission1;
        level1.dailyReferral += commission1;
        level1.monthlyReferral += commission1;
        level1.balance += commission1;
        await level1.save();

        // تسجيل سجل العمولة للمستوى الأول
        await ReferralCommission.create({
          fromUser: user._id,
          toUser: level1._id,
          amount: commission1,
          level: 1,
        });

        // المستوى الثاني
        if (level1.referredBy) {
          const level2 = await User.findById(level1.referredBy);
          if (level2) {
            const commission2 = depositLocalValue * 0.04; // 4%
            level2.totalReferral += commission2;
            level2.dailyReferral += commission2;
            level2.monthlyReferral += commission2;
            level2.balance += commission2;
            await level2.save();

            await ReferralCommission.create({
              fromUser: user._id,
              toUser: level2._id,
              amount: commission2,
              level: 2,
            });

            // المستوى الثالث
            if (level2.referredBy) {
              const level3 = await User.findById(level2.referredBy);
              if (level3) {
                const commission3 = depositLocalValue * 0.01; // 1%
                level3.totalReferral += commission3;
                level3.dailyReferral += commission3;
                level3.monthlyReferral += commission3;
                level3.balance += commission3;
                await level3.save();

                await ReferralCommission.create({
                  fromUser: user._id,
                  toUser: level3._id,
                  amount: commission3,
                  level: 3,
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ خطأ أثناء توزيع عمولات الإحالة:", error);
  }
};

// =====================
// استرجاع الأعضاء المحالين (إحصائيات الإحالة)
// =====================
const getReferredUsers = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: "❌ غير مصرح لك بالوصول" });
    }

    // المستوى الأول
    const level1Users = await User.find({ referredBy: userId }).select(
      "name phone createdAt referralProfit"
    );
    for (const l1User of level1Users) {
      const commissionSum = await ReferralCommission.aggregate([
        {
          $match: {
            fromUser: l1User._id,
            toUser: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);
      l1User._doc.referralProfit =
        commissionSum.length > 0 ? commissionSum[0].total : 0;
    }

    // المستوى الثاني
    const level1Ids = level1Users.map((user) => user._id);
    const level2Users = await User.find({ referredBy: { $in: level1Ids } }).select(
      "name phone createdAt"
    );

    // المستوى الثالث
    const level2Ids = level2Users.map((user) => user._id);
    const level3Users = await User.find({ referredBy: { $in: level2Ids } }).select(
      "name phone createdAt"
    );

    res.status(200).json({
      level1: level1Users,
      level2: level2Users,
      level3: level3Users,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الأعضاء المحالين:", error);
    res.status(500).json({ error: "❌ حدث خطأ أثناء جلب الأعضاء المحالين" });
  }
});

// =====================
// جلب إحصائيات الفريق (المستوى الأول + الثاني + الثالث)
// =====================
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

/** مثال: دالة getTeamStats */
const getTeamStats = asyncHandler(async (req, res) => {
  try {
    // 1) جلب المستخدم الحالي
    const userId = req.user.userId;
    const me = await User.findById(userId);

    // 2) جلب المستخدمين المحالين (3 مستويات)
    const level1Users = await User.find({ referredBy: userId });
    const level1Ids = level1Users.map((u) => u._id);

    const level2Users = await User.find({ referredBy: { $in: level1Ids } });
    const level2Ids = level2Users.map((u) => u._id);

    const level3Users = await User.find({ referredBy: { $in: level2Ids } });

    // 3) جمع كل أعضاء الفريق في مصفوفة
    const allTeamUsers = me
      ? [me, ...level1Users, ...level2Users, ...level3Users]
      : [...level1Users, ...level2Users, ...level3Users];

    // 4) متغيرات لجمع الإحصائيات بالجنيه (EGP)
    let dailyDepositEGP = 0, monthlyDepositEGP = 0, totalDepositEGP = 0;
    let dailyProfitEGP = 0, monthlyProfitEGP = 0, totalProfitEGP = 0;
    let dailyReferralEGP = 0, monthlyReferralEGP = 0, totalReferralEGP = 0;

    // 5) نجمع من كل مستخدم
    allTeamUsers.forEach((u) => {
      // حقول الجنيه (المخزّنة في الحقول القديمة)
      dailyDepositEGP   += (u.dailyDeposit   || 0);
      monthlyDepositEGP += (u.monthlyDeposit || 0);
      totalDepositEGP   += (u.totalDeposit   || 0);

      dailyProfitEGP    += (u.dailyProfit    || 0);
      monthlyProfitEGP  += (u.monthlyProfit  || 0);
      totalProfitEGP    += (u.totalProfit    || 0);

      dailyReferralEGP  += (u.dailyReferral  || 0);
      monthlyReferralEGP+= (u.monthlyReferral|| 0);
      totalReferralEGP  += (u.totalReferral  || 0);
    });

    // 6) نجلب معدل التحويل USD -> EGP
    const rateEGP = await getExchangeRate(); // كم جنيه في 1 دولار

    // 7) تحويل القيم من جنيه إلى دولار بقسمة القيمة بالجنيه على rateEGP
    const dailyDepositUSD   = (dailyDepositEGP   / rateEGP).toFixed(2);
    const monthlyDepositUSD = (monthlyDepositEGP / rateEGP).toFixed(2);
    const totalDepositUSD   = (totalDepositEGP   / rateEGP).toFixed(2);

    const dailyProfitUSD    = (dailyProfitEGP    / rateEGP).toFixed(2);
    const monthlyProfitUSD  = (monthlyProfitEGP  / rateEGP).toFixed(2);
    const totalProfitUSD    = (totalProfitEGP    / rateEGP).toFixed(2);

    const dailyReferralUSD  = (dailyReferralEGP  / rateEGP).toFixed(2);
    const monthlyReferralUSD= (monthlyReferralEGP/ rateEGP).toFixed(2);
    const totalReferralUSD  = (totalReferralEGP  / rateEGP).toFixed(2);

    // 8) إعادة الاستجابة
    res.status(200).json({
      // حقول الجنيه
      dailyDepositEGP,
      monthlyDepositEGP,
      totalDepositEGP,

      dailyProfitEGP,
      monthlyProfitEGP,
      totalProfitEGP,

      dailyReferralEGP,
      monthlyReferralEGP,
      totalReferralEGP,

      // حقول الدولار (محولة من الجنيه)
      dailyDepositUSD,
      monthlyDepositUSD,
      totalDepositUSD,

      dailyProfitUSD,
      monthlyProfitUSD,
      totalProfitUSD,

      dailyReferralUSD,
      monthlyReferralUSD,
      totalReferralUSD,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب إحصائيات الفريق:", error);
    res.status(500).json({ error: "❌ حدث خطأ أثناء جلب إحصائيات الفريق." });
  }
});

// === بقية الدوال (registerUser, loginUser, ... إلخ) ===
// عدّلها فقط إذا احتجت منطقًا خاصًا بتخزين القيم بالدولار.
// وإلا ابقها كما هي.

module.exports = {
  // ... بقية الدوال
  getTeamStats,
  // ...
};



// =====================
// دالة صرف الأرباح من الباقات وتحديث أيام الباقة (daysClaimed)
// =====================
// تم إعادة ضبط الفترة إلى 24 ساعة بدل الاختبار (24 ساعة = 24 * 60 * 60 * 1000 ميلي ثانية)
const UserPackage = require("../models/UserPackage");
const ProfitLog = require("../models/ProfitLog");

const distributeDailyProfits = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    // الفترة الإنتاجية: 24 ساعة
    const profitInterval = 24 * 60 * 60 * 1000;

    // جلب الباقات النشطة
    const activePackages = await UserPackage.find({ status: "active" });

    for (const userPack of activePackages) {
      const nextProfitTime = new Date(
        userPack.purchaseTime.getTime() +
          (userPack.daysClaimed + 1) * profitInterval
      );

      // التحقق مما إذا حان وقت صرف الربح
      if (now >= nextProfitTime) {
        // جلب المستخدم المرتبط بالباقة
        const user = await User.findById(userPack.user);
        if (!user) {
          console.error(`❌ المستخدم ${userPack.user} غير موجود`);
          continue;
        }

        // إضافة الربح اليومي
        user.balance += userPack.dailyProfit;
        user.totalProfit += userPack.dailyProfit;
        user.dailyProfit += userPack.dailyProfit;
        user.monthlyProfit += userPack.dailyProfit;
        await user.save();

        // تسجيل عملية صرف الربح في ProfitLog
        await ProfitLog.create({
          user: user._id,
          packageId: userPack._id,
          amount: userPack.dailyProfit,
          date: new Date(),
        });

        // تحديث عدد الأيام المصروفة
        userPack.daysClaimed += 1;

        // التحقق من انتهاء مدة الباقة
        if (userPack.daysClaimed >= userPack.days) {
          userPack.status = "ended";
        }
        await userPack.save();
      }
    }

    res
      .status(200)
      .json({ message: "✅ تم صرف الأرباح من الباقات النشطة بنظام الإنتاج" });
  } catch (error) {
    console.error("❌ خطأ أثناء صرف الأرباح:", error);
    res.status(500).json({ error: "❌ حدث خطأ أثناء صرف الأرباح" });
  }
});

/**
 * دالة getReferralRanking: تُرجع أفضل 10 أعضاء حسب عدد الإحالات.
 * تقوم بتجميع المستخدمين الذين لديهم قيمة في حقل referredBy، 
 * ثم حساب عدد الإحالات لكل مُحال وترتيبهم تنازليًا.
 */
const getReferralRanking = asyncHandler(async (req, res) => {
  try {
    const ranking = await User.aggregate([
      {
        $match: {
          referredBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$referredBy",              // تجميع حسب رقم المستخدم الذي قام بالإحالة
          referralCount: { $sum: 1 }         // حساب عدد الإحالات
        }
      },
      {
        $sort: { referralCount: -1 }         // ترتيب تنازلي حسب عدد الإحالات
      },
      {
        $limit: 10                         // اختيار أفضل 10 أعضاء
      },
      // استخدام $lookup لاسترجاع بيانات المُحال من مجموعة المستخدمين
      {
        $lookup: {
          from: "users",                   // اسم المجموعة في MongoDB (عادةً "users")
          localField: "_id",               // قيمة referredBy
          foreignField: "_id",             // مقارنة مع _id في مجموعة المستخدمين
          as: "referrer"
        }
      },
      { $unwind: "$referrer" },
      {
        $project: {
          _id: 0,
          userId: "$referrer._id",
          name: "$referrer.name",
          referralCount: 1
        }
      }
    ]);

    res.status(200).json(ranking);
  } catch (error) {
    console.error("❌ Error fetching referral ranking:", error);
    res.status(500).json({ error: "❌ حدث خطأ أثناء جلب ترتيب الإحالات" });
  }
});

// =====================
// التصدير
// =====================
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserBalance,
  verifyToken,
  getReferredUsers,
  getTeamStats,
  isAdmin,
  searchUsers,
  applyReferralCommission,
  distributeDailyProfits,
  getReferralRanking // ← أضف هذه
};
