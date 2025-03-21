// ضمن ملف public/js/currency.js

document.getElementById('currency-selector').addEventListener('change', function() {
    const selectedCurrency = this.value;
    localStorage.setItem('preferredCurrency', selectedCurrency);
    updatePageCurrency(selectedCurrency);
  
    // إرسال الطلب إلى الخادم لتحديث الجلسة
    fetch('/setCurrency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currency: selectedCurrency })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));
  });
  