const express = require("express");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");



const router = express.Router();

// ✅ جميع المسارات هنا خاصة بالأدمن فقط
router.use(verifyToken, isAdmin);

router.get("/admin-only", (req, res) => {
    res.json({ message: "مرحبًا أيها الأدمن! 🚀 لديك صلاحية الوصول." });
});

module.exports = router;
