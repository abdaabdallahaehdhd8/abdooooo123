 // 1) جلب بيانات المستخدم (للحصول على referralCode) ووضعه في حقل referral-link
 document.addEventListener("DOMContentLoaded", async function() {
  try {
    // استرجاع التوكن من Local Storage (إذا كان موجوداً)
    const token = localStorage.getItem("token");

    // طلب بيانات المستخدم
    const response = await fetch("http://127.0.0.1:5080/api/users/profile", {
      headers: {
        "Authorization": token ? `Bearer ${token}` : ""
      }
    });

    if (!response.ok) {
      throw new Error("فشل في جلب بيانات المستخدم");
    }

    const userData = await response.json();
    const userID = userData.referralCode;
    const referralLink = `${window.location.origin}/register.html?ref=${userID}`;
    document.getElementById("referral-link").value = referralLink;
  } catch (error) {
    console.error("خطأ في جلب بيانات المستخدم:", error);
    // في حال عدم توفر التوكن أو حدوث خطأ، نضع رابط افتراضي
    document.getElementById("referral-link").value =
      `${window.location.origin}/register.html?ref=GUEST`;
  }

  // زر النسخ
  document.getElementById("copy-link").addEventListener("click", function() {
    const copyText = document.getElementById("referral-link");
    copyText.select();
    document.execCommand("copy");
    alert("تم نسخ رابط الإحالة!");
  });
});


// 2) حساب التاريخ المستهدف بإضافة 3 شهور لتاريخ اليوم
const now = new Date();
const targetDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate(), 0, 0, 0);

// دالة لتحديث مؤقت العد التنازلي
function updateCountdown() {
  const currentTime = new Date();
  const diff = targetDate - currentTime;

  // إذا انتهى الوقت، يتم عرض "00" لجميع القيم وإيقاف التحديث
  if (diff < 0) {
    document.getElementById("days").textContent = "00";
    document.getElementById("hours").textContent = "00";
    document.getElementById("minutes").textContent = "00";
    document.getElementById("seconds").textContent = "00";
    clearInterval(countdownInterval);
    return;
  }

  // حساب الأيام والساعات والدقائق والثواني المتبقية
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // تحديث عناصر HTML بالقيم مع تنسيق الأرقام لتظهر برقمين دائمًا
  document.getElementById("days").textContent = String(days).padStart(2, '0');
  document.getElementById("hours").textContent = String(hours).padStart(2, '0');
  document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
  document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');
}

// تحديث المؤقت كل ثانية
const countdownInterval = setInterval(updateCountdown, 1000);
// استدعاء الدالة فور تحميل الصفحة لعرض الوقت مباشرةً
updateCountdown();


// 3) تحميل ترتيب الإحالات (أفضل 10) وعرضه في قائمة
// ملاحظة: رقم المستخدم الحالي عادةً يأتي من الـ backend أو Local Storage
// سنجرب هنا ثابتا كنموذج
const currentUserId = "1234";

async function loadRanking() {
  const rankingListContainer = document.querySelector('.ranking-list');
  rankingListContainer.innerHTML = "";

  try {
    // نجلب التوكن الفعلي المخزّن بعد تسجيل الدخول
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("لا يوجد توكن مخزن. يجب تسجيل الدخول أولاً.");
    }

    const response = await fetch("http://127.0.0.1:5080/api/users/referral-ranking", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`فشل في جلب بيانات الترتيب. الحالة: ${response.status}`);
    }

    const rankingData = await response.json();

    rankingData.forEach((item, index) => {
      const rankingItem = document.createElement('div');
      rankingItem.classList.add('ranking-item');
      rankingItem.title = "ترتيبك: " + (index + 1);

      let displayUserId;
      // لو أردتَ مقارنة بـ userId فعلي، استعمل userId الذي حصلت عليه من الـ backend
      if (item.userId === currentUserId) {
        rankingItem.classList.add('current-user');
        displayUserId = item.userId;
      } else {
        // إخفاء جزء من userId
        displayUserId = "****" + String(item.userId).slice(-4);
      }

      rankingItem.innerHTML = `
        <span class="rank">${index + 1}</span>
        <span class="name">${item.name} (${displayUserId})</span>
        <span class="referrals">${item.referralCount} إحالة</span>
      `;
      rankingListContainer.appendChild(rankingItem);
    });
  } catch (error) {
    console.error("حدث خطأ أثناء تحميل بيانات الترتيب:", error);
    rankingListContainer.innerHTML = "<p>حدث خطأ أثناء تحميل بيانات الترتيب.</p>";
  }
}

document.addEventListener('DOMContentLoaded', loadRanking);