const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
  name_ar: { type: String, required: true },
  name_en: { type: String, required: true },
  days: { type: Number, required: true },
  price: { type: Number, required: true },
  dailyProfit: { type: Number, required: true },
  // الحقول الجديدة:
  price_usdt: { type: Number, default: 0 },
  dailyProfit_usdt: { type: Number, default: 0 },
  details_ar: { type: String, default: "" },
  details_en: { type: String, default: "" },
  isUSDT: { type: Boolean, default: false },
  imageUrl: { type: String, default: "" },
});

module.exports = mongoose.model("Package", PackageSchema);
