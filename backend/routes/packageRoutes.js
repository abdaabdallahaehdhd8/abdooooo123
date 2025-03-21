const express = require("express");
const router = express.Router();
const {
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
  purchasePackage,
  getUserPackages
} = require("../controllers/packageController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// جلب جميع الباقات (للمستخدمين)
router.get("/", getPackages);

// إضافة باقة جديدة (يتطلب أدمن)
router.post("/", verifyToken, isAdmin, addPackage);

// تعديل بيانات الباقة (يتطلب أدمن)
router.put("/:id", verifyToken, isAdmin, updatePackage);

// حذف باقة (يتطلب أدمن)
router.delete("/:id", verifyToken, isAdmin, deletePackage);

// شراء باقة (يتطلب مستخدم موثق)
router.post("/purchase", verifyToken, purchasePackage);

// جلب الباقات المشتراة من قبل المستخدم
router.get("/user-packages", verifyToken, getUserPackages);

module.exports = router;
