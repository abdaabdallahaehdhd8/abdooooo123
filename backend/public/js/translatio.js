// translatio.js

var currentLang = "ar";         // اللغة الافتراضية
var polyglot = new Polyglot();  // إنشاء كائن Polyglot

// كائن الترجمة باللغتين
var translations = {
  ar: {
    "header_title": "إنشاء حساب جديد",
    "placeholder_fullname": "الاسم بالكامل",
    "placeholder_email": "البريد الإلكتروني",
    "placeholder_phone": "رقم الهاتف",
    "placeholder_referral": "كود الإحالة (اختياري)",
    "placeholder_password": "كلمة المرور",
    "placeholder_confirmPassword": "تأكيد كلمة المرور",
    "button_signup": "إنشاء حساب",
    "login_prompt": "لديك حساب بالفعل؟",
    "link_login": "تسجيل الدخول",
    "page_title": "إنشاء حساب"
  },
  en: {
    "header_title": "Create New Account",
    "placeholder_fullname": "Full Name",
    "placeholder_email": "Email",
    "placeholder_phone": "Phone Number",
    "placeholder_referral": "Referral Code (Optional)",
    "placeholder_password": "Password",
    "placeholder_confirmPassword": "Confirm Password",
    "button_signup": "Sign Up",
    "login_prompt": "Already have an account?",
    "link_login": "Login",
    "page_title": "Create Account"
  }
};

/**
 * دالة لتحديث واجهة الصفحة بناءً على اللغة المختارة
 */
function updateTexts() {
  // تحديث العناصر التي تحمل data-translate
  document.querySelectorAll("[data-translate]").forEach(function(el) {
    el.textContent = polyglot.t(el.getAttribute("data-translate"));
  });

  // تحديث placeholder للعناصر التي تحمل data-translate-placeholder
  document.querySelectorAll("[data-translate-placeholder]").forEach(function(el) {
    el.setAttribute("placeholder", polyglot.t(el.getAttribute("data-translate-placeholder")));
  });

  // تحديث عنوان الصفحة
  const pageTitle = polyglot.t("page_title");
  if (pageTitle && pageTitle !== "page_title") {
    document.title = pageTitle;
  }
}

/**
 * دالة لتعيين اللغة (ar أو en) وتحديث الواجهة
 */
function setLanguage(lang) {
  currentLang = lang;
  polyglot.replace(translations[lang]);  // تحميل الترجمة للغة المختارة
  updateTexts();

  // تحديث شكل زر اللغة
  var langSwitchBtn = document.getElementById("lang-switch");
  if (langSwitchBtn) {
    langSwitchBtn.innerHTML = (lang === "ar")
      ? '<i class="fa-solid fa-globe lang-icon"></i><span class="lang-text">العربية</span>'
      : '<i class="fa-solid fa-globe lang-icon"></i><span class="lang-text">English</span>';
  }

  // **استدعاء دالة populateCountrySelect لإعادة تعبئة قائمة الدول بناءً على اللغة**
  if (typeof populateCountrySelect === 'function') {
    populateCountrySelect();
  }
}

// عند تحميل الصفحة لأول مرة، نحدد اللغة الافتراضية (عربية)
document.addEventListener("DOMContentLoaded", function() {
  setLanguage("ar"); // يمكنك تغييرها إلى "en" إذا أردت البدء بالإنجليزية

  // إضافة مستمع للزر لتبديل اللغة
  var langSwitchBtn = document.getElementById("lang-switch");
  if (langSwitchBtn) {
    langSwitchBtn.addEventListener("click", function() {
      if (currentLang === "ar") {
        setLanguage("en");
      } else {
        setLanguage("ar");
      }
    });
  }
});
