/* تحميل وعرض الأخبار على الصفحة الرئيسية بنظام "البلوجات" */

function parseFlexibleDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function loadNews() {
  try {
    // 1. جلب الملف كـ Blob للتحكم في الترميز والتشفير
    const response = await fetch(CONFIG.SHEETS_CSV.NEWS);
    const blob = await response.blob();
    
    // 2. قراءة الملف بواسطة FileReader بترميز UTF-8 لدعم اللغة العربية
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const csvText = e.target.result;
      
      // 3. تحليل CSV باستخدام PapaParse مع تفعيل الخيارات الصحيحة
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: function(h) {
          // تنظيف عناوين الأعمدة من أي مسافات أو رموز مخفية
          return h.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, '');
        },
        complete: function(results) {
          const rows = results.data;
          
          if (!rows || rows.length === 0) {
            showNoNewsMessage();
            return;
          }
          
          // تصفية الأخبار والتأكد من وجود عنوان
          const validNews = rows.filter(item => {
            const title = item["العنوان"] || item["title"];
            return title && title.trim() !== "";
          });

          if (validNews.length === 0) {
            showNoNewsMessage();
          } else {
            renderNews(validNews); // دالة عرض الأخبار في صفحتك
          }
        }
      });
    };
    
    // قراءة الملف بترميز UTF-8 الصريح
    reader.readAsText(blob, 'UTF-8');

  } catch (error) {
    console.error("خطأ في قراءة الأخبار:", error);
    showNoNewsMessage();
  }
}
function renderFeature(item) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const summary = readField(item, "الملخص", "الوصف", "Summary");
  const date = readField(item, "التاريخ", "Date");

  return `
    <article class="news-feature">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : ""}
      <div class="body">
        ${date ? `<div class="date">${escapeHtml(date)}</div>` : ""}
        <h3 style="font-size:1.4rem;">${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
      </div>
    </article>
  `;
}

function renderCard(item) {
  const title = readField(item, "العنوان", "Title");
  const image = readField(item, "الصورة", "Image");
  const summary = readField(item, "الملخص", "الوصف", "Summary");
  const date = readField(item, "التاريخ", "Date");

  return `
    <article class="news-card">
      ${image ? `<img class="thumb" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : `<div class="thumb"></div>`}
      <div class="body">
        ${date ? `<div class="date">${escapeHtml(date)}</div>` : ""}
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(summary)}</p>
      </div>
    </article>
  `;
}
