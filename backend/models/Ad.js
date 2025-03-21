// models/Ad.js
const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    // عنوان بالعربية
    title_ar: {
      type: String,
      required: true,
    },
    // عنوان بالإنجليزية
    title_en: {
      type: String,
      required: true,
    },
    // المحتوى بالعربية
    content_ar: {
      type: String,
      required: true,
    },
    // المحتوى بالإنجليزية
    content_en: {
      type: String,
      required: true,
    },
    // هل الإعلان مفعل
    active: {
      type: Boolean,
      default: true,
    },
    // رابط الصورة (سواءً رابط خارجي أو مرفوع)
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // يضيف createdAt و updatedAt تلقائياً
);

module.exports = mongoose.model("Ad", adSchema);
