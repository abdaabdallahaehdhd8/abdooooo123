const cron = require("node-cron");
const UserPackage = require("./models/UserPackage");
const User = require("./models/User");
const ProfitLog = require("./models/ProfitLog");
const io = require("./socket").getIO();

// الفترة الزمنية لصرف الربح: 24 ساعة (بالميلي ثانية)
const profitInterval = 24 * 60 * 60 * 1000; // 24 ساعة × 60 دقيقة × 60 ثانية × 1000 ميلي ثانية

// 1) فحص الباقات النشطة بشكل دوري (مثلاً كل دقيقة) لصرف الأرباح بعد مرور 24 ساعة من وقت الشراء
cron.schedule("* * * * *", async () => {
  console.log("⏰ فحص الباقات النشطة لصرف الأرباح كل دقيقة...");

  try {
    const activePackages = await UserPackage.find({ status: "active" });
    const now = new Date();

    for (const userPack of activePackages) {
      // حساب وقت صرف الربح التالي بناءً على 24 ساعة من وقت الشراء
      const nextProfitTime = new Date(
        userPack.purchaseTime.getTime() + (userPack.daysClaimed + 1) * profitInterval
      );

      console.log(`فحص باقة ${userPack.packageName}:
        الآن = ${now.toISOString()},
        وقت صرف الربح التالي = ${nextProfitTime.toISOString()},
        الأيام المصروفة = ${userPack.daysClaimed},
        إجمالي أيام الباقة = ${userPack.days}`);

      if (now >= nextProfitTime) {
        // جلب المستخدم المرتبط بالباقة
        const user = await User.findById(userPack.user);
        if (!user) {
          console.error(`❌ المستخدم ${userPack.user} غير موجود`);
          continue;
        }

        // إضافة الربح اليومي إلى رصيد المستخدم وحقول الإحصائيات
        user.balance += userPack.dailyProfit;
        user.totalProfit += userPack.dailyProfit;
        user.dailyProfit += userPack.dailyProfit;
        user.monthlyProfit += userPack.dailyProfit;
        await user.save();

        // تسجيل عملية صرف الربح في سجل خاص
        await ProfitLog.create({
          user: user._id,
          packageId: userPack._id,
          amount: userPack.dailyProfit,
          date: new Date(),
        });

        // زيادة عدد الأيام المصروفة
        userPack.daysClaimed += 1;

        // التحقق من انتهاء مدة الباقة
        if (userPack.daysClaimed >= userPack.days) {
          userPack.status = "ended";
        }
        await userPack.save();

        // إرسال إشعار أو تحديث عبر WebSocket للواجهة
        io.emit("balanceUpdated", {
          userId: user._id,
          newBalance: user.balance,
        });

        console.log(`✅ تم إضافة ربح يومي لباقة ${userPack.packageName} للمستخدم ${user._id}`);
      } else {
        console.log(`لم يحِن وقت صرف الربح بعد لباقة ${userPack.packageName}`);
      }
    }
  } catch (error) {
    console.error("❌ خطأ أثناء تنفيذ مهمة صرف الأرباح:", error);
  }

  console.log("⏰ انتهاء فحص الباقات النشطة");
});

// 2) إعادة تصفير الحقول اليومية (الربح اليومي، أرباح الإحالة اليومية، الإيداع اليومي) عند منتصف الليل بتوقيت القاهرة
cron.schedule(
  "0 0 * * *", // أي عند الساعة 00:00 كل يوم
  async () => {
    console.log("⏰ بدء تصفير الحقول اليومية (00:00 بتوقيت القاهرة)...");

    try {
      await User.updateMany({}, { $set: { dailyProfit: 0, dailyReferral: 0, dailyDeposit: 0 } });
      console.log("✅ تم تصفير الحقول اليومية لجميع المستخدمين عند منتصف الليل بتوقيت القاهرة.");
    } catch (error) {
      console.error("❌ خطأ أثناء تصفير الحقول اليومية:", error);
    }

    console.log("⏰ انتهاء مهمة تصفير الحقول اليومية");
  },
  {
    timezone: "Africa/Cairo", // تحديد المنطقة الزمنية للقاهرة
  }
);
