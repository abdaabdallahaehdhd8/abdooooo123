// public/js/transactions.js

async function loadTransactions() {
  const tbody = document.getElementById("transactions-body");
  tbody.innerHTML = ""; // مسح البيانات السابقة

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5080/api/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        window.polyglot
          ? window.polyglot.t("transactions_fetch_error")
          : "فشل الاتصال بالخادم"
      );
    }

    const transactions = await response.json();
    console.log("المعاملات:", transactions);

    transactions.forEach((transaction) =>
      addTransactionToTable(transaction, false)
    );
  } catch (error) {
    console.error("❌ خطأ في جلب المعاملات:", error);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="4">
        ${
          window.polyglot
            ? window.polyglot.t("transactions_fetch_error_msg", { error: error.message })
            : "حدث خطأ أثناء جلب البيانات: " + error.message
        }
      </td>`;
    document.getElementById("transactions-body").appendChild(row);
  }
}

/**
 * إضافة صف جديد (Transaction) إلى الجدول
 */
function addTransactionToTable(transaction, isNew = true) {
  const tbody = document.getElementById("transactions-body");
  const row = document.createElement("tr");

  // تحويل نوع المعاملة إلى نص مترجم
  const typeText = translateTransactionType(transaction.type);
  // تحويل الحالة إلى نص مترجم
  const statusHTML = getStatusHTML(transaction.status);

  // currencyText -> مترجم لو كانت "جنيه" عند اللغة الإنجليزية => "Pound"
  const currencyText = translateCurrency(transaction.currency);

  row.innerHTML = `
    <td>${transaction.amount} ${currencyText}</td>
    <td>${formatDate(transaction.date)}</td>
    <td>${typeText}</td>
    <td class="${getStatusClass(transaction.status)}">${statusHTML}</td>
  `;

  // إذا أردت المعاملة الأحدث في الأعلى
  tbody.prepend(row);
}

/**
 * ترجمة نوع المعاملة (إيداع/سحب/مكافأة/etc)
 */
function translateTransactionType(type) {
  const lowerType = (type || "").toLowerCase().trim();
  switch (lowerType) {
    case "إيداع":
    case "deposit":
      return window.polyglot
        ? window.polyglot.t("transaction_type_deposit")
        : "إيداع";
    case "سحب":
    case "withdraw":
      return window.polyglot
        ? window.polyglot.t("transaction_type_withdraw")
        : "سحب";
    case "مكافأة":
    case "مكافاه":
    case "reward":
      return window.polyglot
        ? window.polyglot.t("transaction_type_reward")
        : "مكافأة";
    default:
      return window.polyglot
        ? window.polyglot.t("transaction_type_unknown")
        : "غير معروف";
  }
}

/**
 * ترجمة اسم العملة (مثال: إذا كانت 'جنيه' ونريد عند الإنجليزية إظهار 'Pound')
 */
function translateCurrency(currency) {
  if (!currency) return "";
  const lower = currency.trim().toLowerCase();

  // لو لدينا "جنيه" أو "EGP"
  if (["جنيه", "egp"].includes(lower)) {
    return window.polyglot ? window.polyglot.t("currency_egp") : "جنيه";
  }

  // وإلا نعيد النص كما هو (مثل USDT, USD, إلخ)
  return currency;
}

/**
 * إرجاع الحالة HTML مع أيقونة ولغة
 */
function getStatusHTML(status) {
  const st = (status || "").toLowerCase().trim();
  switch (st) {
    case "approved":
    case "مكتمل":
    case "مقبول":
      return `<span style="font-size:1.2em;color:green;">✔</span> ${
        window.polyglot ? window.polyglot.t("status_approved") : "مكتمل"
      }`;
    case "rejected":
    case "مرفوض":
      return `<span style="font-size:1.2em;color:red;">✘</span> ${
        window.polyglot ? window.polyglot.t("status_rejected") : "مرفوض"
      }`;
    case "pending":
    case "قيد المراجعة":
      return `<span style="font-size:1.2em;color:orange;">↻</span> ${
        window.polyglot ? window.polyglot.t("status_pending") : "قيد المراجعة"
      }`;
    default:
      return window.polyglot
        ? window.polyglot.t("status_unknown")
        : "غير معروف";
  }
}

/**
 * اختيار الـclass المناسب للحالة (للتنسيق CSS)
 */
function getStatusClass(status) {
  const st = (status || "").toLowerCase().trim();
  if (["approved", "مكتمل", "مقبول"].includes(st)) {
    return "status-approved";
  } else if (["rejected", "مرفوض"].includes(st)) {
    return "status-rejected";
  } else if (["pending", "قيد المراجعة"].includes(st)) {
    return "status-pending";
  } else {
    return "status-default";
  }
}

/**
 * تنسيق التاريخ
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Socket.io (لتحديث فوري عند وصول معاملة جديدة)
 */
function setupSocketIO() {
  const socket = io("http://localhost:5080");

  socket.on("connect", () => {
    console.log("✅ تم الاتصال بـ Socket.io بنجاح!");
  });

  socket.on("newTransaction", (transaction) => {
    const userId = localStorage.getItem("userId");
    if (transaction.user === userId) {
      console.log("🔔 تم استلام معاملة جديدة:", transaction);
      addTransactionToTable(transaction, true);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 تم قطع الاتصال بـ Socket.io");
  });
}

// عند تحميل الصفحة
window.onload = function () {
  loadTransactions();
  setupSocketIO();
};
