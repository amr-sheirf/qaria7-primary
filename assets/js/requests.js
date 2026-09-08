/* نموذج طلبات وشكاوى أولياء الأمور */

function initRequestsPage() {
  const form = document.getElementById("requestForm");
  form.addEventListener("submit", handleRequestSubmit);
}

async function handleRequestSubmit(e) {
  e.preventDefault();
  const stateEl = document.getElementById("reqState");
  const btn = document.getElementById("reqSubmitBtn");

  const payload = {
    action: "addRequest",
    name: document.getElementById("reqName").value.trim(),
    phone: document.getElementById("reqPhone").value.trim(),
    address: document.getElementById("reqAddress").value.trim(),
    type: document.getElementById("reqType").value,
    message: document.getElementById("reqMessage").value.trim(),
    date: new Date().toLocaleString("ar-EG")
  };

  if (!payload.name || !payload.phone || !payload.message) {
    setState(stateEl, "error", "الرجاء تعبئة جميع الحقول المطلوبة (*)");
    return;
  }

  btn.disabled = true;
  btn.textContent = "جارٍ الإرسال ...";
  setState(stateEl, "loading", "جارٍ إرسال طلبكم إلى إدارة المدرسة ...");

  try {
    const res = await postToAppsScript(payload);
    if (res && res.ok) {
      setState(stateEl, "info", "تم إرسال طلبكم بنجاح، سيتم التواصل معكم عند الحاجة. شكرًا لتواصلكم مع المدرسة.");
      document.getElementById("requestForm").reset();
    } else {
      setState(stateEl, "error", "تعذّر إرسال الطلب. الرجاء المحاولة مرة أخرى أو التواصل هاتفيًا مع المدرسة.");
    }
  } catch (err) {
    if (err.message === "CONFIG_NOT_SET") {
      setState(stateEl, "error", "لم يتم ربط نموذج الطلبات بعد. الرجاء إضافة رابط تطبيق Apps Script في ملف assets/js/config.js.");
    } else {
      setState(stateEl, "error", "حدث خطأ أثناء الإرسال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "إرسال إلى إدارة المدرسة";
  }
}
