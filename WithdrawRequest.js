const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountNumber: { type: String }, // لحالة Vodafone Cash
  usdtAddress: { type: String },   // لحالة USDT
  usdtNetwork: { type: String },   // لحالة USDT
  amount: { type: Number, required: true }, // المبلغ المطلوب (عدد USDT أو جنيه)
  withdrawMethod: { type: String, enum: ["vodafoneCash", "usdt"], required: true },
  amountInEGP: { type: Number }, // القيمة المحوّلة بالـ EGP في حالة USDT
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
