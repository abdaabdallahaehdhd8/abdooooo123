// زر الإشعارات

document.getElementById("notifications-btn").addEventListener("click", function () {
  document.getElementById("notifications-box").classList.toggle("hidden");
});

// عند تحميل الصفحة، نظهر النافذة المنبثقة (Modal)
window.onload = function () {
  document.getElementById("notification-modal").style.display = "flex";
};

// مصفوفة الإعلانات وفهرس الإعلان الحالي
let adsData = [];
let currentAdIndex = 0;

// زر إغلاق الإشعار

document.getElementById("close-notification").addEventListener("click", function () {
  currentAdIndex++;
  showAd(currentAdIndex);
});

// دالة لعرض إعلان في المودال

function showAd(index) {
  const modal = document.getElementById("notification-modal");
  const container = document.getElementById("ads-container");

  if (index >= adsData.length) {
    modal.style.display = "none";
    return;
  }

  modal.style.display = "flex";
  container.innerHTML = "";

  const ad = adsData[index];

  const userLang = localStorage.getItem("selectedLanguage") || "ar";

  const finalTitle = userLang === "en" ? ad.title_en : ad.title_ar;
  const finalContent = userLang === "en" ? ad.content_en : ad.content_ar;

  const adDiv = document.createElement("div");
  adDiv.className = "single-ad";
  adDiv.innerHTML = `
    <h4>${finalTitle || ""}</h4>
    <p>${finalContent || ""}</p>
    ${
      ad.image
        ? `<img src="${ad.image}" alt="إعلان" style="max-width: 150px; margin-top: 10px;" />`
        : ""
    }
    ${ad.active ? "" : "<small>(غير مفعل)</small>"}
    <hr/>
  `;
  container.appendChild(adDiv);
}

// دالة لتحديث إشعارات متحركة

function initMockNotifications() {
  const notificationText = document.getElementById("scrolling-notification-text");
  let currentIndex = 0;

  function updateNotification() {
    notificationText.innerText = window.polyglot
      ? window.polyglot.t(`mock_notify_${currentIndex + 1}`)
      : "";

    currentIndex = (currentIndex + 1) % 3;
  }

  updateNotification();
  setInterval(updateNotification, 5000);
}

// عند اكتمال تحميل الـ DOM

document.addEventListener("DOMContentLoaded", function () {
  let carousel = document.querySelector("#hero-carousel");
  let carouselInstance = new bootstrap.Carousel(carousel, {
    interval: 4000,
    ride: "carousel",
  });

  fetch("http://localhost:5080/api/ads")
    .then((res) => res.json())
    .then((data) => {
      adsData = data;
      if (adsData.length > 0) {
        showAd(currentAdIndex);
      }
    })
    .catch((err) => console.error("خطأ أثناء جلب الإعلانات:", err));

  initMockNotifications();
});

// دالة لاختبار إظهار رسالة في الأقسام المقفولة

function showMessage() {
  if (window.polyglot && typeof window.polyglot.t === "function") {
    alert(polyglot.t("not_available"));
  } else {
    alert("ميزة غير متاحة حاليًا");
  }
}