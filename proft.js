// دالة لتشغيل العجلة عند الضغط على الزر
function spinWheel() {
    let name = prompt("🎟️ أدخل اسمك للمشاركة:");
    if (!name) return; // إذا لم يدخل المستخدم الاسم، لا يتم تشغيل العجلة

    let wheel = document.getElementById("wheel");
    let message = document.getElementById("message");

    // تحديد دوران عشوائي بين 720 درجة و 3600 درجة لضمان عدة دورات كاملة
    let randomRotation = Math.floor(Math.random() * 3600) + 720;

    // تطبيق التحويل للدوران
    wheel.style.transition = "transform 3s ease-out"; // حركة سلسة
    wheel.style.transform = `rotate(${randomRotation}deg)`;

    // انتظار 3 ثواني حتى تنتهي الحركة ثم إظهار رسالة تأكيد
    setTimeout(() => {
        message.innerText = `✅ ${name}، تم المشاركة بنجاح! انتظار السحب.`;
    }, 3000);
}

// التأكد من تحميل الصفحة قبل تنفيذ الجافا سكريبت
document.addEventListener("DOMContentLoaded", () => {
    let button = document.querySelector("button");
    button.addEventListener("click", spinWheel);
});
