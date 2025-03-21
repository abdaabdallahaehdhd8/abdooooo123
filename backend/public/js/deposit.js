// عناصر HTML
const walletSelect = document.getElementById("paymentMethod");
const walletDetails = document.getElementById("walletDetails");
const depositForm = document.getElementById("depositForm");
const depositAmount = document.getElementById("amount");
const receiverNumber = document.getElementById("receiverNumber");
const walletImage = document.getElementById("walletImage");
const senderNumber = document.getElementById("senderNumber");
const proofImageInput = document.getElementById("proofImage");
const submitButton = document.getElementById("submitButton");
const messageDiv = document.getElementById("message");
const userBalanceElement = document.getElementById("userBalance");
const depositHistoryDiv = document.getElementById("depositHistory"); // لعرض السجل

// عناصر USDT
const usdtFields = document.getElementById("usdtFields");
const networkNameInput = document.getElementById("networkName");
const networkAddressInput = document.getElementById("networkAddress");
const qrCodeImage = document.getElementById("qrCode");

// عنصر لعرض اسم الملف المختار (إن وُجد في HTML)
const fileChosenSpan = document.getElementById("fileChosen");

proofImageInput.addEventListener("change", function() {
  if (proofImageInput.files && proofImageInput.files.length > 0) {
    fileChosenSpan.textContent = proofImageInput.files[0].name;
  } else {
    // استخدم المفتاح no_file_chosen للترجمة
    fileChosenSpan.textContent = window.polyglot
      ? window.polyglot.t("no_file_chosen")
      : "لم يتم اختيار أي ملف";
  }
});

// حقول الهاتف
const phoneFields = document.getElementById("phoneFields");

// متغيرات الحالة
let userBalance = 0;
let localWallets = [];
let usdtWallets = [];
let minDepositEGP = 50;
let minDepositUSDT = 10;
let currentMinDeposit = 50;

let isSubmitting = false;

// حقل لمعاينة الصورة قبل الرفع
let proofPreview = null; // عنصر <img> للمعاينة

// دالة عرض الرسالة
function showMessage(msgKey, isSuccess = true) {
  if (!messageDiv) return;
  
  const translatedMessage = window.polyglot ? window.polyglot.t(msgKey) : msgKey;
  messageDiv.innerHTML = `
    <div class="alert ${isSuccess ? "alert-success" : "alert-danger"}">
      ${translatedMessage}
    </div>`;
}

// مصفوفة لسجل الإيداع
let depositLogs = [];

// دالة لإضافة سجل جديد (عند تقديم طلب إيداع ناجح في نفس الجلسة)
function addDepositLog(method, amount) {
  const logEntry = {
    time: new Date().toLocaleString(),
    method,
    amount
  };
  depositLogs.push(logEntry);
  renderDepositHistory();
}

// دالة لعرض السجل في الصفحة (تُظهر آخر عملية فقط)
function renderDepositHistory() {
  if (!depositHistoryDiv) return;
  
  // في حال لا يوجد أي سجل إيداع
  if (depositLogs.length === 0) {
    depositHistoryDiv.innerHTML = `<p style='text-align:center'>
      ${window.polyglot ? window.polyglot.t("deposit_no_logs") : "لا يوجد سجل إيداع حتى الآن."}
    </p>`;
    return;
  }

  // بعد الفرز التنازلي، العنصر الأول هو الأحدث
  const lastLog = depositLogs[0];

  // تحضير مفتاح الحالة (مثلاً "status_pending") لاستخدامه في الترجمة
  const statusKey = "status_" + (lastLog.status || "pending");
  // تكبير خط الحالة وجعله أكثر بروزًا
  const statusText = window.polyglot 
    ? `<span style="font-size:1.2em; font-weight:bold;">${window.polyglot.t(statusKey)}</span>` 
    : `<span style="font-size:1.2em; font-weight:bold;">${lastLog.status || "قيد المراجعة"}</span>`;

  // إذا أردت المحفظة، عادةً ما تكون في حقل `lastLog.selectedWallet` أو `lastLog.method`
  // هنا نفترض أنها في lastLog.method (مثلاً "محفظة محلية (01095531234)" أو "USDT (TRC20)")
  const walletText = lastLog.selectedWallet || lastLog.method || "غير معروف";

  // تنسيق التاريخ
  const dateText = new Date(lastLog.createdAt || lastLog.time).toLocaleString();

  // تنسيق المبلغ
  const amountText = `${lastLog.amount} ${window.polyglot ? window.polyglot.t("currency_egp") : "جنيه"}`;

  // بناء الجدول بالأيقونات في العناوين (يمكنك تغيير الأيقونات أو إزالتها)
  let html = `
    <table class="table table-bordered table-sm" style="color:#fff; text-align:center;">
      <thead>
        <tr>
          <!-- أيقونة للحالة (مثال: برق ⚡) -->
          <th>
            <span style="margin-right: 5px;">⚡</span>
            ${window.polyglot ? window.polyglot.t("deposit_status_label") : "الحالة"}
          </th>
          <!-- بدلنا نوع العملية بالمحفظة -->
          <th>
            <span style="margin-right: 5px;">🔄</span>
            ${window.polyglot ? window.polyglot.t("deposit_wallet_label") : "المحفظة"}
          </th>
          <!-- أيقونة للتاريخ (مثال: 📅) -->
          <th>
            <span style="margin-right: 5px;">📅</span>
            ${window.polyglot ? window.polyglot.t("deposit_time_label") : "التاريخ"}
          </th>
          <!-- أيقونة للمبلغ (مثال: 💰) -->
          <th>
            <span style="margin-right: 5px;">💰</span>
            ${window.polyglot ? window.polyglot.t("deposit_amount_label") : "المبلغ"}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <!-- الخلية الأولى للحالة مع تنسيق الخط -->
          <td>${statusText}</td>
          <!-- الخلية الثانية للمحفظة -->
          <td>${walletText}</td>
          <!-- الخلية الثالثة للتاريخ -->
          <td>${dateText}</td>
          <!-- الخلية الرابعة للمبلغ -->
          <td>${amountText}</td>
        </tr>
      </tbody>
    </table>
  `;
  
  depositHistoryDiv.innerHTML = html;
}


