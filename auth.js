const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");

// ✅ Middleware للتحقق من توكن المستخدم
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "يجب تسجيل الدخول للوصول" });
    }
    
    try {
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "التوكن غير صالح" });
    }
};

module.exports = { verifyToken };
