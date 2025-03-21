
document.addEventListener("DOMContentLoaded", function() {
  // تحميل الفوتر بشكل ديناميكي
  fetch("footer.html")
    .then(response => response.text())
    .then(html => {
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      // تحديث الترجمات بعد إضافة الفوتر (تأكد من تعريف updateTranslations في مكان آخر)
      if (typeof updateTranslations === "function") {
        updateTranslations();
      }
    })
    .catch(err => console.error("خطأ في تحميل الفوتر:", err));

  // تحميل رسائل الأدمن إلى الـ Inbox
  const adminMessages = [
    { text: "مرحباً، لديك رسالة جديدة من الإدارة.", time: "منذ دقيقة واحدة" },
    { text: "نرجو مراجعة تفاصيل حسابك.", time: "منذ 10 دقائق" }
  ];

  // عنصر يحتوي على رسائل الـ Inbox
  const inboxContainer = document.getElementById("admin-messages");

  // إنشاء عناصر الرسائل وإضافتها إلى الـ inboxContainer
  adminMessages.forEach(msg => {
    const messageItem = document.createElement("a");
    messageItem.href = "#";
    messageItem.className = "list-group-item list-group-item-action flex-column align-items-start mb-2";
    messageItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <p class="mb-1">${msg.text}</p>
        <small>${msg.time}</small>
      </div>
    `;
    inboxContainer.appendChild(messageItem);
  });
});

