const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  // حدود الإيداع
  minDepositEGP: { type: Number, default: 50 },
  minDepositUSDT: { type: Number, default: 10 },

  // حدود السحب
  minWithdrawEGP: { type: Number, default: 20 },
  minWithdrawUSDT: { type: Number, default: 5 },

  // المحافظ المحلية
  localWallets: [
    {
      name: String,
      number: String,
      logo: String,
    },
  ],

  // محافظ USDT (متعددة)
  usdtWallets: [
    {
      address: String,
      qr: String,
      network: String,
      minDeposit: Number,
    },
  ],

  // هدية المستخدم
  rewardGift: String,

  // صورة المحفظة العامة
  walletImage: String,
});

module.exports = mongoose.model("Settings", SettingsSchema);
