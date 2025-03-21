// 📌 inbox.js - جلب الرسائل الخاصة والعامة وتحديثها عبر WebSockets

document.addEventListener("DOMContentLoaded", async function() {
  const inboxContainer = document.getElementById("admin-messages");
  const noMessagesAlert = document.getElementById("no-messages");
  const localUserId = localStorage.getItem("userId"); // تأكد من أنها قيمة نصية

  try {
    // 🔹 جلب الرسائل الخاصة بالمستخدم بالإضافة إلى الرسائل العامة
    const response = await fetch(`http://localhost:5080/api/messages?userId=${localUserId}`);
    if (!response.ok) {
      throw new Error("فشل في جلب البيانات من API");
    }
    const messages = await response.json();
    console.log("📩 الرسائل المسترجعة:", messages);

    // 🔹 فلترة الرسائل: عرض الرسائل العامة أو الرسائل الخاصة بالمستخدم الحالي
    const filteredMessages = messages.filter(msg => {
      let msgUserId = null;
      if (msg.userId) {
        // إذا كانت الرسالة مُعبأة (populated)، قد يأتي userId على هيئة كائن { _id: "..." }
        msgUserId = msg.userId._id ? msg.userId._id.toString() : msg.userId.toString();
      }
      return msg.type === "general" || (msg.type === "private" && msgUserId === localUserId);
    });

    if (filteredMessages.length === 0) {
      noMessagesAlert.style.display = "block";
    } else {
      renderMessages(filteredMessages);
    }

    // 🔹 الاتصال بـ WebSocket لتحديث الرسائل في الوقت الفعلي
    const socket = io("http://localhost:5080");
    
    socket.on("newMessage", (message) => {
      console.log("📩 استلام رسالة جديدة:", message);
      let messageUserId = null;
      if (message.userId) {
        // نفس المنطق للتحقق مما إذا كان userId كائن أو نص
        messageUserId = message.userId._id ? message.userId._id.toString() : message.userId.toString();
      }
      // عرض الرسائل العامة أو الخاصة بالمستخدم فقط
      if (
        message.type === "general" ||
        (message.type === "private" && messageUserId === localUserId)
      ) {
        renderMessages([message], true);
      }
    });

  } catch (error) {
    console.error("⚠️ خطأ في جلب الرسائل:", error);
    noMessagesAlert.textContent = "حدث خطأ أثناء تحميل الرسائل.";
    noMessagesAlert.style.display = "block";
  }
});

// 🔹 دالة عرض الرسائل
function renderMessages(messages, append = false) {
  const inboxContainer = document.getElementById("admin-messages");
  if (!append) inboxContainer.innerHTML = ""; // مسح الرسائل القديمة إذا لم يكن append

  messages.forEach(msg => {
    const messageItem = document.createElement("div");
    messageItem.className = "list-group-item list-group-item-action flex-column align-items-start mb-2";
    messageItem.setAttribute("data-id", msg._id);

    // 🔹 تخصيص لون بناءً على نوع الرسالة
    switch (msg.type) {
      case "admin": 
        messageItem.classList.add("list-group-item-primary");
        break;
      case "deposit_request": 
        messageItem.classList.add("list-group-item-info");
        break;
      case "deposit_accepted": 
        messageItem.classList.add("list-group-item-success");
        break;
      case "withdraw_request": 
        messageItem.classList.add("list-group-item-warning");
        break;
      case "withdraw_accepted": 
        messageItem.classList.add("list-group-item-success");
        break;
      case "package_purchased": 
        messageItem.classList.add("list-group-item-primary");
        break;
      case "daily_profit": 
        messageItem.classList.add("list-group-item-success");
        break;
      case "referral_profit": 
        messageItem.classList.add("list-group-item-dark");
        break;
      case "private": 
        messageItem.classList.add("list-group-item-secondary");
        break;
      default:
        messageItem.classList.add("list-group-item-light");
    }

    messageItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-1">${msg.title}</h5>
        <small>${new Date(msg.time).toLocaleString()}</small>
      </div>
      <p class="mb-1">${msg.text}</p>
      <button class="btn btn-danger btn-sm delete-message" data-id="${msg._id}">حذف</button>
    `;

    // 🔹 إضافة الرسالة في بداية القائمة
    inboxContainer.prepend(messageItem);
  });

  // إضافة مستمع لأزرار الحذف
  document.querySelectorAll(".delete-message").forEach(button => {
    button.addEventListener("click", async function() {
      const messageId = this.getAttribute("data-id");
      await deleteMessage(messageId);
    });
  });
}

// 🔹 دالة حذف الرسائل من الواجهة
function removeMessageFromUI(messageId) {
  const messageItem = document.querySelector(`[data-id='${messageId}']`);
  if (messageItem) {
    messageItem.remove();
  }
}

// 🔹 دالة إرسال طلب حذف الرسالة إلى السيرفر
async function deleteMessage(messageId) {
  try {
    const response = await fetch(`http://localhost:5080/api/messages/${messageId}`, {
      method: "DELETE"
    });
    if (response.ok) {
      removeMessageFromUI(messageId);
    } else {
      console.error("⚠️ فشل في حذف الرسالة من السيرفر");
    }
  } catch (error) {
    console.error("⚠️ خطأ أثناء محاولة حذف الرسالة:", error);
  }
}
