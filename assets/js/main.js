/* =========================================================
   main.js — الملف الرئيسي لدوال المساعدة وجلب البيانات
   مدرسة قرية 7 الابتدائية
   ========================================================= */

/**
 * جلب وتحليل ملف CSV من Google Sheets مع تحويل التشفير إلى UTF-8
 * لمنع ظهور الرموز الغريبة وضمان قراءة اللغة العربية بشكل صحيح.
 */
async function fetchSheetCSV(url) {
  if (!url || url.includes("YOUR_") || url.includes("EXAMPLE_")) {
    throw new Error("CONFIG_NOT_SET");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`فشل الجلب من السيرفر: ${response.status}`);
    }

    // قراءة البيانات كـ Buffer ثم تحويلها صراحة بترميز UTF-8
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("utf-8");
    const csvText = decoder.decode(buffer);

    return new Promise((resolve, reject) => {
      if (typeof Papa === "undefined") {
        reject(new Error("مكتبة PapaParse غير محملة في الصفحة."));
        return;
      }

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: function (h) {
          // تنظيف عناوين الأعمدة من أي رموز خفية أو مسافات زائدة
          return h ? h.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, "") : "";
        },
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn("تحذيرات أثناء تحليل CSV:", results.errors);
          }
          resolve(results.data || []);
        },
        error: (err) => reject(err)
      });
    });
  } catch (err) {
    console.error("خطأ أثناء جلب ملف CSV:", err);
    throw err;
  }
}

/**
 * قراءة قيمة حقل من كائن محدد مع دعم مسميات متعددة للعمود (عربي / إنجليزي)
 */
function readField(obj, ...possibleKeys) {
  if (!obj || typeof obj !== "object") return "";

  for (const key of possibleKeys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return String(obj[key]).trim();
    }
  }

  // البحث المرن في حال وجود اختلافات بسيطة في المسافات
  const objKeys = Object.keys(obj);
  for (const key of possibleKeys) {
    const matchedKey = objKeys.find(
      (k) => k.trim().toLowerCase() === key.trim().toLowerCase()
    );
    if (matchedKey && obj[matchedKey] !== undefined && obj[matchedKey] !== null) {
      return String(obj[matchedKey]).trim();
    }
  }

  return "";
}

/**
 * تحديث حالة الواجهة (تحميل / نجاح / تنبيه / خطأ)
 */
function setState(element, type, message) {
  if (!element) return;

  const icons = {
    loading: '<i class="fas fa-spinner fa-spin"></i>',
    info: '<i class="fas fa-info-circle"></i>',
    error: '<i class="fas fa-exclamation-triangle"></i>',
    success: '<i class="fas fa-check-circle"></i>'
  };

  const alertClasses = {
    loading: "alert-info",
    info: "alert-warning",
    error: "alert-danger",
    success: "alert-success"
  };

  const icon = icons[type] || "";
  const alertClass = alertClasses[type] || "alert-info";

  element.className = `alert ${alertClass} text-center my-3`;
  element.innerHTML = `${icon} <span>${escapeHtml(message)}</span>`;
}

/**
 * تنظيف النصوص لمنع ثغرات XSS عند عرض البيانات في HTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * إعداد الأحداث العامة عند تحميل الصفحة
 */
document.addEventListener("DOMContentLoaded", () => {
  // تحديث بيانات الترويسة والتواصل من ملف config.js تلقائياً
  if (typeof CONFIG !== "undefined" && CONFIG.SCHOOL) {
    const s = CONFIG.SCHOOL;
    
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };

    setTxt("schoolName", s.name);
    setTxt("ministryName", s.ministry);
    setTxt("deptName", s.department);
    setTxt("welcomeText", s.welcome);
    setTxt("schoolAddress", s.address);
    setTxt("schoolPhone", s.phone);
    setTxt("schoolEmail", s.email);

    const waBtn = document.getElementById("whatsappLink");
    if (waBtn && s.whatsapp) {
      waBtn.href = `https://wa.me/${s.whatsapp}`;
    }

    const fbBtn = document.getElementById("facebookLink");
    if (fbBtn && s.facebook) {
      fbBtn.href = s.facebook;
    }
  }

  // تشغيل تحميل الأخبار تلقائياً إذا كانت الدالة موجودة والصفحة تحتوي على مستوعب الأخبار
  if (typeof loadNews === "function" && document.getElementById("newsState")) {
    loadNews();
  }
});
