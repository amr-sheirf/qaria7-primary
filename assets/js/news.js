/* تحميل وعرض الأخبار بنظام البطاقات مع نافذة منبثقة (Modal) للتفاصيل */

function parseFlexibleDate(value) {
  if (!value) return null;
  
  let dateStr = String(value).trim();
  let date = null;

  // محاولة صيغة YYYY/MM/DD أو YYYY-MM-DD
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(dateStr)) {
    date = new Date(dateStr.replace(/\//g, '-'));
  }
  // محاولة صيغة DD/MM/YYYY
  else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(dateStr)) {
    const parts = dateStr.split(/[/-]/);
    date = new Date(parts[2], parts[1] - 1, parts[0]);
  }
  // محاولة صيغة افتراضية
  else {
    date = new Date(dateStr);
  }

  return isNaN(date.getTime()) ? null : date;
}

function fixEncoding(str) {
  if (typeof str !== 'string' || !str) return str || '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

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

// دالة لتحويل الروابط في النص إلى روابط قابلة للنقر
function convertUrlsToLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  return text.replace(urlRegex, (url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#0d6efd; text-decoration:underline; cursor:pointer;">${escapeHtml(url)}</a>`;
  });
}

// مصفوفة عامة لحفظ الأخبار لفتحها عند الضغط على البطاقة
window.allNewsItems = [];

async function loadNews() {
  const stateEl = document.getElementById("newsState");
  const featureEl = document.getElementById("newsFeature");
  const gridEl = document.getElementById("newsGrid");

  if (stateEl) setState(stateEl, "loading", "جارٍ تحميل الأخبار ...");

  try {
    let rawItems = await fetchSheetCSV(CONFIG.SHEETS_CSV.NEWS);
    if (!Array.isArray(rawItems)) rawItems = [];

    let items = rawItems.map(normalizeItem);

    items = items.filter(i => {
      const title = readField(i, "العنوان", "Title");
      return title && String(title).trim() !== "";
    });

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

    window.allNewsItems = items;
    injectNewsModal();

    if (gridEl) {
      gridEl.innerHTML = items.map((item, index) => renderNewsCard(item, index)).join("");
      if (featureEl) featureEl.innerHTML = "";
    } else if (featureEl) {
      featureEl.innerHTML = items.map((item, index) => renderNewsCard(item, index)).join("");
    }

  } catch (err) {
    console.error("خطأ أثناء تحميل الأخبار:", err);
    if (err.message === "CONFIG_NOT_SET") {
      if (stateEl) setState(stateEl, "error", "لم يتم ربط شيت الأخبار بعد. الرجاء إضافة الرابط في assets/js/config.js.");
    } else {
      if (stateEl) setState(stateEl, "error", "تعذّر تحميل الأخبار حاليًا، الرجاء المحاولة لاحقًا.");
    }
  }
}

