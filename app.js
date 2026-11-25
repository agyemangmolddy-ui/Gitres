const grid=document.getElementById('datasetGrid');
const searchInput=document.getElementById('searchInput');
const categoryFilter=document.getElementById('categoryFilter');
const sortFilter=document.getElementById('sortFilter');
const emptyState=document.getElementById('emptyState');
const modal=document.getElementById('datasetModal');
const modalContent=document.getElementById('modalContent');
let datasets=[];
let activeCategory='all';
let saved=new Set();
const icons={payments:'fa-money-bill-transfer',banking:'fa-building-columns',business:'fa-shop',markets:'fa-chart-line',mobility:'fa-car-side',economy:'fa-earth-africa'};
const colors={payments:'blue',banking:'purple',business:'green',markets:'orange',mobility:'cyan',economy:'pink'};
const money=value=>new Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS',maximumFractionDigits:0}).format(value);
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
function render(){
 const term=searchInput.value.trim().toLowerCase();
 const category=activeCategory!=='all'?activeCategory:categoryFilter.value;
 let items=datasets.filter(d=>(category==='all'||d.category===category)&&[d.title,d.description,d.category,...d.tags].join(' ').toLowerCase().includes(term));
 const sort=sortFilter.value;
 if(sort==='price-low')items.sort((a,b)=>a.price-b.price);
 if(sort==='price-high')items.sort((a,b)=>b.price-a.price);
 if(sort==='name')items.sort((a,b)=>a.title.localeCompare(b.title));
 grid.innerHTML=items.map(d=>`<article class="dataset-card"><div class="dataset-card-top"><span class="data-symbol symbol-${colors[d.category]||'blue'}"><i class="fa-solid ${icons[d.category]||'fa-database'}"></i></span><span class="verified"><i class="fa-solid fa-circle-check"></i> Sample listing</span></div><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.description)}</p><div class="tag-row">${d.tags.slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div><div class="dataset-meta"><span><i class="fa-solid fa-table"></i> ${escapeHtml(d.records)}</span><span><i class="fa-regular fa-clock"></i> ${escapeHtml(d.updated)}</span></div><div class="dataset-card-bottom"><div class="price">${money(d.price)} <small>/ licence</small></div><div class="card-actions"><button class="save-btn ${saved.has(d.id)?'saved':''}" data-save="${d.id}" aria-label="Save dataset"><i class="${saved.has(d.id)?'fa-solid':'fa-regular'} fa-bookmark"></i></button><button class="view-btn" data-view="${d.id}">View details</button></div></div></article>`).join('');
 emptyState.classList.toggle('hidden',items.length>0);
 document.getElementById('datasetCount').textContent=String(datasets.length).padStart(2,'0');
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function loadDatasets(){
 try{const response=await fetch('/api/datasets');if(!response.ok)throw new Error('API unavailable');const data=await response.json();datasets=data.datasets||[];render()}
 catch(error){grid.innerHTML='<div class="loading-state">Could not load datasets. Please refresh the page.</div>';toast('Unable to connect to the dataset service.')}
}
grid.addEventListener('click',event=>{
 const view=event.target.closest('[data-view]');const save=event.target.closest('[data-save]');
 if(view){const d=datasets.find(item=>item.id===view.dataset.view);if(d)openDetails(d)}
 if(save){const id=save.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);render();toast(saved.has(id)?'Dataset saved to your shortlist.':'Removed from saved datasets.')}
});
function openDetails(d){
 modalContent.innerHTML=`<div class="modal-category">${escapeHtml(d.category)} dataset</div><h2 id="modalTitle">${escapeHtml(d.title)}</h2><p>${escapeHtml(d.description)}</p><div class="detail-list"><div class="detail-item"><small>Dataset size</small><strong>${escapeHtml(d.records)}</strong></div><div class="detail-item"><small>Last updated</small><strong>${escapeHtml(d.updated)}</strong></div><div class="detail-item"><small>Coverage</small><strong>${escapeHtml(d.coverage)}</strong></div><div class="detail-item"><small>Licence price</small><strong>${money(d.price)}</strong></div></div><p class="license-note"><i class="fa-solid fa-shield-halved"></i> Demo listing only. Dataset descriptions and prices are illustrative. No personal or identifiable financial records are offered. Confirm provenance, consent, permitted use and licence terms before any real transaction.</p><button class="primary-btn" id="enquireBtn"><i class="fa-regular fa-envelope"></i> Enquire about this dataset</button>`;
 modal.classList.remove('hidden');document.getElementById('enquireBtn').addEventListener('click',()=>{window.location.href='mailto:hello@datavault.example?subject='+encodeURIComponent('Dataset enquiry: '+d.title)});
}
document.getElementById('modalClose').addEventListener('click',()=>modal.classList.add('hidden'));
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.add('hidden');if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchInput.focus()}});
searchInput.addEventListener('input',()=>{activeCategory='all';document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.category==='all'));render()});
categoryFilter.addEventListener('change',()=>{activeCategory='all';document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.category==='all'));render()});
sortFilter.addEventListener('change',render);
document.getElementById('categoryChips').addEventListener('click',e=>{const chip=e.target.closest('[data-category]');if(!chip)return;activeCategory=chip.dataset.category;categoryFilter.value='all';document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c===chip));render()});
document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark-mode');const icon=document.querySelector('#themeToggle i');icon.className=document.body.classList.contains('dark-mode')?'fa-solid fa-sun':'fa-regular fa-moon'});
document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',()=>document.getElementById('sidebar').classList.remove('open')));
loadDatasets();