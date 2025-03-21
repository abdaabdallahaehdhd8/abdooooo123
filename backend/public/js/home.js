// زر الإشعارات
document.getElementById("notifications-btn").addEventListener("click", function () {
    document.getElementById("notifications-box").classList.toggle("hidden");
});

// زر تغيير اللغة
document.getElementById("language-btn").addEventListener("click", function () {
    let langText = document.getElementById("language-text");
    let welcomeText = document.getElementById("welcome-text");
    let descriptionText = document.getElementById("description-text");
    let noNotifications = document.getElementById("no-notifications");

    if (langText.innerText === "العربية") {
        langText.innerText = "English";
        document.documentElement.lang = "en";
        welcomeText.innerText = "Welcome to the Dashboard";
        descriptionText.innerText = "This is a simple dashboard where you can manage your settings.";
        noNotifications.innerText = "No new notifications";
    } else {
        langText.innerText = "العربية";
        document.documentElement.lang = "ar";
        welcomeText.innerText = "مرحبًا بك في لوحة التحكم";
        descriptionText.innerText = "هذه لوحة تحكم بسيطة يمكنك التحكم في الإعدادات الخاصة بك.";
        noNotifications.innerText = "لا توجد إشعارات جديدة";
    }
});
// عند تحميل الصفحة، يظهر إشعار للمستخدم
window.onload = function () {
    document.getElementById("notification-modal").style.display = "flex";
};

// زر إغلاق الإشعار
document.getElementById("close-notification").addEventListener("click", function () {
    document.getElementById("notification-modal").style.display = "none";
});
document.addEventListener("DOMContentLoaded", function () {
    let carousel = document.querySelector("#hero-carousel");
    let carouselInstance = new bootstrap.Carousel(carousel, {
        interval: 4000, // تغيير الشريحة كل 5 ثوانٍ
        ride: "carousel"
    });
});
document.addEventListener("DOMContentLoaded", function () {
    let notificationText = document.getElementById("scrolling-notification-text");
    let currentIndex = 0;

    // بيانات وهمية للإشعارات
    let mockNotifications = [
        "🎉 ألف مبروك لـ 15619***** على إحالة عضو وربح 1200 جنيه!",
        "🎉 تهانينا لـ 98765***** لفوزه بعرض خاص!",
        "🎉 تم ترقية حساب 45678***** إلى المستوى الذهبي!"
    ];

    // تحديث الإشعار المتحرك
    function updateNotification() {
        notificationText.innerText = mockNotifications[currentIndex];
        currentIndex = (currentIndex + 1) % mockNotifications.length;
    }

    // عرض أول إشعار عند تحميل الصفحة
    updateNotification();

    // تغيير الإشعار كل 5 ثوانٍ
    setInterval(updateNotification, 5000);
});
