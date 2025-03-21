const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  type: { type: String, required: true }, // نوع الرسالة (general أو private)
  title: { type: String, required: true }, // عنوان الرسالة
  text: { type: String, required: true },  // محتوى الرسالة
  time: { type: Date, default: Date.now }, // وقت الإرسال
  link: { type: String, default: "#" },    // رابط عند النقر
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // معرف المستخدم للرسائل الخاصة
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
