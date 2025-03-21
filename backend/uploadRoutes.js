const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload"); // إذا كنت تستخدم express-fileupload
const fs = require("fs");
const path = require("path");

// تأكد من استدعاء fileUpload في server.js أو هنا
// router.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

// أو إذا تستخدم multer
// const multer = require("multer");
// ... إعداد التخزين ...

router.post("/", async (req, res) => {
  try {
    // تحقق من وجود ملف
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "لا يوجد ملف مرفوع" });
    }

    // وصول الملف
    const imageFile = req.files.image;
    // أنشئ اسمًا مميزًا
    const fileName = Date.now() + "-" + imageFile.name;
    // حدد المسار النهائي للحفظ
    const savePath = path.join(__dirname, "..", "uploads", fileName);

    // انقل الملف للمسار
    imageFile.mv(savePath, (err) => {
      if (err) {
        console.error("خطأ أثناء نقل الملف:", err);
        return res.status(500).json({ error: "فشل رفع الملف" });
      }
      // أعد رابط الملف
      // رابط نسبي: "/uploads/fileName"
      res.json({ url: "/uploads/" + fileName });
    });
  } catch (error) {
    console.error("خطأ أثناء رفع الملف:", error);
    res.status(500).json({ error: "فشل رفع الملف" });
  }
});

module.exports = router;
