const express = require("express");
const router = express.Router();
const messageController = require("../controllers/MessageController.js");

// جلب كل الرسائل (عامة وخاصة) - يمكن استخدامها في لوحة الإدارة
router.get("/messages", messageController.getMessages);

// جلب الرسائل الخاصة فقط لمستخدم معين
router.get("/messages/private", messageController.getPrivateMessages);

// إرسال رسالة جديدة
router.post("/messages", messageController.sendMessage);

// حذف رسالة
router.delete("/messages/:id", messageController.deleteMessage);

module.exports = router;
