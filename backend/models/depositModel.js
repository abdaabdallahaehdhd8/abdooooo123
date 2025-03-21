// models/depositModel.js
const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },

    // خاص بالمحافظ المحلية
    senderPhone: { type: String },

    // اسم أو رقم المحفظة المحلية أو "usdt" (إذا كانت USDT)
    selectedWallet: { type: String, required: true },

    // صورة إثبات التحويل
    proofImage: { type: String, required: false },

    // حقول خاصة بالـ USDT
    networkName: { type: String, default: "" },
    networkAddress: { type: String, default: "" },

    // حالة الإيداع
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // إحصائيات الإيداع
    dailyDeposit: { type: Number, default: 0 },
    monthlyDeposit: { type: Number, default: 0 },
    totalDeposit: { type: Number, default: 0 },
    dailyDepositDate: { type: Date, default: null },
    monthlyDepositMonth: { type: Number, default: null },
  },
  { timestamps: true }
);

// ضبط الإحصائيات اليومية والشهرية قبل الحفظ
depositSchema.pre("save", function (next) {
  const now = new Date();
  if (!this.dailyDepositDate || this.dailyDepositDate.toDateString() !== now.toDateString()) {
    this.dailyDeposit = this.amount;
    this.dailyDepositDate = now;
  } else {
    this.dailyDeposit = this.amount;
  }
  const currentMonth = now.getMonth() + 1;
  if (!this.monthlyDepositMonth || this.monthlyDepositMonth !== currentMonth) {
    this.monthlyDeposit = this.amount;
    this.monthlyDepositMonth = currentMonth;
  } else {
    this.monthlyDeposit = this.amount;
  }
  this.totalDeposit = this.amount;
  next();
});

module.exports = mongoose.model("Deposit", depositSchema);
