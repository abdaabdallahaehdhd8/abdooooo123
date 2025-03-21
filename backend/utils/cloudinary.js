require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "wallets", // مجلد الصور داخل Cloudinary
        });
        return result.secure_url; // إرجاع رابط الصورة
    } catch (error) {
        console.error("❌ خطأ أثناء رفع الصورة:", error);
        return null;
    }
};

module.exports = { uploadImage };
