document.addEventListener("DOMContentLoaded", function () {
  fetchTeamStats();
  fetchTeamMembers();
});

/**
 * دالة جلب إحصائيات الفريق
 */
async function fetchTeamStats() {
  const token = localStorage.getItem("token");
  if (!token) {
    // عرض رسالة الخطأ من ملف الترجمة
    console.error(polyglot.t("no_token"));
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5080/api/users/team-stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    if (!response.ok) {
      // إن لم يعد السيرفر رسالة خطأ محددة في data.error، نستخدم المفتاح من ملف الترجمة
      console.error(data.error || polyglot.t("team_stats_fetch_error"));
      return;
    }

    // تحويل القيم إلى أرقام مع تقريب خانتين
    const dailyDepositUSD    = parseFloat(data.dailyDepositUSD || 0).toFixed(2);
    const dailyDepositEGP    = parseFloat(data.dailyDepositEGP || 0).toFixed(2);
    const monthlyDepositUSD  = parseFloat(data.monthlyDepositUSD || 0).toFixed(2);
    const monthlyDepositEGP  = parseFloat(data.monthlyDepositEGP || 0).toFixed(2);
    const totalDepositUSD    = parseFloat(data.totalDepositUSD || 0).toFixed(2);
    const totalDepositEGP    = parseFloat(data.totalDepositEGP || 0).toFixed(2);
    const dailyProfitUSD     = parseFloat(data.dailyProfitUSD || 0).toFixed(2);
    const dailyProfitEGP     = parseFloat(data.dailyProfitEGP || 0).toFixed(2);
    const monthlyProfitUSD   = parseFloat(data.monthlyProfitUSD || 0).toFixed(2);
    const monthlyProfitEGP   = parseFloat(data.monthlyProfitEGP || 0).toFixed(2);
    const totalProfitUSD     = parseFloat(data.totalProfitUSD || 0).toFixed(2);
    const totalProfitEGP     = parseFloat(data.totalProfitEGP || 0).toFixed(2);
    const dailyReferralUSD   = parseFloat(data.dailyReferralUSD || 0).toFixed(2);
    const dailyReferralEGP   = parseFloat(data.dailyReferralEGP || 0).toFixed(2);
    const monthlyReferralUSD = parseFloat(data.monthlyReferralUSD || 0).toFixed(2);
    const monthlyReferralEGP = parseFloat(data.monthlyReferralEGP || 0).toFixed(2);
    const totalReferralUSD   = parseFloat(data.totalReferralUSD || 0).toFixed(2);
    const totalReferralEGP   = parseFloat(data.totalReferralEGP || 0).toFixed(2);

    // تعيينها في العناصر
    // إيداع يومي
    document.getElementById("team-daily-deposit-usdt").textContent = `${dailyDepositUSD} USDT`;
    document.getElementById("team-daily-deposit-egp").textContent  = `${dailyDepositEGP} EGP`;

    // إيداع شهري
    document.getElementById("team-monthly-deposit-usdt").textContent = `${monthlyDepositUSD} USDT`;
    document.getElementById("team-monthly-deposit-egp").textContent  = `${monthlyDepositEGP} EGP`;

    // إيداع إجمالي
    document.getElementById("team-total-deposit-usdt").textContent = `${totalDepositUSD} USDT`;
    document.getElementById("team-total-deposit-egp").textContent  = `${totalDepositEGP} EGP`;

    // ربح يومي
    document.getElementById("team-daily-profit-usdt").textContent = `${dailyProfitUSD} USDT`;
    document.getElementById("team-daily-profit-egp").textContent  = `${dailyProfitEGP} EGP`;

    // ربح شهري
    document.getElementById("team-monthly-profit-usdt").textContent = `${monthlyProfitUSD} USDT`;
    document.getElementById("team-monthly-profit-egp").textContent  = `${monthlyProfitEGP} EGP`;

    // ربح إجمالي
    document.getElementById("team-total-profit-usdt").textContent = `${totalProfitUSD} USDT`;
    document.getElementById("team-total-profit-egp").textContent  = `${totalProfitEGP} EGP`;

    // إحالة يومي
    document.getElementById("team-daily-referral-usdt").textContent = `${dailyReferralUSD} USDT`;
    document.getElementById("team-daily-referral-egp").textContent  = `${dailyReferralEGP} EGP`;

    // إحالة شهري
    document.getElementById("team-monthly-referral-usdt").textContent = `${monthlyReferralUSD} USDT`;
    document.getElementById("team-monthly-referral-egp").textContent  = `${monthlyReferralEGP} EGP`;

    // إحالة إجمالي
    document.getElementById("team-total-referral-usdt").textContent = `${totalReferralUSD} USDT`;
    document.getElementById("team-total-referral-egp").textContent  = `${totalReferralEGP} EGP`;

  } catch (error) {
    console.error(polyglot.t("team_stats_catch_error"), error);
  }
}

/**
 * دالة جلب قائمة الأعضاء المحالين
 */
async function fetchTeamMembers() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error(polyglot.t("no_token"));
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5080/api/users/referred-users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    const tableBody = document.getElementById("team-table-body");
    tableBody.innerHTML = "";

    // حالة عدم وجود بيانات
    if (!data || Object.keys(data).length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td data-i18n="no_referred_members" colspan="5" style="text-align: center;">
            ${polyglot.t("no_referred_members")}
          </td>
        </tr>
      `;
      return;
    }

    function addMembersToTable(members, level) {
      // لو المصفوفة فارغة
      if (members.length === 0) {
        tableBody.innerHTML += `
          <tr>
            <td data-i18n="no_level_members" colspan="5" style="text-align: center;">
              ${polyglot.t("no_level_members", { value: level })}
            </td>
          </tr>
        `;
        return;
      }
    
      // حدد مفتاح الترجمة بناءً على رقم المستوى
      const levelKey = `member_level_${level}`;
    
      members.forEach((member) => {
        const row = document.createElement("tr");
        let maskedPhone = "••••••" + member.phone.slice(-6);
        const referralProfit = parseFloat(member.referralProfit || 0).toFixed(2);
    
        // عرض المستوى كـ "المستوى الأول" أو "Level 1" حسب اللغة
        row.innerHTML = `
          <td>${member.name}</td>
          <td>${polyglot.t(levelKey)}</td>
          <td>${maskedPhone}</td>
          <td>${new Date(member.createdAt).toLocaleDateString()}</td>
          <td>${referralProfit} $</td>
        `;
        tableBody.appendChild(row);
      });
    }
    

    if (data.level1) addMembersToTable(data.level1, 1);
    if (data.level2) addMembersToTable(data.level2, 2);
    if (data.level3) addMembersToTable(data.level3, 3);

  } catch (error) {
    console.error(polyglot.t("referred_fetch_error"), error);
  }
}
