document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
  
    // إذا كان المستخدم قد سجل دخولًا بالفعل (أي أن التوكن موجود)
    if (localStorage.getItem("token")) {
      window.location.href = "profile.html"; // إذا كان التوكن موجودًا، اذهب مباشرة لصفحة البروفايل
      return;
    }
  
    if (!loginForm) return;
  
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
  
      // الحصول على البريد/الهاتف + كلمة المرور
      const identifier = document.getElementById("identifierPlaceholder").value;
      const password = document.getElementById("passwordPlaceholder").value;
  
      try {
        const response = await fetch("http://localhost:5080/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }), 
        });
  
        const data = await response.json();
  
        if (response.ok) {
          // حفظ التوكن في localStorage
          localStorage.setItem("token", data.token);
          alert("✅ تسجيل الدخول ناجح!");
  
          // إعادة توجيه المستخدم إلى صفحة البروفايل بعد تسجيل الدخول
          window.location.href = "profile.html";
        } else {
          alert(`❌ خطأ: ${data.error}`);
        }
      } catch (error) {
        alert("❌ حدث خطأ أثناء تسجيل الدخول.");
        console.error(error);
      }
    });
  });
  