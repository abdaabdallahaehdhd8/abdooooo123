// models/ReferralCommission.js
const mongoose = require("mongoose");

const ReferralCommissionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // المستخدم الذي دفع العمولة
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },   // المستخدم الذي حصل على العمولة (المحيل)
  amount: { type: Number, default: 0 },                            // مبلغ العمولة
  level: { type: Number, default: 1 },                             // المستوى (1 أو 2 أو 3...)
  date: { type: Date, default: Date.now },                         // تاريخ تسجيل العمولة
});

module.exports = mongoose.model("ReferralCommission", ReferralCommissionSchema);
