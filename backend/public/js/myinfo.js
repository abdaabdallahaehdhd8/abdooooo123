// myinfo.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert(
      "⚠️ " +
        (window.polyglot ? window.polyglot.t("login_required") : "يجب تسجيل الدخول أولاً!")
    );
    window.location.href = "login.html";
    return;
  }

  fetchUserProfile(token);
  fetchUserPackages(token);
});

function fetchUserProfile(token) {
  fetch("http://localhost:5080/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        console.error("❌", data.error);
        return;
      }
      document.getElementById("userName").textContent =
        data.name || (window.polyglot ? window.polyglot.t("not_available") : "غير متوفر");
      document.getElementById("userEmail").textContent =
        data.email || (window.polyglot ? window.polyglot.t("not_available") : "غير متوفر");
      document.getElementById("userPhone").textContent =
        data.phone || (window.polyglot ? window.polyglot.t("not_available") : "غير متوفر");
    })
    .catch((error) => {
      console.error("❌ خطأ أثناء جلب بيانات المستخدم:", error);
    });
}

function fetchUserPackages(token) {
  fetch("http://localhost:5080/api/packages/user-packages", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((userPackages) => {
      const packageList = document.getElementById("packageList");
      packageList.innerHTML = "";
      if (!userPackages || userPackages.length === 0) {
        packageList.innerHTML =
          "<li class='list-group-item'>" +
          (window.polyglot
            ? window.polyglot.t("no_packages_text")
            : "لا توجد باقات مشترك بها حاليًا.") +
          "</li>";
        return;
      }

      // تحديد اللغة الحالية
      const currentLang = localStorage.getItem("selectedLanguage") || "ar";

      userPackages.forEach((pkg) => {
        // عنصر القائمة
        const li = document.createElement("li");
        li.className = "list-group-item";

        // احسب الأيام المتبقية
        let remainingDays = pkg.days - pkg.daysClaimed;
        if (remainingDays < 0) remainingDays = 0;

        // في حالة populate: pkg.packageId = { name_ar, name_en, days, ... }
        // لو لا تستخدم populate، قد تحتاج إلى حقول pkg.packageName_ar, pkg.packageName_en
        const unknownPackageText = window.polyglot
          ? window.polyglot.t("unknown_package_text")
          : "باقة غير معروفة";

        // اختيار الاسم بناءً على اللغة
        let finalName = unknownPackageText;
        if (pkg.packageId) {
          // إذا كانت الباقة آتية من populate
          finalName =
            currentLang === "en"
              ? pkg.packageId.name_en || pkg.packageId.name_ar
              : pkg.packageId.name_ar || pkg.packageId.name_en;
        } else if (pkg.packageName) {
          // في حال كنا نخزن اسم الباقة في userPackage بشكل مباشر
          finalName = pkg.packageName;
        }

        // تصميم العرض يشبه صفحة الباقات
        li.innerHTML = `
          <strong>${finalName}</strong><br>
          ${
            window.polyglot
              ? window.polyglot.t("package_duration_label")
              : "Total Duration"
          }: ${pkg.days} ${
          window.polyglot ? window.polyglot.t("plan_days_unit") : "Days"
        }<br>
          ${
            window.polyglot
              ? window.polyglot.t("package_remaining_label")
              : "Remaining Days"
          }: <span id="remainingDays-${pkg._id}">${remainingDays}</span> ${
          window.polyglot ? window.polyglot.t("plan_days_unit") : "Days"
        }
        `;

        packageList.appendChild(li);
      });

      subscribeToPackageUpdates();
    })
    .catch((error) => {
      console.error("❌", error);
    });
}

function subscribeToPackageUpdates() {
  const socket = io("http://localhost:5080");
  socket.on("packageUpdated", (data) => {
    const { packageId, remainingDays } = data;
    const remainingDaysElement = document.getElementById(`remainingDays-${packageId}`);
    if (remainingDaysElement) {
      remainingDaysElement.textContent = remainingDays;
    }
  });
}
