require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socket = require("./socket");
const fileUpload = require("express-fileupload");

// استيراد إعداد i18next والـ middleware الخاص به


const app = express();
const server = http.createServer(app);
socket.init(server); // Socket.IO

// تفعيل express-fileupload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    // limits: { fileSize: 5 * 1024 * 1024 },
  })
);

// إعداد CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("🚫 Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 1) تقديم الملفات الثابتة من مجلد "public"
 * يجب أن يكون هذا قبل أي Middleware يعيد 404
 */
app.use(express.static(path.join(__dirname, "public")));

/**
 * 2) تقديم مجلد "uploads" (إن كنت تحتاجه)
 */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * 3) إضافة middleware الخاص بالتدويل (i18next)
 */


// اختبار السيرفر باستخدام الترجمة
app.get("/", (req, res) => {
  res.send(req.t("welcome")); // المفتاح "welcome" موجود في ملفات الترجمة
});

// استيراد المسارات
const depositRoutes = require("./routes/depositRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const packageRoutes = require("./routes/packageRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adRoutes = require("./routes/adRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
// ربط المسارات
app.use("/api/deposits", depositRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/user-balances", balanceRoutes);
app.use("/api/withdrawals", withdrawRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ads", adRoutes);
app.use("/api", messagesRoutes);
/**
 * 4) التعامل مع المسارات غير الموجودة (404)
 * ضعه بعد تقديم الملفات الثابتة والمسارات
 */
app.use((req, res) => {
  console.error(`🚨 المسار غير موجود: ${req.originalUrl}`);
  res.status(404).json({ error: "المسار غير موجود" });
});
app.use(express.static(path.join(__dirname, "public")));

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error Handler:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});
app.use("/locales", express.static(path.join(__dirname, "public/locales")));
// الاتصال بقاعدة البيانات وتشغيل السيرفر
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ متصل بقاعدة البيانات بنجاح!");
    const PORT = process.env.PORT || 5080;
    server.listen(PORT, () => {
      console.log(`🚀 السيرفر يعمل على: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", err.message);
    process.exit(1);
  }
};

connectDB();

// المهام المجدولة (Cron Jobs)
require("./cronJobs");
