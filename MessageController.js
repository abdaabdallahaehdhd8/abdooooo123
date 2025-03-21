const mongoose = require("mongoose");
const Message = require("../models/Message");
const { getIO } = require("../socket");

// جلب الرسائل العامة والخاصة (حسب userId إن وجد)
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.query;
    let messages;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      messages = await Message.find({
        $or: [
          { type: "general" },
          { userId: new mongoose.Types.ObjectId(userId) }
        ],
      })
        .sort({ time: -1 })
        .populate("userId", "name phone");
    } else {
      messages = await Message.find({ type: "general" }).sort({ time: -1 });
    }

    console.log("📩 الرسائل المسترجعة من API:", messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error("⚠️ خطأ في جلب الرسائل:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحميل الرسائل." });
  }
};

// جلب الرسائل الخاصة فقط لمستخدم محدد
exports.getPrivateMessages = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "معرف مستخدم غير صالح." });
    }

    const privateMessages = await Message.find({
      type: "private",
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ time: -1 })
      .populate("userId", "name phone");

    console.log("📩 الرسائل الخاصة للمستخدم:", privateMessages);
    res.status(200).json(privateMessages);
  } catch (error) {
    console.error("⚠️ خطأ في جلب الرسائل الخاصة:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الرسائل الخاصة." });
  }
};

// إرسال رسالة جديدة (عامة أو خاصة)
exports.sendMessage = async (req, res) => {
  try {
    const { type, title, text, link, userId } = req.body;

    if (!type || !title || !text) {
      return res.status(400).json({ error: "يجب إدخال جميع البيانات المطلوبة" });
    }

    const messageData = {
      type,
      title,
      text,
      link: link || "#",
      userId: type === "private" && userId ? new mongoose.Types.ObjectId(userId) : null,
    };

    const newMessage = new Message(messageData);
    await newMessage.save();

    // إرسال الرسالة عبر WebSocket
    const io = getIO();
    if (type === "private" && userId) {
      io.to(userId.toString()).emit("newMessage", newMessage);
    } else {
      io.emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("⚠️ خطأ في إرسال الرسالة:", error);
    res.status(500).json({ error: "تعذر إرسال الرسالة." });
  }
};

// حذف رسالة
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "معرف الرسالة غير صالح." });
    }

    await Message.findByIdAndDelete(id);
    res.status(200).json({ message: "تم حذف الرسالة بنجاح." });
  } catch (error) {
    console.error("⚠️ خطأ في حذف الرسالة:", error);
    res.status(500).json({ error: "تعذر حذف الرسالة." });
  }
};
