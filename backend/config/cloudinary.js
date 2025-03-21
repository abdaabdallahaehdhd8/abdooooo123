const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (fileBuffer, mimetype) => {
    try {
        // تحويل `Buffer` إلى `Base64`
        const base64String = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

        // رفع الصورة باستخدام `Base64 Data URI`
        const result = await cloudinary.uploader.upload(base64String, {
            folder: "wallets", // إنشاء مجلد في Cloudinary
        });

        return result.secure_url;
    } catch (error) {
        console.error("❌ فشل رفع الصورة:", error);
        return null;
    }
};

module.exports = { uploadImage };
