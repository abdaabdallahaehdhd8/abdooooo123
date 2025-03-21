// controllers/TransactionController.js
const Transaction = require("../models/Transaction");

/**
 * ✅ جلب المعاملات الخاصة بالمستخدم المسجل فقط
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId; // استخراج معرف المستخدم من التوكن
    const transactions = await Transaction.find({ user: userId });
    res.json(transactions);
  } catch (err) {
    console.error("❌ خطأ أثناء جلب المعاملات:", err);
    res.status(500).json({ message: "❌ حدث خطأ أثناء جلب المعاملات" });
  }
};

/**
 * ✅ إضافة معاملة جديدة
 * إذا كان نوع المعاملة المُرسل هو "reward" سيتم استبداله بـ "مكافاه"
 * كما يتم تمرير الخاصية currency من الواجهة؛ إذا لم تُمرر قيمة، يتم تعيين "جنيه" للمعاملات الافتراضية للإيداع.
 */
const addTransaction = async (req, res) => {
  try {
    const { amount, type, status, date, currency } = req.body;
    const userId = req.user.userId; // استخراج userId من المستخدم المصادق عليه

    // إذا كان نوع المعاملة "reward"، نستبدله بـ "مكافاه"
    let transactionType = type;
    if (type && type.toLowerCase() === "reward") {
      transactionType = "مكافاه";
    } else if (type && type.toLowerCase() === "deposit") {
      transactionType = "إيداع";
    } else if (type && type.toLowerCase() === "withdraw") {
      transactionType = "سحب";
    }

    // إذا لم تُمرر العملة يتم تعيين "جنيه" إذا كانت المعاملة إيداع (يمكنك تعديل هذا منطقاً حسب الحاجة)
    const transactionCurrency =
      currency && currency.trim() !== ""
        ? currency
        : (transactionType === "إيداع" ? "جنيه" : "");

    const newTransaction = new Transaction({
      user: userId, // ربط المعاملة بالمستخدم
      amount,
      type: transactionType,
      status,
      currency: transactionCurrency,
      date: date || new Date()
    });

    await newTransaction.save();
    res.status(201).json({ message: "✅ تمت إضافة المعاملة بنجاح!", data: newTransaction });
  } catch (error) {
    console.error("❌ خطأ أثناء إضافة المعاملة:", error);
    res.status(500).json({ error: "❌ حدث خطأ أثناء الحفظ" });
  }
};

module.exports = {
  getUserTransactions,
  addTransaction
};
