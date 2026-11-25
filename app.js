const featured = document.getElementById('featuredBundles');
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
document.getElementById('menuToggle')?.addEventListener('click', () => document.querySelector('.desktop-nav')?.classList.toggle('nav-open'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 }).format(Number(value || 0));

async function load() {
  if (!featured) return;
  try {
    const response = await fetch('/api/bundles', { headers: { Accept: 'application/json' } });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { throw new Error('The bundle service returned an unexpected response.'); }
    if (!response.ok) throw new Error(data.error || 'Bundle service is unavailable.');
    const bundles = data.bundles || [];
    if (!bundles.length) {
      featured.innerHTML = '<div class="catalogue-empty"><span class="empty-icon"><i class="fa-solid fa-box-open"></i></span><strong>No bundles are available just yet</strong><p>Our team is preparing the live bundle catalogue. Please check back soon.</p></div>';
      return;
    }
    featured.innerHTML = bundles.slice(0, 6).map(bundle =>
      '<article class="preview-card"><div class="preview-card-icon"><i class="fa-solid fa-sim-card"></i></div><span class="preview-category">' + esc(bundle.network) + '</span><h3>' + esc(bundle.bundle_size) + '</h3><p>' + esc(bundle.validity_label || 'Validity details available at checkout') + '</p><div class="preview-meta"><span>Mobile data</span><strong>' + money(bundle.price) + '</strong></div></article>'
    ).join('');
  } catch {
    featured.innerHTML = '<div class="catalogue-empty"><span class="empty-icon"><i class="fa-solid fa-cloud-arrow-down"></i></span><strong>Bundle catalogue unavailable</strong><p>Please try again later. No sample packages are shown.</p></div>';
  }
}
load();