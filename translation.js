// التأكد من أن Polyglot.js متاح قبل استخدامه
if (typeof Polyglot === "undefined") {
    console.error("❌ Polyglot.js لم يتم تحميله! تأكد من تضمين المكتبة قبل `translation.js`.");
} else {
    console.log("✅ Polyglot.js تم تحميله بنجاح!");
}

// تعيين اللغة الافتراضية بناءً على `localStorage` أو العربية كافتراضية
let currentLocale = localStorage.getItem("selectedLanguage") || "ar";

// دالة لتحميل ملف الترجمة بناءً على اللغة المختارة
async function loadTranslation(locale) {
    try {
        // افرض أن ملفات الترجمة موجودة داخل مجلد locales/ كـ messages_ar.json و messages_en.json
        const response = await fetch(`locales/messages_${locale}.json`);
        if (!response.ok) {
            console.warn(`⚠️ لم يتم العثور على ملف الترجمة: messages_${locale}.json (status: ${response.status})`);
            return {};
        }

        const translations = await response.json();
        console.log(`✅ تم تحميل ملف الترجمة (${locale}):`, translations);
        return translations;
    } catch (error) {
        console.error("❌ خطأ أثناء تحميل الترجمة:", error);
        return {};
    }
}

// دالة لتحديث النصوص بناءً على الترجمة المحملة
function updateTranslations() {
    // ابحث عن كل عنصر يحمل data-i18n
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (window.polyglot && typeof window.polyglot.t === "function") {
            // لو كان العنصر حقل إدخال (مثل input أو textarea)، نحدّث placeholder
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = window.polyglot.t(key) || key;
            } else {
                // وإلا نستبدل الـ innerHTML بالنص المترجم
                element.innerHTML = window.polyglot.t(key) || key;
            }
        }
    });

    // تحديث عنوان الصفحة لو يوجد مفتاح page_title في الترجمة
    if (window.polyglot && typeof window.polyglot.t === "function") {
        const pageTitle = window.polyglot.t("page_title");
        if (pageTitle && pageTitle !== "page_title") {
            document.title = pageTitle;
        }
    }
}

// تهيئة الترجمة عند تحميل الصفحة
async function initTranslations() {
    console.log("⌛ جاري تهيئة الترجمة للغة:", currentLocale);
    const translationData = await loadTranslation(currentLocale);

    // تهيئة Polyglot مع الترجمات المحملة
    window.polyglot = new Polyglot({
        phrases: translationData,
        locale: currentLocale,
    });

    // نحدّث النصوص على الصفحة
    updateTranslations();

    // لو زر اللغة موجود، حدّث نصه
    const languageTextElement = document.getElementById("language-text");
    if (languageTextElement && translationData["language_name"]) {
        languageTextElement.textContent = translationData["language_name"];
    }

    // ضبط لغة واتجاه الصفحة
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";

    console.log("✅ تمت تهيئة الترجمة للغة:", currentLocale);
}

// دالة لتبديل اللغة
async function toggleLanguage() {
    // تبديل بين ar و en
    currentLocale = currentLocale === "ar" ? "en" : "ar";
    // حفظ اللغة المختارة
    localStorage.setItem("selectedLanguage", currentLocale);

    console.log(`⌛ جارٍ تبديل اللغة إلى: ${currentLocale}`);
    // تحميل ملف الترجمة الجديد
    const translationData = await loadTranslation(currentLocale);

    // تحديث عبارات polyglot
    window.polyglot.replace(translationData);

    // تحديث النصوص في الصفحة
    updateTranslations();

    // تحديث نص زر اللغة
    const languageTextElement = document.getElementById("language-text");
    if (languageTextElement && translationData["language_name"]) {
        languageTextElement.textContent = translationData["language_name"];
    }

    // ضبط لغة واتجاه الصفحة
    document.documentElement.lang = currentLocale;
    document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";

    console.log(`✅ تم تبديل اللغة بنجاح إلى: ${currentLocale}`);
}

// بدء التهيئة عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", initTranslations);
