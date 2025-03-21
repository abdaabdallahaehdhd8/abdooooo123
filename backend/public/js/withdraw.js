// js/withdraw.js
document.addEventListener("DOMContentLoaded", () => {
  const withdrawMethodSelect = document.getElementById("withdrawMethodSelect");
  const vodafoneCashFields = document.getElementById("vodafoneCashFields");
  const usdtFields = document.getElementById("usdtFields");
  const withdrawButton = document.querySelector(".btn-withdraw");

  // دالة لتحديث عرض الحقول بناءً على الخيار المختار
  function updateFields() {
    const selectedMethod = withdrawMethodSelect.value;
    if (!selectedMethod) {
      vodafoneCashFields.classList.add("d-none");
      usdtFields.classList.add("d-none");
      return;
    }
    if (selectedMethod === "vodafoneCash") {
      vodafoneCashFields.classList.remove("d-none");
      usdtFields.classList.add("d-none");
    } else if (selectedMethod === "usdt") {
      usdtFields.classList.remove("d-none");
      vodafoneCashFields.classList.add("d-none");
    }
  }

  // استدعاء الدالة عند تغيير قيمة القائمة المنسدلة
  withdrawMethodSelect.addEventListener("change", updateFields);

  // دالة لإظهار الرسائل
  function showMessage(msg, type) {
    const messageBox = document.getElementById("message");
    messageBox.className = `alert alert-${type} mt-3 text-center`;
    messageBox.innerHTML = msg;
    messageBox.classList.remove("d-none");
  }

  // عند النقر على زر السحب
  withdrawButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const selectedMethod = withdrawMethodSelect.value;
    const amount = parseFloat(document.getElementById("amount").value);

    let accountNumber = "";
    let usdtAddress = "";
    let usdtNetwork = "";

    // التحقق من اختيار طريقة السحب أولًا
    if (!selectedMethod) {
      showMessage("❌ الرجاء اختيار طريقة السحب أولًا", "danger");
      return;
    }

    // جمع البيانات حسب الطريقة المختارة
    if (selectedMethod === "vodafoneCash") {
      accountNumber = document.getElementById("vodafoneNumber").value.trim();
      if (!accountNumber) {
        showMessage("❌ الرجاء إدخال رقم المحفظة لفودافون كاش", "danger");
        return;
      }
    } else {
      usdtAddress = document.getElementById("usdtAddress").value.trim();
      usdtNetwork = document.getElementById("usdtNetwork").value.trim();
      if (!usdtAddress || !usdtNetwork) {
        showMessage("❌ الرجاء إدخال عنوان المحفظة واسم الشبكة", "danger");
        return;
      }
    }

    if (!amount || amount <= 0) {
      showMessage("❌ الرجاء إدخال مبلغ صحيح", "danger");
      return;
    }

    try {
      // في حال استخدام توكن للمصادقة
      const token = localStorage.getItem("token");

      // إرسال الطلب للخادم
      const response = await fetch("http://localhost:5080/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          withdrawMethod: selectedMethod,
          accountNumber,     // في حالة Vodafone Cash
          usdtAddress,       // في حالة USDT
          usdtNetwork,       // في حالة USDT
          amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "حدث خطأ أثناء معالجة الطلب");
      }

      const data = await response.json();
      showMessage(`✅ تم تقديم طلب سحب بقيمة ${amount} بنجاح!`, "success");

      // تفريغ الحقول
      document.getElementById("vodafoneNumber").value = "";
      document.getElementById("usdtAddress").value = "";
      document.getElementById("usdtNetwork").value = "";
      document.getElementById("amount").value = "";
      withdrawMethodSelect.value = "";
      updateFields(); // إخفاء الحقول مرة أخرى
    } catch (error) {
      showMessage(`❌ ${error.message}`, "danger");
    }
  });
});