// دالة لجلب سجل الإيداع من الـ Backend
async function fetchDepositHistory() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch("http://localhost:5080/api/deposits/history", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    if (!response.ok) {
      console.error("❌ خطأ في جلب سجل الإيداع:", data.error || data.message);
      return;
    }

    // نفترض أن data عبارة عن مصفوفة من كائنات الإيداع
    depositLogs = data;
    renderDepositHistory();
    
  } catch (error) {
    console.error("❌ خطأ أثناء جلب سجل الإيداع:", error);
  }
}

// عند تحميل الصفحة، نتحقق من علامة النجاح في localStorage
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("showSuccessMsg") === "true") {
    showMessage("deposit_success", true);
    setTimeout(() => {
      showMessage("", true);
      localStorage.removeItem("showSuccessMsg");
    }, 5000);
  }

  const token = localStorage.getItem("token");
  if (!token) {
    showMessage("login_required", false);
  } else {
    loadSettings();
    fetchUserBalance();
    // جلب سجل الإيداع من الـ Backend
    fetchDepositHistory();
  }
});

// Socket.IO للاستماع لتحديث الرصيد
const socket = io("http://localhost:5080");
socket.on("balanceUpdated", (data) => {
  const storedUserId = localStorage.getItem("userId");
  if (data && typeof data.newLocalBalance === "number" && data.userId === storedUserId) {
    userBalance = data.newLocalBalance;
    if (userBalanceElement) {
      userBalanceElement.textContent =
        `${window.polyglot ? window.polyglot.t("current_balance") : "رصيدك الحالي:"} ${userBalance} ${window.polyglot ? window.polyglot.t("currency_egp") : "جنيه"}`;
    }
  }
});

// جلب رصيد المستخدم
async function fetchUserBalance() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const response = await fetch("http://localhost:5080/api/users/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (response.ok) {
      userBalance = data.balance;
      if (userBalanceElement) {
        userBalanceElement.textContent =
          `${window.polyglot ? window.polyglot.t("current_balance") : "رصيدك الحالي:"} ${userBalance} ${window.polyglot ? window.polyglot.t("currency_egp") : "جنيه"}`;
      }
    } else {
      console.error("❌ خطأ في جلب الرصيد:", data.error);
    }
  } catch (error) {
    console.error("❌ خطأ أثناء جلب البيانات:", error);
  }
}

// جلب الإعدادات (مثل المحافظ المحلية، محافظ USDT، حدود الإيداع)
async function loadSettings() {
  try {
    const response = await fetch("http://localhost:5080/api/settings");
    if (!response.ok) throw new Error("settings_fetch_failed");
    const data = await response.json();

    localWallets = data.localWallets || [];
    usdtWallets = data.usdtWallets || [];
    minDepositEGP = data.minDepositEGP || 50;
    minDepositUSDT = data.minDepositUSDT || 10;
    currentMinDeposit = minDepositEGP;

    updateWalletList();
  } catch (error) {
    console.error("⚠️ خطأ في جلب البيانات:", error);
    showMessage("settings_fetch_error", false);
  }
}

// تحديث قائمة المحافظ
function updateWalletList() {
  walletSelect.innerHTML = "";

  // خيار افتراضي
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = window.polyglot
    ? window.polyglot.t("select_payment_method")
    : "اختر طريقة الدفع...";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  walletSelect.appendChild(placeholderOption);

  // المحافظ المحلية
  localWallets.forEach((wallet) => {
    const option = document.createElement("option");
    option.value = `local-${wallet.number}`;
    const walletKey = wallet.name.toLowerCase().replace(/\s+/g, "_");
    option.textContent = window.polyglot ? window.polyglot.t(walletKey) : wallet.name;
    walletSelect.appendChild(option);
  });

  // محافظ USDT
  usdtWallets.forEach((wallet, index) => {
    const usdtOption = document.createElement("option");
    usdtOption.value = `usdt-${index}`;
    usdtOption.textContent = `USDT (${wallet.network || "Network?"})`;
    walletSelect.appendChild(usdtOption);
  });
}

