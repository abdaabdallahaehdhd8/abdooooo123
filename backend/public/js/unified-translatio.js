var currentLang = "ar";         // اللغة الافتراضية
var polyglot = new Polyglot();  // إنشاء كائن Polyglot

// مجموعة الترجمة لصفحة تسجيل الدخول
var loginTranslations = {
  ar: {
    "page_title": "تسجيل الدخول",
    "loginTitle": "تسجيل الدخول",
    "identifierLabel": "البريد أو رقم الهاتف",
    "identifierPlaceholder": "أدخل بريدك الإلكتروني أو رقم هاتفك",
    "passwordLabel": "كلمة المرور",
    "passwordPlaceholder": "أدخل كلمة المرور",
    "rememberLabel": "تذكرني",
    "forgotPassword": "نسيت كلمة المرور؟",
    "loginButton": "تسجيل الدخول",
    "noAccount": "ليس لديك حساب؟",
    "signupLink": "إنشاء حساب"
  },
  en: {
    "page_title": "Login",
    "loginTitle": "Login",
    "identifierLabel": "Email or Phone",
    "identifierPlaceholder": "Enter your email or phone number",
    "passwordLabel": "Password",
    "passwordPlaceholder": "Enter your password",
    "rememberLabel": "Remember me",
    "forgotPassword": "Forgot your password?",
    "loginButton": "Login",
    "noAccount": "Don't have an account?",
    "signupLink": "Sign up"
  }
};

// مجموعة الترجمة لصفحة التسجيل
var registerTranslations = {
  ar: {
    "page_title": "إنشاء حساب",
    "header_title": "إنشاء حساب جديد",
    "placeholder_fullname": "الاسم بالكامل",
    "placeholder_email": "البريد الإلكتروني",
    "placeholder_phone": "رقم الهاتف",
    "placeholder_referral": "كود الإحالة (اختياري)",
    "placeholder_password": "كلمة المرور",
    "placeholder_confirmPassword": "تأكيد كلمة المرور",
    "button_signup": "إنشاء حساب",
    "login_prompt": "لديك حساب بالفعل؟",
    "link_login": "تسجيل الدخول"
  },
  en: {
    "page_title": "Create Account",
    "header_title": "Create New Account",
    "placeholder_fullname": "Full Name",
    "placeholder_email": "Email",
    "placeholder_phone": "Phone Number",
    "placeholder_referral": "Referral Code (Optional)",
    "placeholder_password": "Password",
    "placeholder_confirmPassword": "Confirm Password",
    "button_signup": "Sign Up",
    "login_prompt": "Already have an account?",
    "link_login": "Login"
  }
};

// تحديد أي مجموعة ترجمة نستخدمها بناءً على وجود عناصر في الصفحة
var translations;
if (document.getElementById("loginForm")) {
  translations = loginTranslations;
} else if (document.getElementById("registerForm")) {
  translations = registerTranslations;
} else {
  // افتراضيًا نستخدم مجموعة التسجيل
  translations = registerTranslations;
}

/**
 * دالة لتحديث واجهة الصفحة باستخدام Polyglot
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
  var pageTitle = polyglot.t("page_title");
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

  // تغيير اتجاه الصفحة بناءً على اللغة
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";

  // استدعاء دالة populateCountrySelect لإعادة تعبئة قائمة الدول (إذا كانت موجودة)
  if (typeof populateCountrySelect === 'function') {
    populateCountrySelect();
  }
}

// عند تحميل الصفحة لأول مرة، نحدد اللغة الافتراضية ونضيف مستمع لتبديل اللغة
document.addEventListener("DOMContentLoaded", function() {
  setLanguage("ar"); // يمكن تغييرها إلى "en" إذا أردت البدء بالإنجليزية

  var langSwitchBtn = document.getElementById("lang-switch");
  if (langSwitchBtn) {
    langSwitchBtn.addEventListener("click", function() {
      setLanguage(currentLang === "ar" ? "en" : "ar");
    });
  }
});
