/* PDF search helper - open Google Drive search for a given code (no iframe)
   Expected HTML IDs to be added in the page where you want the UI:
     - pdfState (optional)
     - pdfSearchContainer (container where input+button will be injected)
     - pdfResult (area to show notes/result)

   Behavior: when user enters a code and clicks "بحث" (or presses Enter), this script
   opens a new tab with Google Drive search results for that code. If you later prefer
   direct opening of files, provide a mapping between codes and direct file links and
   switch PDF_CONFIG.mode to 'map'.
*/

const PDF_CONFIG = {
  mode: 'drive_search', // 'drive_search' or 'map'
  DRIVE_FOLDER_ID: '1JV4_EtITiYV7QBQWe3hWUjc4jFJ5YAcb', // your shared folder ID (for reference)
  DRIVE_SEARCH_BASE: 'https://drive.google.com/drive/u/0/search?q=',
  PDF_MAP: {
    // Example mapping (optional): '12345': 'https://drive.google.com/uc?export=download&id=FILE_ID'
  }
};

function initGalleryPage() {
  // Set up the PDF-code search UI. Use clear element IDs for integration.
  const stateEl = document.getElementById('pdfState');
  if (stateEl) stateEl.innerHTML = '';

  const container = document.getElementById('pdfSearchContainer');
  if (!container) return; // nothing to do if container missing

  container.innerHTML = `
    <div class="pdf-search-row">
      <input id="pdfCodeInput" class="pdf-input" type="text" placeholder="أدخل الكود هنا" aria-label="كود">
      <button id="pdfSearchBtn" class="pdf-btn">بحث</button>
    </div>
  `;

  const resultEl = document.getElementById('pdfResult');
  if (resultEl) resultEl.innerHTML = '';

  const input = document.getElementById('pdfCodeInput');
  const btn = document.getElementById('pdfSearchBtn');

  btn.addEventListener('click', () => handleSearch((input && input.value || '').trim()));
  input.addEventListener('keyup', e => { if (e.key === 'Enter') handleSearch((input && input.value || '').trim()); });
}

function handleSearch(code) {
  const resultEl = document.getElementById('pdfResult');
  if (!resultEl) return;

  if (!code) {
    resultEl.innerHTML = `<div class="pdf-note">الرجاء إدخال الكود ثم الضغط على &quot;بحث&quot;.</div>`;
    return;
  }

  // If using mapping mode, prefer direct URL from map
  if (PDF_CONFIG.mode === 'map') {
    const url = PDF_CONFIG.PDF_MAP[code] || null;
    if (!url) {
      resultEl.innerHTML = `<div class="pdf-note">لم يتم العثور على ملف مطابق للكود "${escapeHtmlSafe(code)}" في الخريطة.</div>`;
      return;
    }
    // Open the direct file URL in a new tab
    window.open(url, '_blank');
    resultEl.innerHTML = `<div class="pdf-note">تم فتح الملف المرتبط بالكود ${escapeHtmlSafe(code)} في تبويب جديد.</div>`;
    return;
  }

  // Default: open Google Drive search for the code. This will show results in Drive UI.
  const query = encodeURIComponent(code);
  const searchUrl = PDF_CONFIG.DRIVE_SEARCH_BASE + query;
  window.open(searchUrl, '_blank');

  resultEl.innerHTML = `<div class="pdf-note">يتم البحث عن "${escapeHtmlSafe(code)}" في Google Drive (نافذة جديدة).</div>`;
}

// Helper to escape HTML if escapeHtml is not available in the project
function escapeHtmlSafe(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
