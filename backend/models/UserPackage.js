const mongoose = require("mongoose");

const userPackageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    packageName: { type: String, required: true },
    purchaseTime: { type: Date, required: true },
    dailyProfit: { type: Number, required: true },
    days: { type: Number, required: true }, 
    daysClaimed: { type: Number, default: 0 }, // عدد الأيام التي تم صرف أرباحها
    status: { type: String, enum: ["active", "ended"], default: "active" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 🕒 حساب وقت صرف الربح التالي
userPackageSchema.virtual("nextProfitTime").get(function () {
  return new Date(this.purchaseTime.getTime() + (this.daysClaimed + 1) * 24 * 60 * 60 * 1000);
});

module.exports = mongoose.model("UserPackage", userPackageSchema);
