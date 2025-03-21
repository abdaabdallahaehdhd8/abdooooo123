const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },         // الرصيد بالعملة المحلية (جنيه)
  usdtBalance: { type: Number, default: 0 },     // رصيد USDT
  totalDeposit: { type: Number, default: 0 },
  dailyDeposit: { type: Number, default: 0 },
  monthlyDeposit: { type: Number, default: 0 },
  dailyDepositDate: { type: Number, default: 0 },
  monthlyDepositMonth: { type: Number, default: 0 },
  dailyProfit: { type: Number, default: 0 },
  monthlyProfit: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  dailyReferral: { type: Number, default: 0 },
  monthlyReferral: { type: Number, default: 0 },
  totalReferral: { type: Number, default: 0 },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  referralCode: { type: String, unique: true },
  banned: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

// توليد كود إحالة عشوائي تلقائيًا عند إنشاء مستخدم جديد
UserSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substr(2, 8);
  }
  if (isNaN(this.balance) || this.balance === null || this.balance === undefined) {
    this.balance = 0;
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
