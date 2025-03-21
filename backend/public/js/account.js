document.addEventListener("DOMContentLoaded", async () => {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    alert("❌ يجب تسجيل الدخول أولاً.");
    window.location.href = "login.html";
    return;
  }

  // جلب بيانات المستخدم من السيرفر
  try {
    const res = await fetch("http://localhost:5080/api/users/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`❌ فشل في الاتصال بالـ API: ${res.status}`);
    const data = await res.json();
    console.log("بيانات المستخدم:", data);

    // تحديث بيانات الإيداع
    if (
      data.dailyDeposit === undefined ||
      data.monthlyDeposit === undefined ||
      data.totalDeposit === undefined
    ) {
      console.error("❌ البيانات الخاصة بالإيداع غير موجودة في الـ API");
    } else {
      updateDepositData(data);
    }

    // تحديث بيانات الربح والإحالة
    updateStats(data);

    // جلب سعر الدولار لتحويل الرصيد إلى USDT
    const rateRes = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const rateData = await rateRes.json();
    const usdtRate = rateData.rates.EGP;

    // تحويل رصيد المستخدم من جنيه إلى USDT مع تقريب رقمين بعد الفاصلة
    const usdtBalance = parseFloat(data.balance / usdtRate || 0).toFixed(2);
    // تقريب الرصيد بالجنيه
    const localBalance = parseFloat(data.balance || 0).toFixed(2);

    // عرض الرصيد في الصفحة
    document.querySelector(
      ".balance-container .balance-box:nth-child(1) .balance-amount"
    ).textContent = localBalance;
    document.querySelector(
      ".balance-container .balance-box:nth-child(2) .balance-amount"
    ).textContent = usdtBalance;

    // تخزين القيم في data-attributes لاستخدامها مع currency.js
    const balanceEgpElem = document.getElementById("balance-egp");
    balanceEgpElem.setAttribute("data-egp", localBalance);
    balanceEgpElem.setAttribute("data-usdt", usdtBalance);
    const balanceUsdtElem = document.getElementById("balance-usdt");
    balanceUsdtElem.setAttribute("data-egp", localBalance);
    balanceUsdtElem.setAttribute("data-usdt", usdtBalance);

    // إعداد عملة المستخدم في القائمة (إن وُجد) لتكون قيمة العرض الحالية
    const currencySelect = document.getElementById("preferred-currency");
    if (currencySelect) {
      currencySelect.value = data.preferredCurrency || "egp";
    }
  } catch (error) {
    console.error("❌ خطأ في جلب البيانات:", error);
  }

  // إعداد WebSocket لتحديث البيانات في الوقت الفعلي (اختياري)
  const socket = io("http://localhost:5080");
  socket.on("depositUpdated", (data) => {
    console.log("تم تحديث بيانات الإيداع عبر WebSocket:", data);
    updateDepositData(data);
    updateStats(data);
  });

  // إضافة كود تسجيل الخروج
  const logoutButton = document.querySelector(".logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", function (event) {
      event.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  // تم إزالة وظيفة حفظ العملة المفضلة (زر "حفظ") من هذا الملف
});

/**
 * تحديث بيانات الإيداع (اليومي/الشهري/الإجمالي)
 */
function updateDepositData(data) {
  const dailyDepositElem = document.getElementById("daily-deposit");
  const monthlyDepositElem = document.getElementById("monthly-deposit");
  const totalDepositElem = document.getElementById("total-deposit");

  if (dailyDepositElem) {
    dailyDepositElem.textContent = parseFloat(data.dailyDeposit || 0).toFixed(2);
  }
  if (monthlyDepositElem) {
    monthlyDepositElem.textContent = parseFloat(data.monthlyDeposit || 0).toFixed(2);
  }
  if (totalDepositElem) {
    totalDepositElem.textContent = parseFloat(data.totalDeposit || 0).toFixed(2);
  }
}

/**
 * تحديث بيانات الربح والإحالة (اليومي/الشهري/الإجمالي)
 */
function updateStats(data) {
  console.log("تحديث الربح والإحالة:", data);

  // تحديث رقم الهاتف (إن وجد)
  const userPhoneElem = document.getElementById("user-phone");
  if (userPhoneElem) {
    userPhoneElem.textContent = data.phone || "غير متوفر";
  }

  // تحديث الربح
  document.getElementById("daily-profit").textContent = parseFloat(data.dailyProfit || 0).toFixed(2);
  document.getElementById("monthly-profit").textContent = parseFloat(data.monthlyProfit || 0).toFixed(2);
  document.getElementById("total-profit").textContent = parseFloat(data.totalProfit || 0).toFixed(2);

  // تحديث ربح الإحالة
  document.getElementById("daily-referral").textContent = parseFloat(data.dailyReferral || 0).toFixed(2);
  document.getElementById("monthly-referral").textContent = parseFloat(data.monthlyReferral || 0).toFixed(2);
  document.getElementById("total-referral").textContent = parseFloat(data.totalReferral || 0).toFixed(2);
}
