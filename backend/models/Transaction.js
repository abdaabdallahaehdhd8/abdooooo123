const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: { type: String, required: true }, // مثال: "إيداع", "سحب", "مكافاه"
    status: { type: String, required: true }, // مثال: "قيد المراجعة", "مقبول", "مرفوض"
    currency: { type: String, required: true }, // "جنيه" أو "USDT"
    date: { type: Date, default: Date.now }
  });
  
module.exports = mongoose.model("Transaction", transactionSchema);
