const express = require('express');
const router = express.Router();

// Illustrative catalogue records only. Replace with a reviewed, licensed data source
// before offering real datasets. Never publish identifiable personal financial data.
const datasets = [
  {id:'dv-001',title:'Mobile Money Transaction Trends',category:'payments',description:'Illustrative, aggregated mobile money activity by month, channel and broad region.',price:180,records:'24K rows',updated:'Oct 2026',coverage:'Ghana · 2024–2026',tags:['Aggregated','Mobile money','Monthly']},
  {id:'dv-002',title:'SME Banking Access Index',category:'banking',description:'Sample indicators describing small-business access to formal financial services.',price:240,records:'8.5K rows',updated:'Sep 2026',coverage:'West Africa · 2022–2026',tags:['SME','Financial inclusion','Annual']},
  {id:'dv-003',title:'Digital Payments Adoption',category:'payments',description:'Demo dataset of digital payment adoption patterns and high-level usage indicators.',price:150,records:'18K rows',updated:'Nov 2026',coverage:'Ghana · 2023–2026',tags:['Fintech','Adoption','Quarterly']},
  {id:'dv-004',title:'Retail Business Performance',category:'business',description:'Synthetic business performance indicators for sample retail analysis and dashboards.',price:120,records:'12K rows',updated:'Aug 2026',coverage:'Accra · 2025–2026',tags:['Retail','Synthetic','Sales']},
  {id:'dv-005',title:'African Market Snapshot',category:'markets',description:'Illustrative market indicators for research and educational data visualisation.',price:320,records:'6.2K rows',updated:'Oct 2026',coverage:'Africa · 2020–2026',tags:['Markets','Research','Monthly']},
  {id:'dv-006',title:'Urban Mobility Indicators',category:'mobility',description:'Aggregated sample mobility indicators such as commute patterns and transport modes.',price:95,records:'31K rows',updated:'Jul 2026',coverage:'Greater Accra · 2025',tags:['Mobility','Aggregated','Transport']},
  {id:'dv-007',title:'Macroeconomic Indicators',category:'economy',description:'Sample economic time series for learning, modelling practice and trend analysis.',price:210,records:'4.8K rows',updated:'Nov 2026',coverage:'Ghana · 2015–2026',tags:['Economy','Time series','Research']},
  {id:'dv-008',title:'Agent Network Coverage',category:'payments',description:'Synthetic overview of payment agent distribution and service availability.',price:135,records:'9.1K rows',updated:'Sep 2026',coverage:'Ghana · 2024–2026',tags:['Agents','Synthetic','Coverage']}
];

router.get('/', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({success:true,count:datasets.length,datasets});
});

module.exports = router;