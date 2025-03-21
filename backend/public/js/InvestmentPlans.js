// public/js/InvestmentPlans.js

window.onload = function () {
  const packagesContainer = document.getElementById("packages-container");

  // دالة لجلب الباقات من السيرفر
  const fetchPackages = async () => {
    try {
      const response = await fetch("http://localhost:5080/api/packages");
      const packages = await response.json();

      if (packages && packages.length > 0) {
        packagesContainer.innerHTML = "";

        packages.forEach((packageData) => {
          // 1) تحديد اللغة الحالية
          const currentLang = localStorage.getItem("selectedLanguage") || "ar";

          // 2) اختيار الاسم المناسب حسب اللغة
          const finalName =
            currentLang === "en"
              ? packageData.name_en || packageData.name_ar
              : packageData.name_ar || packageData.name_en;

          // إنشاء عنصر العرض
          const packageDiv = document.createElement("div");
          packageDiv.classList.add("package");

          // محتوى العنصر، مع ترتيب الحقول
          packageDiv.innerHTML = `
            <img 
              src="${packageData.imageUrl || 'default-image.jpg'}" 
              alt="${finalName}" 
              class="package-image"
            >

            <h3>${finalName}</h3>

            <!-- السعر والربح اليومي بالجنيه -->
            <p class="price">
              ${
                window.polyglot 
                  ? window.polyglot.t("plan_price_label")
                  : "السعر"
              }:
              ${packageData.price} ${
                window.polyglot
                  ? window.polyglot.t("currency_egp")
                  : "جنيه"
              }
            </p>
            <p class="daily-profit">
              ${
                window.polyglot
                  ? window.polyglot.t("plan_daily_profit")
                  : "الربح اليومي"
              }:
              ${packageData.dailyProfit} ${
                window.polyglot
                  ? window.polyglot.t("currency_egp")
                  : "جنيه"
              }
            </p>

           <!-- ضمن الكود الخاص بـ packageDiv.innerHTML -->
<p class="price-usdt">
  ${
    window.polyglot
      ? window.polyglot.t("plan_price_usdt_label")
      : "price usdt"
  }: ${packageData.price_usdt || 0} USDT
</p>
<p class="daily-profit-usdt">
  ${
    window.polyglot
      ? window.polyglot.t("plan_daily_profit_usdt_label")
      : "daily profit usdt"
  }: ${packageData.dailyProfit_usdt || 0} USDT
</p>


            <p>
              ${
                window.polyglot 
                  ? window.polyglot.t("plan_days_count")
                  : "عدد الأيام"
              }:
              ${packageData.days}
              ${
                window.polyglot
                  ? window.polyglot.t("plan_days_unit")
                  : "يوم"
              }
            </p>

            <button class="btn" onclick="handlePurchase(
              '${packageData._id}',
              '${finalName}',  
              ${packageData.price},
              ${packageData.isUSDT},
              ${packageData.dailyProfit},
              ${packageData.days}
            )">
              ${
                window.polyglot
                  ? window.polyglot.t("plan_buy_button")
                  : "شراء"
              }
            </button>
          `;

          packagesContainer.appendChild(packageDiv);
        });
      } else {
        packagesContainer.innerHTML = `<p>${
          window.polyglot
            ? window.polyglot.t("no_investment_plans")
            : "❌ لا توجد باقات حاليًا."
        }</p>`;
      }
    } catch (error) {
      console.error("❌ خطأ في جلب الباقات:", error);
      packagesContainer.innerHTML = `<p>${
        window.polyglot
          ? window.polyglot.t("plans_fetch_error")
          : "❌ حدث خطأ أثناء جلب الباقات."
      }</p>`;
    }
  };

  // تنفيذ جلب الباقات عند تحميل الصفحة
  fetchPackages();

  // دالة شراء الباقة
  window.handlePurchase = function (
    packageId,
    packageName,
    packagePrice,
    isUSDT,
    dailyProfit,
    days
  ) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(
        window.polyglot
          ? window.polyglot.t("login_required")
          : "❌ يجب تسجيل الدخول أولاً."
      );
      return;
    }

    // جلب رصيد المستخدم
    fetch("http://localhost:5080/api/user-balances", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        let userBalance = data.balance;
        let userUSDTBalance = data.usdtBalance;

        // التحقق من الرصيد بناءً على العملة
        if (isUSDT) {
          if (userUSDTBalance < packagePrice) {
            alert(
              window.polyglot
                ? window.polyglot.t("insufficient_usdt_balance")
                : "❌ ليس لديك رصيد كافٍ من USDT..."
            );
            return;
          }
        } else {
          if (userBalance < packagePrice) {
            alert(
              window.polyglot
                ? window.polyglot.t("insufficient_balance")
                : "❌ ليس لديك رصيد كافٍ لإتمام عملية الشراء."
            );
            return;
          }
        }

        // خصم مبلغ الشراء
        fetch("http://localhost:5080/api/user-balances/purchase", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ purchaseAmount: packagePrice }),
        })
          .then((res) => res.json())
          .then((balanceResponse) => {
            if (balanceResponse.error) {
              alert(balanceResponse.error);
              return;
            }

            // تسجيل عملية شراء الباقة
            const dataToSend = {
              packageId,
              packageName,
              packagePrice,
              isUSDT,
              dailyProfit,
              days,
            };
            fetch("http://localhost:5080/api/packages/purchase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(dataToSend),
            })
              .then((res) => {
                if (!res.ok) {
                  return res.text();
                }
                return res.json();
              })
              .then((packageResponse) => {
                if (typeof packageResponse === "string") {
                  console.error("❌ خطأ في الخادم:", packageResponse);
                  alert(
                    window.polyglot
                      ? window.polyglot.t("server_error")
                      : "❌ حدث خطأ في الخادم."
                  );
                } else {
                  if (packageResponse.message === "✅ تم شراء الباقة بنجاح!") {
                    alert(
                      window.polyglot
                        ? window.polyglot.t("plan_purchase_success")
                        : `✅ تم شراء الباقة بنجاح!\nرصيدك الجديد: ${balanceResponse.balance}`
                    );
                  } else {
                    alert(
                      window.polyglot
                        ? window.polyglot.t("plan_purchase_failed")
                        : "❌ حدث خطأ أثناء شراء الباقة"
                    );
                  }
                }
              })
              .catch((error) => {
                console.error("❌ خطأ أثناء شراء الباقة:", error);
                alert(
                  window.polyglot
                    ? window.polyglot.t("server_error")
                    : "❌ حدث خطأ أثناء الاتصال بالخادم"
                );
              });
          })
          .catch((error) => {
            console.error("❌ خطأ أثناء خصم المبلغ:", error);
            alert(
              window.polyglot
                ? window.polyglot.t("server_error")
                : "❌ حدث خطأ أثناء خصم المبلغ"
            );
          });
      })
      .catch((error) => {
        console.error("❌ خطأ في جلب الرصيد:", error);
        alert(
          window.polyglot
            ? window.polyglot.t("server_error")
            : "❌ حدث خطأ أثناء جلب الرصيد"
        );
      });
  };
};
