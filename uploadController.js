const cloudinary = require("../config/cloudinary");
const fs = require("fs");

exports.uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "لم يتم العثور على ملف الصورة" });
    }

    const file = req.files.image;

    // ✅ التحقق من أن الملف صورة
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "يجب أن يكون الملف صورة بصيغة (JPEG, PNG, JPG, WEBP)" });
    }

    // ✅ رفع الصورة إلى Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "uploads",
    });

    // ✅ حذف الملف المؤقت بعد الرفع
    fs.unlinkSync(file.tempFilePath);

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("❌ خطأ أثناء رفع الصورة:", error);
    res.status(500).json({ error: "حدث خطأ أثناء رفع الصورة" });
  }
};
