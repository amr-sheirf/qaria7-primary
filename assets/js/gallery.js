/* PDF search helper - Search for case files (صحف الحالة) by case code
   Expected HTML IDs to be added in the page where you want the UI:
     - pdfState (optional)
     - pdfSearchContainer (container where input+button will be injected)
     - pdfResult (area to show notes/result)

   Behavior: when user enters a case code and clicks "بحث" (or presses Enter), this script
   searches the local PDF files in assets/PDFs/ folder and opens the matching PDF directly.
*/

const PDF_CONFIG = {
  mode: 'local_files', // 'local_files' or 'drive_search'
  DRIVE_SEARCH_BASE: 'https://drive.google.com/drive/u/0/search?q=',
  PDF_FILES: [
    '1172140', '1173905', '1175595', '1177976', '1193242',
    '2171764', '2201077', '2202903', '2211277', '2216641',
    '2814884', '2815347', '2817449', '2818229', '2818265',
    '2820829', '2825423', '2829881', '2911348', '2926233',
    '2926355', '2927030', '2927458', '2932391', '2932506',
    '2932509', '2932515', '2932516', '3026925', '3079691',
    '3091188', '3105319', '3480610', '3695674'
  ]
};

function initGalleryPage() {
  // Set up the PDF-code search UI. Use clear element IDs for integration.
  const stateEl = document.getElementById('pdfState');
  if (stateEl) stateEl.innerHTML = '';

  const container = document.getElementById('pdfSearchContainer');
  if (!container) return; // nothing to do if container missing

  container.innerHTML = `
    <div class="pdf-search-row">
      <input id="pdfCodeInput" class="pdf-input" type="text" placeholder="أدخل رمز الحالة" aria-label="رمز الحالة">
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
    resultEl.innerHTML = `<div class="pdf-note">الرجاء إدخال رمز الحالة ثم الضغط على &quot;بحث&quot;.</div>`;
    return;
  }

  // Check if the code exists in our local PDF files
  if (PDF_CONFIG.PDF_FILES.includes(code)) {
    const pdfUrl = `assets/PDFs/${code}.pdf`;
    window.open(pdfUrl, '_blank');
    resultEl.innerHTML = `<div class="pdf-note">✓ تم فتح صحيفة الحالة برمز <strong>${escapeHtmlSafe(code)}</strong> في تبويب جديد.</div>`;
    return;
  }

  // If not found in local files, show error
  resultEl.innerHTML = `<div class="pdf-note error">✗ لم يتم العثور على صحيفة حالة برمز <strong>&quot;${escapeHtmlSafe(code)}&quot;</strong>. يرجى التحقق من الرمز.</div>`;
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