function handleWalletChange() {
  const selectedValue = walletSelect.value;
  if (!selectedValue) {
    walletDetails.classList.add("d-none");
    usdtFields.classList.add("d-none");
    phoneFields.classList.add("d-none");
    walletImage.style.display = "none";
    receiverNumber.value = "";
    currentMinDeposit = minDepositEGP;
    return;
  }

  walletDetails.classList.add("d-none");
  usdtFields.classList.add("d-none");
  phoneFields.classList.remove("d-none");
  walletImage.style.display = "none";
  receiverNumber.value = "";
  receiverNumber.readOnly = false;

  const [type, identifier] = selectedValue.split("-");
  if (type === "usdt") {
    usdtFields.classList.remove("d-none");
    phoneFields.classList.add("d-none");
    currentMinDeposit = minDepositUSDT;

    const index = parseInt(identifier, 10);
    const wallet = usdtWallets[index];
    if (!wallet) {
      console.error("محفظة USDT غير موجودة بالاندكس:", index);
      return;
    }
    networkNameInput.value = wallet.network || "";
    networkAddressInput.value = wallet.address || "";
    if (wallet.qr) {
      qrCodeImage.src = wallet.qr;
      qrCodeImage.style.display = "block";
    } else {
      qrCodeImage.style.display = "none";
    }
  } else {
    currentMinDeposit = minDepositEGP;
    const wallet = localWallets.find((w) => w.number === identifier);
    if (wallet) {
      walletDetails.classList.remove("d-none");
      receiverNumber.value = wallet.number;
      if (wallet.logo) {
        walletImage.src = wallet.logo;
        walletImage.style.display = "block";
      }
    }
  }
}

// لإضافة معاينة الصورة قبل الإرسال
proofImageInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);
    if (!proofPreview) {
      proofPreview = document.createElement("img");
      proofPreview.style.maxWidth = "100px";
      proofPreview.style.display = "block";
      proofImageInput.parentNode.appendChild(proofPreview);
    }
    proofPreview.src = previewUrl;
  }
});

// عند النقر على زر الإيداع
async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return false;
  isSubmitting = true;

  const amount = parseFloat(depositAmount.value);
  const senderPhone = senderNumber.value;
  const selectedValue = walletSelect.value;
  const proofFile = proofImageInput.files[0];

  if (isNaN(amount) || amount < currentMinDeposit) {
    showMessage("deposit_minimum", false);
    isSubmitting = false;
    return false;
  }
  if (!selectedValue) {
    showMessage("select_payment_required", false);
    isSubmitting = false;
    return false;
  }
  if (!proofFile) {
    showMessage("proof_required", false);
    isSubmitting = false;
    return false;
  }

  const [type, identifier] = selectedValue.split("-");
  const formData = new FormData();
  formData.append("amount", amount);
  formData.append("proofImage", proofFile);

  if (type === "local") {
    if (!senderPhone) {
      showMessage("sender_phone_required", false);
      isSubmitting = false;
      return false;
    }
    formData.append("senderPhone", senderPhone);
    formData.append("selectedWallet", identifier);
  } else if (type === "usdt") {
    const index = parseInt(identifier, 10);
    const wallet = usdtWallets[index];
    if (!wallet) {
      showMessage("wallet_not_found", false);
      isSubmitting = false;
      return false;
    }
    formData.append("networkName", wallet.network || "");
    formData.append("networkAddress", wallet.address || "");
    formData.append("selectedWallet", "usdt");
  }

  try {
    const response = await fetch("http://localhost:5080/api/deposits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      showMessage("deposit_success", true);
      localStorage.setItem("showSuccessMsg", "true");
      fetchUserBalance();
      depositForm.reset();
      proofImageInput.value = "";
      if (proofPreview) {
        proofPreview.remove();
        proofPreview = null;
      }

      // أضف سجل الإيداع (للمعاينة الفورية في نفس الجلسة)
      const depositMethod = (type === "local")
        ? `محفظة محلية (${identifier})`
        : `USDT (${networkNameInput.value || "TRC20/ERC20"})`;

      addDepositLog(depositMethod, `${amount} ${type === "usdt" ? "USDT" : "EGP"}`);

    } else {
      showMessage(data.error || "deposit_failed", false);
    }
  } catch (error) {
    console.error("❌ خطأ في الاتصال بالخادم:", error);
    showMessage("server_error", false);
  } finally {
    isSubmitting = false;
  }
  return false;
}

// بعد تحميل الصفحة
window.onload = () => {
  if (!walletSelect || !depositForm) {
    console.error("❌ أحد العناصر غير موجود في HTML!");
    return;
  }
  walletSelect.addEventListener("change", handleWalletChange);
  submitButton.addEventListener("click", handleSubmit);
};
