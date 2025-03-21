const jwt = require("jsonwebtoken");

// ✅ التحقق من التوكن
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // عرض الـ Authorization header في الكونسول
  console.log("🔑 Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "❌ يجب تسجيل الدخول للوصول إلى هذا المورد" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // عرض البيانات المستخلصة من التوكن
    console.log("📜 بيانات التوكن:", decoded);

    req.user = decoded; // تخزين بيانات المستخدم المستخلصة في الـ req
    next();
  } catch (error) {
    return res.status(401).json({ error: "❌ التوكن غير صالح أو منتهي الصلاحية" });
  }
};

// ✅ التحقق من كون المستخدم إدمن
const isAdmin = (req, res, next) => {
  // عرض البيانات الخاصة بالمستخدم في الكونسول
  console.log("🧑‍💻 بيانات المستخدم:", req.user);

  // التحقق إذا كان المستخدم يحتوي على صلاحية إدمن
  if (!req.user || req.user.role !== "admin") {
    console.error("🚫 المستخدم ليس إدمن، الصلاحية مرفوضة.");
    return res.status(403).json({ error: "🚫 ليس لديك الصلاحية للوصول إلى لوحة التحكم" });
  }
  console.log("✅ المستخدم إدمن، الصلاحيات متاحة.");
  next();
};

module.exports = { verifyToken, isAdmin };