// رسم الكارت الصغير
function renderNewsCard(item, index) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const summary = readField(item, "التفاصيل", "الوصف", "الملخص", "Details", "Summary");
  const date = readField(item, "التاريخ", "Date");

  const shortSummary = summary.length > 90 ? summary.substring(0, 90) + "..." : summary;

  return `
    <article class="news-card" style="background:#fff; border-radius:10px; border:1px solid #e0e0e0; overflow:hidden; display:flex; flex-direction:column; margin-bottom:20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" style="width:100%; height:180px; object-fit:cover;">` : `<div style="height:120px; background:#f0f2f5; display:flex; align-items:center; justify-content:center; color:#999;"><span style="font-size:3rem;">📰</span></div>`}
      
      <div style="padding:15px; display:flex; flex-direction:column; flex-grow:1;">
        ${date ? `<span style="font-size:0.8rem; color:#6c757d; margin-bottom:6px;">📅 ${escapeHtml(date)}</span>` : ""}
        <h3 style="font-size:1.1rem; margin-bottom:10px; color:#2c3e50; font-weight:bold; line-height:1.4;">${escapeHtml(title)}</h3>
        <p style="font-size:0.9rem; color:#555; line-height:1.5; flex-grow:1; margin-bottom:15px;">${escapeHtml(shortSummary)}</p>
        
        <button onclick="openNewsModal(${index})" style="background:#0d6efd; color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:0.88rem; align-self:flex-start;">
          اقرأ المزيد ⬅
        </button>
      </div>
    </article>
  `;
}

function injectNewsModal() {
  if (document.getElementById("newsModalOverlay")) return;

  const modalHTML = `
    <div id="newsModalOverlay" onclick="closeNewsModal(event)" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:9999; align-items:center; justify-content:center;">
      <div id="newsModalContent" onclick="event.stopPropagation()" style="background:#fff; width:100%; max-width:650px; max-height:85vh; border-radius:12px; overflow-y:auto; position:relative; padding:25px; box-shadow:0 10px 25px rgba(0,0,0,0.2); text-align:right; direction:rtl;">
        
        <button onclick="closeNewsModal()" style="position:absolute; top:12px; left:15px; background:none; border:none; font-size:1.6rem; cursor:pointer; color:#777;">&times;</button>
        
        <div id="modalNewsDate" style="font-size:0.85rem; color:#6c757d; margin-bottom:8px;"></div>
        <h2 id="modalNewsTitle" style="color:#0d6efd; font-size:1.4rem; margin-bottom:15px; line-height:1.4;"></h2>
        
        <div id="modalNewsImageContainer" style="margin-bottom:15px; text-align:center;"></div>
        
        <div id="modalNewsBody" style="line-height:1.8; color:#333; font-size:1rem; word-wrap:break-word; overflow-wrap:break-word;"></div>
        
        <div style="margin-top:20px; text-align:left;">
          <button onclick="closeNewsModal()" style="background:#6c757d; color:#fff; border:none; padding:7px 18px; border-radius:6px; cursor:pointer;">إغلاق</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// فتح النافذة المنبثقة وعرض الوصف/التفاصيل بالكامل
window.openNewsModal = function(index) {
  const item = window.allNewsItems[index];
  if (!item) return;

  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  
  // البحث عن النص في أكثر من مسمى محتمل لاسم العمود
  let details = readField(item, "التفاصيل", "الوصف", "الملخص", "Details", "Summary", "Description");
  
  // في حال لم يجد أي مفتاح، يجلب أول نص طويل موجود في الكائن
  if (!details) {
    const keys = Object.keys(item);
    for (const key of keys) {
      if (key !== "العنوان" && key !== "Title" && key !== "التاريخ" && key !== "Date" && key !== "الصورة" && key !== "Image") {
        if (item[key] && item[key].length > 0) {
          details = item[key];
          break;
        }
      }
    }
  }

  document.getElementById("modalNewsTitle").textContent = title;
  document.getElementById("modalNewsDate").textContent = readField(item, "التاريخ", "Date") ? `📅 ${readField(item, "التاريخ", "Date")}` : "";
  
  // تنسيق الأسطر المكسورة وإظهار النص كاملاً مع تحويل الروابط
  const textWithLinks = convertUrlsToLinks(escapeHtml(details));
  const formattedText = textWithLinks
    .split('\n')
    .filter(p => p.trim() !== "")
    .map(p => `<p style="margin-bottom:10px;">${p}</p>`)
    .join("");

  document.getElementById("modalNewsBody").innerHTML = formattedText || "<p class='text-muted'>لا توجد تفاصيل إضافية لهذا الخبر.</p>";

  const imgContainer = document.getElementById("modalNewsImageContainer");
  if (image) {
    imgContainer.innerHTML = `<img src="${escapeHtml(image)}" style="max-width:100%; max-height:350px; border-radius:8px; object-fit:cover;">`;
  } else {
    imgContainer.innerHTML = "";
  }

  const overlay = document.getElementById("newsModalOverlay");
  if (overlay) overlay.style.display = "flex";
};

window.closeNewsModal = function(e) {
  // التحقق من أن الضغط كان على الخلفية فقط وليس على المحتوى
  if (e && e.target.id !== "newsModalOverlay") return;
  
  const overlay = document.getElementById("newsModalOverlay");
  if (overlay) overlay.style.display = "none";
};
