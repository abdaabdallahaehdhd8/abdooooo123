// register.js

// مصفوفة برموز الدول العربية (رمز البلد "cca2" من REST Countries)
const ARABIC_COUNTRY_CODES = [
  "SA","EG","AE","QA","KW","BH","OM","IQ","JO","SY",
  "LB","PS","MA","DZ","TN","LY","SD","YE"
];

let allCountries = []; // لتخزين بيانات الدول

/**
 * جلب بيانات الدول من REST Countries API
 * fields = name, translations, idd, flags, cca2
 */
async function fetchCountriesData() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,translations,idd,flags,cca2");
    const countries = await response.json();
    allCountries = countries;
  } catch (err) {
    console.error("خطأ أثناء جلب بيانات الدول:", err);
  }
}

/**
 * تعبئة قائمة الدول وفق اللغة الحالية (currentLang) المعرّفة في translatio.js
 */
function populateCountrySelect() {
  const selectCountry = document.getElementById("countryCode");
  const countryFlag = document.getElementById("countryFlag");
  const phoneInput = document.getElementById("phone");

  if (!selectCountry || !allCountries.length) return;

  // تفريغ القائمة قبل إعادة تعبئتها
  selectCountry.innerHTML = "";

  // تقسيم الدول إلى عربية وغيرها
  const arabCountries = allCountries.filter((c) =>
    c.cca2 && ARABIC_COUNTRY_CODES.includes(c.cca2.toUpperCase())
  );
  const otherCountries = allCountries.filter((c) =>
    !c.cca2 || !ARABIC_COUNTRY_CODES.includes(c.cca2.toUpperCase())
  );

  if (currentLang === "ar") {
    // في حالة اللغة العربية:
    // 1) ترتيب الدول العربية بالإنجليزية (حتى يكون ثابتًا مع الإنجليزي) 
    arabCountries.sort((a, b) => {
      const nameA = a.translations?.eng?.common || a.name.common;
      const nameB = b.translations?.eng?.common || b.name.common;
      return nameA.localeCompare(nameB);
    });

    // 2) ترتيب الدول الأخرى بالإنجليزية كذلك
    otherCountries.sort((a, b) => {
      const nameA = a.translations?.eng?.common || a.name.common;
      const nameB = b.translations?.eng?.common || b.name.common;
      return nameA.localeCompare(nameB);
    });

    // 3) دمج المصفوفتين (العربية أولًا)
    const finalCountries = [...arabCountries, ...otherCountries];

    // 4) تعبئة القائمة مع عرض الاسم بالعربي (إن وجد)
    finalCountries.forEach((country) => {
      const root = country.idd?.root;
      const suffixes = country.idd?.suffixes;
      if (root && suffixes && suffixes.length > 0) {
        const code = root + suffixes[0];
        const option = document.createElement("option");
        option.value = code;

        // نعرض الاسم العربي إن وجد، وإلا الاسم الافتراضي
        const displayName = country.translations?.ara?.common || country.name.common;
        option.textContent = `${displayName} (${code})`;

        if (country.flags && country.flags.png) {
          option.dataset.flag = country.flags.png;
        }
        selectCountry.appendChild(option);
      }
    });
  } else {
    // في حالة اللغة الإنجليزية:
    // 1) ترتيب الدول العربية بالإنجليزية
    arabCountries.sort((a, b) => {
      const nameA = a.translations?.eng?.common || a.name.common;
      const nameB = b.translations?.eng?.common || b.name.common;
      return nameA.localeCompare(nameB);
    });

    // 2) ترتيب الدول الأخرى بالإنجليزية
    otherCountries.sort((a, b) => {
      const nameA = a.translations?.eng?.common || a.name.common;
      const nameB = b.translations?.eng?.common || b.name.common;
      return nameA.localeCompare(nameB);
    });

    // 3) دمج المصفوفتين (العربية أولًا)
    const finalCountries = [...arabCountries, ...otherCountries];

    // 4) تعبئة القائمة مع عرض الاسم الإنجليزي
    finalCountries.forEach((country) => {
      const root = country.idd?.root;
      const suffixes = country.idd?.suffixes;
      if (root && suffixes && suffixes.length > 0) {
        const code = root + suffixes[0];
        const option = document.createElement("option");
        option.value = code;

        // نعرض الاسم الإنجليزي إن وجد، وإلا الاسم الافتراضي
        const displayName = country.translations?.eng?.common || country.name.common;
        option.textContent = `${displayName} (${code})`;

        if (country.flags && country.flags.png) {
          option.dataset.flag = country.flags.png;
        }
        selectCountry.appendChild(option);
      }
    });
  }

  // عند تغيير الاختيار في القائمة
  selectCountry.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.dataset.flag) {
      countryFlag.src = selectedOption.dataset.flag;
      countryFlag.style.display = "inline-block";
    } else {
      countryFlag.style.display = "none";
    }

    let currentPhone = phoneInput.value;
    // نزيل أي كود سابق
    currentPhone = currentPhone.replace(/^\+?\d+\s?/, "");
    phoneInput.value = `${this.value} ${currentPhone}`.trim();
  });

  // ضبط القيمة الافتراضية
  if (selectCountry.options.length > 0) {
    selectCountry.selectedIndex = 0;
    selectCountry.dispatchEvent(new Event("change"));
  }
}

/**
 * معالجة حدث إرسال النموذج (التسجيل)
 */
async function handleRegisterSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phoneField = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const referralCode = document.getElementById("referralCode").value;

  // تحقق من طول كلمة المرور
  if (password.length < 8) {
    alert("❌ يجب أن تكون كلمة المرور 8 أحرف على الأقل!");
    return;
  }
  // تحقق من تطابق كلمتي المرور
  if (password !== confirmPassword) {
    alert("❌ كلمة المرور غير متطابقة!");
    return;
  }

  const fullPhone = phoneField.replace(/\s+/, " ");
  const userData = {
    name,
    email,
    phone: fullPhone,
    password,
    referralCode: referralCode || null,
  };

  try {
    // استبدل هذا الرابط بالرابط الخاص بخادمك
    const response = await fetch("http://localhost:5080/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ تم التسجيل بنجاح!");
      window.location.href = "login.html";
    } else {
      alert(`❌ فشل التسجيل: ${data.error || "حدث خطأ ما"}`);
    }
  } catch (error) {
    alert("❌ خطأ في الاتصال بالخادم");
    console.error(error);
  }
}

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", async function () {
  // جلب بيانات الدول
  await fetchCountriesData();

  // تعبئة القائمة بناءً على اللغة الحالية (currentLang من translatio.js)
  populateCountrySelect();

  // ربط حدث إرسال النموذج
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }
});
