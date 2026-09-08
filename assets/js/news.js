/* تحميل وعرض الأخبار على الصفحة الرئيسية بنظام "الفلوج والمدونات" */

function parseFlexibleDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// دالة لمعالجة وتصحيح ترميز اللغة العربية المكسور
function fixEncoding(str) {
  if (typeof str !== 'string' || !str) return str || '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

// دالة لتنظيف مفاتيح وقيم الكائن القادم من fetchSheetCSV
function normalizeItem(rawItem) {
  const cleanObj = {};
  if (!rawItem || typeof rawItem !== 'object') return cleanObj;

  for (const key in rawItem) {
    if (Object.prototype.hasOwnProperty.call(rawItem, key)) {
      const cleanKey = fixEncoding(key).trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, '');
      const cleanVal = fixEncoding(rawItem[key]);
      cleanObj[cleanKey] = cleanVal;
    }
  }
  return cleanObj;
}

async function loadNews() {
  const stateEl = document.getElementById("newsState");
  const featureEl = document.getElementById("newsFeature");
  const gridEl = document.getElementById("newsGrid");

  if (stateEl) setState(stateEl, "loading", "جارٍ تحميل الأخبار ...");

  try {
    let rawItems = await fetchSheetCSV(CONFIG.SHEETS_CSV.NEWS);

    if (!Array.isArray(rawItems)) {
      rawItems = [];
    }

    // إصلاح التشفير وتنظيف بيانات الأخبار
    let items = rawItems.map(normalizeItem);

    // استبعاد الصفوف الفارغة أو التي لا تحتوي على عنوان
    items = items.filter(i => {
      const title = readField(i, "العنوان", "Title");
      return title && String(title).trim() !== "";
    });

    // ترتيب الأخبار بحسب التاريخ (الأحدث أولًا)
    items.sort((a, b) => {
      const da = parseFlexibleDate(readField(a, "التاريخ", "Date"));
      const db = parseFlexibleDate(readField(b, "التاريخ", "Date"));
      if (da && db) return db - da;
      return 0;
    });

    if (items.length === 0) {
      if (stateEl) setState(stateEl, "info", "لا توجد أخبار منشورة حاليًا. تابعونا قريبًا.");
      return;
    }

    if (stateEl) stateEl.innerHTML = "";

    // عرض جميع الأخبار بنمط التدوينة / الفلوج الكامل
    const newsHTML = items.map(renderVlogPost).join("");

    if (featureEl) {
      featureEl.innerHTML = newsHTML;
      if (gridEl) gridEl.innerHTML = "";
    } else if (gridEl) {
      gridEl.innerHTML = newsHTML;
    }

  } catch (err) {
    console.error("خطأ أثناء تحميل الأخبار:", err);

    if (err.message === "CONFIG_NOT_SET") {
      if (stateEl) setState(stateEl, "error", "لم يتم ربط شيت الأخبار بعد. الرجاء إضافة الرابط في ملف assets/js/config.js.");
    } else {
      if (stateEl) setState(stateEl, "error", "تعذّر تحميل الأخبار حاليًا، الرجاء المحاولة لاحقًا.");
    }
  }
}

/* تصميم الخبر بنظام الفلوج (عنوان -> تاريخ -> صورة -> تفاصيل النص) */
function renderVlogPost(item) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const details = readField(item, "التفاصيل", "Details", "الملخص", "Summary", "الوصف");
  const date = readField(item, "التاريخ", "Date");

  // تقسيم الأسطر الجديدة لفقرات منسقة
  const formattedDetails = escapeHtml(details)
    .split('\n')
    .filter(p => p.trim() !== "")
    .map(p => `<p style="margin-bottom: 12px; font-size: 1.05rem; line-height: 1.8; color: #333;">${p}</p>`)
    .join("");

  return `
    <article class="vlog-post" style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e9ecef;">
      
      <!-- 1. العنوان -->
      <h2 style="color: #0d6efd; font-size: 1.6rem; font-weight: 700; margin-bottom: 8px;">
        ${escapeHtml(title)}
      </h2>

      <!-- 2. التاريخ -->
      ${date ? `
        <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 16px;">
          📅 <span>${escapeHtml(date)}</span>
        </div>
      ` : ""}

      <!-- 3. الصورة -->
      ${image ? `
        <div style="margin-bottom: 20px; text-align: center; overflow: hidden; border-radius: 8px;">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" style="max-width: 100%; height: auto; max-height: 480px; object-fit: cover; border-radius: 8px;">
        </div>
      ` : ""}

      <!-- 4. التفاصيل والنص -->
      <div class="vlog-body">
        ${formattedDetails}
      </div>

    </article>
  `;
}
