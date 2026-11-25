const featured = document.getElementById('featuredDatasets');
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const menuToggle = document.getElementById('menuToggle');
if (menuToggle) menuToggle.addEventListener('click', () => document.querySelector('.desktop-nav')?.classList.toggle('nav-open'));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function loadFeatured() {
  if (!featured) return;
  try {
    const response = await fetch('/api/datasets?limit=3');
    if (!response.ok) throw new Error('Catalogue unavailable');
    const data = await response.json();
    const items = data.datasets || [];
    if (!items.length) {
      featured.innerHTML = '<div class="catalogue-empty"><span class="empty-icon"><i class="fa-solid fa-box-open"></i></span><strong>No published datasets yet</strong><p>The catalogue is ready. New listings will appear here after providers submit them and an administrator approves them.</p><a class="button button-outline" href="/auth.html?mode=register">Become a data provider</a></div>';
      return;
    }
    featured.innerHTML = items.map(item => `<article class="preview-card"><div class="preview-card-icon"><i class="fa-solid fa-database"></i></div><span class="preview-category">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><div class="preview-meta"><span>${escapeHtml(item.coverage || 'Coverage provided by seller')}</span><strong>${escapeHtml(item.currency || 'GHS')} ${Number(item.price).toFixed(2)}</strong></div></article>`).join('');
  } catch {
    featured.innerHTML = '<div class="catalogue-empty"><span class="empty-icon"><i class="fa-solid fa-cloud-arrow-down"></i></span><strong>Catalogue temporarily unavailable</strong><p>Please try again shortly. No placeholder listings are displayed.</p></div>';
  }
}
loadFeatured();