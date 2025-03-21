const express = require("express");
const router = express.Router();
const Ad = require("../models/Ad");

// جلب جميع الإعلانات
router.get("/", async (req, res) => {
  try {
    // ترتيب تنازلي حسب تاريخ الإنشاء (الأحدث أولًا)
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(ads);
  } catch (error) {
    console.error("خطأ أثناء جلب الإعلانات:", error);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// إضافة إعلان جديد
router.post("/", async (req, res) => {
  try {
    const {
      // الحقول بالعربية والإنجليزية
      title_ar,
      title_en,
      content_ar,
      content_en,
      active,
      image
    } = req.body;

    // التحقق من ملء الحقول اللازمة
    if (
      !title_ar ||
      !title_en ||
      !content_ar ||
      !content_en
    ) {
      return res.status(400).json({
        error: "يجب إرسال حقول العنوان والمحتوى بالعربي والإنجليزي."
      });
    }

    const newAd = new Ad({
      title_ar,
      title_en,
      content_ar,
      content_en,
      active: active !== undefined ? active : true,
      image: image || ""
    });

    await newAd.save();
    res.status(201).json({
      message: "تم إضافة الإعلان بنجاح",
      ad: newAd
    });
  } catch (error) {
    console.error("خطأ أثناء إضافة الإعلان:", error);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// حذف إعلان
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) {
      return res.status(404).json({ error: "الإعلان غير موجود" });
    }
    res.json({ message: "تم حذف الإعلان بنجاح" });
  } catch (error) {
    console.error("خطأ أثناء حذف الإعلان:", error);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

// تحديث إعلان (اختياري)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title_ar,
      title_en,
      content_ar,
      content_en,
      active,
      image
    } = req.body;

    const updatedAd = await Ad.findByIdAndUpdate(
      id,
      {
        title_ar,
        title_en,
        content_ar,
        content_en,
        active,
        image
      },
      { new: true }
    );

    if (!updatedAd) {
      return res.status(404).json({ error: "الإعلان غير موجود" });
    }

    res.json({
      message: "تم تحديث الإعلان بنجاح",
      ad: updatedAd
    });
  } catch (error) {
    console.error("خطأ أثناء تحديث الإعلان:", error);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
});

module.exports = router;
