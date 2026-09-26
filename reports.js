/* Financial reports, category charting, and report export. */
window.period = (typeof window !== 'undefined' && window.period) ? window.period : 'week';

function setPeriod(p){
  try {
    window.period = p;
    const btns = document.querySelectorAll('#period-toggle button');
    btns.forEach(b => b.classList.remove('active'));
    const idx = { week: 0, month: 1, all: 2, custom: 3 }[p];
    if (btns[idx]) {
      btns[idx].classList.add('active');
    }
    const showCustom = (p === 'custom');
    const customWrap = document.getElementById('insights-custom-dates-wrap');
    if (customWrap) {
      customWrap.style.display = showCustom ? 'flex' : 'none';
    }
    // Fallback for legacy individual elements (in case old markup is still present)
    const repFrom = document.getElementById('rep-from');
    const repToLabel = document.getElementById('rep-to-label');
    const repTo = document.getElementById('rep-to');
    if (!customWrap) {
      if (repFrom) repFrom.style.display = showCustom ? 'block' : 'none';
      if (repToLabel) repToLabel.style.display = showCustom ? 'block' : 'none';
      if (repTo) repTo.style.display = showCustom ? 'block' : 'none';
    }
    renderReport();
  } catch(e) {
    console.error('setPeriod error:', e);
  }
}
window.setPeriod = setPeriod;

function getReportEntries(){
  const p = (typeof window !== 'undefined' && window.period) ? window.period : (typeof period !== 'undefined' ? period : 'week');
  const base = (typeof mainEntries === 'function') ? mainEntries() : [];
  if(p === 'all') return base;
  if(p === 'custom'){
    const from = document.getElementById('rep-from')?.value;
    const to = document.getElementById('rep-to')?.value;
    return base.filter(e => (!from || e.date >= from) && (!to || e.date <= to));
  }
  if(p === 'month'){
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const start = dateToStr(new Date(y, m, 1));
    const end = dateToStr(new Date(y, m + 1, 0));
    return base.filter(e => e.date >= start && e.date <= end);
  }
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - (day === 0 ? 6 : day - 1);
  const mon = new Date(now); mon.setDate(diff);
  const monStr = dateToStr(mon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const sunStr = dateToStr(sun);
  return base.filter(e => e.date >= monStr && e.date <= sunStr);
}
window.getReportEntries = getReportEntries;

// --- SVG pie chart for category spending — no external chart library needed ---
function polarToXY(cx,cy,r,angleDeg){
  const rad=(angleDeg-90)*Math.PI/180;
  return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) };
}
function describeArc(cx,cy,r,startAngle,endAngle){
  const start=polarToXY(cx,cy,r,endAngle);
  const end=polarToXY(cx,cy,r,startAngle);
  const largeArcFlag = endAngle-startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function renderCategoryPieChart(cats){
  const wrap=document.getElementById('cat-pie-wrap');
  if(!wrap)return;
  const entries=Object.entries(cats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  if(!entries.length){ wrap.innerHTML=''; return; }
  const total=entries.reduce((s,[,v])=>s+v,0);
  const size=200, r=82, cx=size/2, cy=size/2;
  let angle=0;
  const sliceData = entries.map(([cat,amt])=>{
    const sliceAngle = (amt/total)*360;
    const startAngle=angle;
    angle += sliceAngle;
    return {cat, amt, startAngle, endAngle:angle, pct: Math.round(amt/total*100)};
  });

  const slices = sliceData.map((s,i)=>{
    const path = s.endAngle-s.startAngle>=359.9
      ? `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-0.01} ${cy-r} Z`
      : describeArc(cx,cy,r,s.startAngle,s.endAngle);
    return `<path class="pie-slice" data-idx="${i}" d="${path}" fill="${CAT_COLORS[s.cat]||'#9b95c2'}"
      stroke="#1b1340" stroke-width="2" style="transform-origin:${cx}px ${cy}px"
      onmouseenter="showPieTooltip(event,${i})" onmouseleave="hidePieTooltip()"
      ontouchstart="showPieTooltip(event,${i})"></path>`;
  }).join('');

  window._pieSliceData = sliceData;

  const legend = sliceData.map(s=>`
    <div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-dim)">
      <span style="width:9px;height:9px;border-radius:50%;background:${CAT_COLORS[s.cat]||'#9b95c2'};flex-shrink:0"></span>
      <span>${escapeHTML(CAT_LABEL(s.cat))} · ${s.pct}%</span>
    </div>`).join('');

  wrap.innerHTML = `
    <div style="position:relative">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">${slices}<circle cx="${cx}" cy="${cy}" r="${r*0.55}" fill="#1b1340"/></svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">
        <div style="font-size:10px;color:var(--text-faint)">${currentLang==='hi'?'कुल':'Total'}</div>
        <div style="font-size:15px;font-weight:700">₹${total}</div>
      </div>
      <div id="pie-tooltip" style="display:none;position:fixed;background:#1f1840;border:1px solid var(--accent);border-radius:10px;padding:6px 10px;font-size:12px;color:#fff;pointer-events:none;z-index:950;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,0.4)"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;margin-top:14px;width:100%">${legend}</div>
  `;
}

function showPieTooltip(evt, idx){
  const s=window._pieSliceData[idx];
  if(!s)return;
  document.querySelectorAll('.pie-slice').forEach(p=>p.style.transform='scale(1)');
  evt.target.style.transform='scale(1.06)';
  evt.target.style.transition='transform 0.15s';
  const tip=document.getElementById('pie-tooltip');
  const label=CAT_LABEL(s.cat);
  tip.innerHTML=`<b>${escapeHTML(label)}</b><br>₹${s.amt} · ${s.pct}%`;
  tip.style.display='block';
  const cx = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const cy = evt.touches ? evt.touches[0].clientY : evt.clientY;
  tip.style.left=(cx+15)+'px';
  tip.style.top=(cy-40)+'px';
}
function hidePieTooltip(){
  document.querySelectorAll('.pie-slice').forEach(p=>p.style.transform='scale(1)');
  const tip=document.getElementById('pie-tooltip');
  if(tip) tip.style.display='none';
}

function renderReport(){
  try {
    const list = getReportEntries();
    const income = list.filter(e=>e.type==='income').reduce((s,e)=>s+(Number(e.amt)||0),0);
    const spent = list.filter(e=>e.type==='expense').reduce((s,e)=>s+(Number(e.amt)||0),0);
    const bal = income - spent;
    
    const incEl = document.getElementById('r-income');
    const spentEl = document.getElementById('r-spent');
    const balEl = document.getElementById('r-balance');
    const countEl = document.getElementById('r-count');
    if (incEl) incEl.textContent = '₹' + income.toLocaleString('en-IN');
    if (spentEl) spentEl.textContent = '₹' + spent.toLocaleString('en-IN');
    if (balEl) balEl.textContent = (bal < 0 ? '-₹' : '₹') + Math.abs(bal).toLocaleString('en-IN');
    if (countEl) countEl.textContent = list.length;
    
    const cats = {};
    list.filter(e=>e.type==='expense').forEach(e=>{cats[e.cat]=(cats[e.cat]||0)+(Number(e.amt)||0);});
    const maxCat = Math.max(...Object.values(cats), 1);
    renderCategoryPieChart(cats);
    
    const catBreakdownEl = document.getElementById('cat-breakdown');
    if (catBreakdownEl) {
      catBreakdownEl.innerHTML = Object.entries(cats).length ? Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,a])=>`
        <div class="cat-bar">
          <span style="font-size:13px;min-width:110px;color:var(--text-dim)">${(typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.round(a/maxCat*100)}%;background:${(typeof CAT_COLORS!=='undefined'&&CAT_COLORS[c])||'#9b95c2'}"></div></div>
          <span style="font-size:13px;font-weight:600;min-width:50px;text-align:right">₹${Number(a).toLocaleString('en-IN')}</span>
        </div>`).join('') : `<p class="empty">${typeof TT==='function'?TT('no_expenses'):'No expenses'}</p>`;
    }

    const fullBreakdownEl = document.getElementById('full-breakdown');
    if (fullBreakdownEl) {
      const sorted = [...list].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      fullBreakdownEl.innerHTML = sorted.length ? sorted.map(e=>`<div class="report-row"><span>${(typeof fmtDate==='function'?fmtDate(e.date):e.date)} — ${e.type==='income'?escapeHTML(e.label):(typeof displayCatLabel==='function'?escapeHTML(displayCatLabel(e))+': ':'')+escapeHTML(e.label)}</span><span style="color:${e.type==='income'?'var(--green)':'var(--red)'}">${e.type==='income'?'+':'-'}₹${Number(e.amt||0).toLocaleString('en-IN')}</span></div>`).join('') : `<p class="empty">${typeof TT==='function'?TT('nothing_period'):'No entries in this period'}</p>`;
    }

    if (typeof renderHealthScore === 'function') renderHealthScore();
    if (typeof renderLeakDetector === 'function') renderLeakDetector();
    if (typeof renderBudgetEditor === 'function') renderBudgetEditor();
    if (typeof renderFutureMoneySimulator === 'function') renderFutureMoneySimulator();
    if (typeof renderWalletDistributionCard === 'function') renderWalletDistributionCard();
    if (typeof renderSmartInsights === 'function') renderSmartInsights();
  } catch(e) {
    console.error('renderReport error:', e);
  }
}
window.renderReport = renderReport;

function copyReport(){
  // Preview mode: export is unlocked for testers. Live mode: only Pro can export.
  if(!(typeof ptTestMode==='function' && ptTestMode()) && typeof proEnabled==='function' && !proEnabled()){
    if(typeof openProCheckout === 'function') openProCheckout();
    toast(currentLang==='hi' ? '📊 रिपोर्ट कॉपी करना Pro सुविधा है' : '📊 Copying the report is a Pro feature', 'error');
    return;
  }
  const list=getReportEntries();
  const income=list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const spent=list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);
  const bal=income-spent;
  const cats={};
  list.filter(e=>e.type==='expense').forEach(e=>{cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  const isHi = currentLang==='hi';
  const periodTitle={week:isHi?'साप्ताहिक खर्च रिपोर्ट':'Weekly Expense Report',month:isHi?'मासिक खर्च रिपोर्ट':'Monthly Expense Report',all:isHi?'पूरी खर्च रिपोर्ट':'All-Time Expense Report',custom:isHi?'कस्टम अवधि रिपोर्ट':'Custom Range Expense Report'}[period]||(isHi?'खर्च रिपोर्ट':'Expense Report');
  let txt=`${periodTitle}\n${'─'.repeat(30)}\n${isHi?'कुल आय':'Total Income'}: ₹${income}\n${isHi?'कुल खर्च':'Total Spent'}: ₹${spent}\n${isHi?'बचा हुआ बैलेंस':'Balance Left'}: ₹${bal}\n\n${isHi?'खर्च का विवरण':'Spending Breakdown'}:\n`;
  Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([c,a])=>{txt+=`  ${CAT_LABELS[c]}: ₹${a}\n`;});
  txt+=isHi?`\nसभी एंट्रीज़:\n`:`\nAll Entries:\n`;
  [...list].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{txt+=`  ${fmtDate(e.date)} | ${e.type==='income'?(isHi?'आय':'INCOME'):(isHi?'खर्च':'EXPENSE')} | ${displayCatLabel(e)} | ${e.label}${e.note?' ('+e.note+')':''} | ${e.type==='income'?'+':'-'}₹${e.amt}\n`;});
  navigator.clipboard.writeText(txt).then(()=>toast(TT('report_copied'),'success')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    toast(TT('report_copied'),'success');
  });
}

const DEVA_FONT_NAME='NotoSansDevanagari';
async function ensureDevanagariFont(doc){
  if(doc.internal.__ptDevaFont) return true;
  try{
    const res=await fetch('NotoSansDevanagari-Regular.ttf');
    if(!res.ok) return false;
    const bytes=new Uint8Array(await res.arrayBuffer());
    let bin='';
    for(let i=0;i<bytes.length;i+=0x8000){ bin+=String.fromCharCode.apply(null, bytes.subarray(i,i+0x8000)); }
    doc.addFileToVFS(DEVA_FONT_NAME+'.ttf', btoa(bin));
    doc.addFont(DEVA_FONT_NAME+'.ttf', DEVA_FONT_NAME, 'normal');
    doc.internal.__ptDevaFont=true;
    return true;
  }catch(e){ return false; }
}
function hasDevanagari(s){ return /[\u0900-\u097F]/.test(String(s||'')); }
function pdfSafe(s){ return String(s==null?'':s).replace(/[^\u0000-\u00FF]/g,''); }

async function exportPDF(){
  // Preview mode: export is unlocked for testers. Live mode: only Pro can export.
  const blocked = !(typeof ptTestMode==='function' && ptTestMode()) && (typeof proEnabled==='function' && !proEnabled());
  if(blocked){
    if(typeof openProCheckout === 'function') openProCheckout();
    toast(currentLang==='hi' ? 'PDF एक्सपोर्ट Pro सुविधा है' : 'Exporting as PDF is a Pro feature', 'error');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const list=getReportEntries();
  const devaText=list.some(e=>hasDevanagari(e.label)||hasDevanagari(e.note));
  const devaOk=(currentLang==='hi'||devaText)?await ensureDevanagariFont(doc):false;
  if(devaOk) doc.setFont(DEVA_FONT_NAME,'normal');
  const T=s=>devaOk?s:pdfSafe(s);
  const income=list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const spent=list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);
  const bal=income-spent;
  const cats={};
  list.filter(e=>e.type==='expense').forEach(e=>{cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  const CAT_RGB = {food:[74,222,128],travel:[96,165,250],friends:[255,184,77],home:[255,126,179],shopping:[192,132,252],entertainment:[244,114,182],health:[251,113,133],education:[251,191,36],work:[34,211,238],other:[150,150,150]};
  const PURPLE=[124,78,224], PINK=[255,126,179], GREEN=[34,197,94], RED=[239,68,68], DARK=[30,25,50];

  const pageW=210, marginL=14, marginR=196;

  function addFooter(){
    const pageCount=doc.internal.getNumberOfPages();
    for(let i=1;i<=pageCount;i++){
      doc.setPage(i);
      doc.setDrawColor(230);
      doc.line(marginL,287,marginR,287);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('PocketTrack Expense Report',marginL,292);
      doc.text('Page '+i+' of '+pageCount,marginR,292,{align:'right'});
    }
  }

  // ===== Header banner =====
  doc.setFillColor(...PURPLE);
  doc.rect(0,0,pageW,32,'F');
  doc.setFillColor(...PINK);
  doc.rect(0,32,pageW,1.5,'F');
  doc.setFontSize(19);
  doc.setTextColor(255,255,255);
  const isHi = currentLang==='hi' && devaOk;
  doc.text(isHi?'खर्च रिपोर्ट':'Expense Report',marginL,16);
  doc.setFontSize(10);
  doc.setTextColor(235,225,255);
  const periodLabel=isHi
    ? ({week:'इस सप्ताह',all:'सभी समय',custom:'कस्टम अवधि'}[period]||'इस सप्ताह')
    : ({week:'This week',all:'All time',custom:'Custom range'}[period]||'This week');
  doc.text(periodLabel+'  ·  '+(isHi?'बनाई गई ':'Generated ')+new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),marginL,24);

  let y=44;

  // ===== Summary cards =====
  const cardW=(marginR-marginL-12)/3, cardH=22;
  const cards=[
    {label:isHi?'आय':'INCOME',val:income,color:GREEN,x:marginL},
    {label:isHi?'खर्च':'SPENT',val:spent,color:RED,x:marginL+cardW+6},
    {label:isHi?'बैलेंस':'BALANCE',val:bal,color:bal>=0?GREEN:RED,x:marginL+2*(cardW+6)}
  ];
  cards.forEach(c=>{
    doc.setFillColor(246,244,255);
    doc.roundedRect(c.x,y,cardW,cardH,2,2,'F');
    doc.setFontSize(8);
    doc.setTextColor(140,130,170);
    doc.text(c.label,c.x+5,y+8);
    doc.setFontSize(14);
    doc.setTextColor(...c.color);
    doc.text((c.val<0?'-':'')+'Rs. '+Math.abs(c.val),c.x+5,y+17);
  });
  y+=cardH+14;

  // ===== Spending by category (colored bars) =====
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('Spending by Category',marginL,y);
  y+=7;
  const maxCat=Math.max(...Object.values(cats),1);
  const barMaxW=110;
  const catEntries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  if(catEntries.length){
    catEntries.forEach(([c,a])=>{
      doc.setFontSize(9.5);
      doc.setTextColor(60);
      doc.text(T(CAT_LABELS[c]),marginL,y+4);
      doc.setFillColor(235,232,245);
      doc.roundedRect(marginL+45,y,barMaxW,4,1,1,'F');
      const w=Math.max((a/maxCat)*barMaxW,2);
      const rgb=CAT_RGB[c]||[150,150,150];
      doc.setFillColor(...rgb);
      doc.roundedRect(marginL+45,y,w,4,1,1,'F');
      doc.setFontSize(9.5);
      doc.setTextColor(60);
      doc.text('Rs. '+a,marginL+45+barMaxW+4,y+4);
      y+=9;
    });
  } else {
    doc.setFontSize(9.5);
    doc.setTextColor(150);
    doc.text('No expenses logged in this period',marginL,y+4);
    y+=9;
  }
  y+=8;

  // ===== Day-wise balance =====
  if(y>250){doc.addPage();y=20;}
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('Day-wise Balance',marginL,y);
  y+=8;
  const byDate={};
  list.forEach(e=>{
    if(!byDate[e.date])byDate[e.date]={income:0,expense:0};
    if(e.type==='income')byDate[e.date].income+=e.amt;else byDate[e.date].expense+=e.amt;
  });
  const dateKeys=Object.keys(byDate).sort((a,b)=>a.localeCompare(b));
  // table header
  doc.setFillColor(...PURPLE);
  doc.rect(marginL,y-5,marginR-marginL,7,'F');
  doc.setFontSize(9);
  doc.setTextColor(255,255,255);
  doc.text('Date',marginL+3,y);
  doc.text('Income',marginL+65,y);
  doc.text('Spent',marginL+105,y);
  doc.text('Balance',marginL+145,y);
  y+=6;
  dateKeys.forEach((d,i)=>{
    if(y>280){doc.addPage();y=20;}
    const g=byDate[d]; const dbal=g.income-g.expense;
    if(i%2===0){doc.setFillColor(247,246,252);doc.rect(marginL,y-4.5,marginR-marginL,6.5,'F');}
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(fmtDate(d),marginL+3,y);
    doc.setTextColor(...GREEN);
    doc.text('+Rs. '+g.income,marginL+65,y);
    doc.setTextColor(...RED);
    doc.text('-Rs. '+g.expense,marginL+105,y);
    doc.setTextColor(...(dbal>=0?GREEN:RED));
    doc.text((dbal>=0?'+':'-')+'Rs. '+Math.abs(dbal),marginL+145,y);
    y+=6.5;
  });
  y+=10;

  // ===== All entries =====
  if(y>260){doc.addPage();y=20;}
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('All Entries',marginL,y);
  y+=8;
  const sorted=[...list].sort((a,b)=>a.date.localeCompare(b.date));
  sorted.forEach((e,i)=>{
    if(y>280){doc.addPage();y=20;}
    if(i%2===0){doc.setFillColor(247,246,252);doc.rect(marginL,y-4,marginR-marginL,6,'F');}
    doc.setFontSize(8.5);
    doc.setTextColor(60);
    const label=e.type==='income'?e.label:displayCatLabel(e)+': '+e.label;
    doc.text(T(fmtDate(e.date)+'  |  '+(e.type==='income'?(isHi?'आय':'INCOME'):(isHi?'खर्च':'EXPENSE'))+'  |  '+label)+(e.note?' ('+T(e.note)+')':''),marginL+2,y);
    doc.setTextColor(...(e.type==='income'?GREEN:RED));
    doc.text((e.type==='income'?'+':'-')+'Rs.'+e.amt,marginR,y,{align:'right'});
    y+=6;
  });

  addFooter();
  doc.save('expense_report.pdf');
}



// =====================================================================
//  FINANCIAL HEALTH SCORE  (Pro, blur-gated)
//  Scores 0-100 from real data: savings rate + budget adherence +
//  logging consistency. Locked users see the real card blurred.
// =====================================================================
const HS_TXT = {
  title:  { en:'Financial Health Score', hi:'वित्तीय स्वास्थ्य स्कोर' },
  hint:   { en:'From your real entries', hi:'आपकी असली एंट्रीज़ से' },
  of100:  { en:'of 100', hi:'100 में से' },
  savings:{ en:'Savings rate', hi:'बचत दर' },
  budget: { en:'Budget use', hi:'बजट उपयोग' },
  consis: { en:'Logging habit', hi:'लॉगिंग आदत' },
  lockedTitle:{ en:'Your money, scored', hi:'आपका पैसा, स्कोर किया हुआ' },
  lockedPitch:{ en:'See how your savings, budget and logging habits add up to a 0–100 health score — built from your real entries.',
                hi:'आपकी बचत, बजट और लॉगिंग आदतें 0–100 हेल्थ स्कोर में कैसे जुड़ती हैं देखें — आपकी असली एंट्रीज़ से।' },
  unlock: { en:'Unlock with Pro', hi:'Pro से अनलॉक करें' },
  locked: { en:'Pro', hi:'Pro' },
};
function hsT(k){ return (HS_TXT[k] && HS_TXT[k][currentLang]) || HS_TXT[k].en; }

function computeHealthScore(){
  const list = getReportEntries();
  const income = list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const expense = list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);

  // 1. Savings rate → up to 45 pts
  const rate = income>0 ? ((income-expense)/income)*100 : (expense>0 ? -100 : 0);
  const savingsScore = Math.round(Math.max(0, Math.min(1, (rate+10)/45)) * 45);

  // 2. Budget adherence → up to 30 pts (uses the active weekly/monthly budget)
  let budgetScore = 16;
  let budgetPct = 55; // shown % when no budget is set
  const budget = (typeof totalBudget==='function') ? totalBudget() : (budgetPeriod==='weekly' ? weeklyBudget : monthlyBudget);
  if (typeof budget !== 'undefined' && budget > 0){
    const spent = (budgetPeriod==='weekly' ? getThisWeekEntries() : getThisMonthEntries())
      .filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);
    const pct = Math.min(120, (spent/budget)*100);
    const adherence = Math.max(0, 100 - pct + (pct<=100?6:0));
    budgetScore = Math.round((adherence/100)*30);
    budgetPct = Math.round(adherence);
  }

  // 3. Consistency → up to 25 pts (distinct days logged in last 30)
  const now = new Date();
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate()-29);
  const cutoffStr = dateToStr(cutoff);
  const activeDays = new Set(mainEntries().filter(e=>e.date>=cutoffStr).map(e=>e.date)).size;
  const consistencyScore = Math.round((Math.min(100, (activeDays/20)*100)/100)*25);

  const total = Math.max(0, Math.min(100, savingsScore + budgetScore + consistencyScore));
  const verdict =
    total>=80 ? { en:'Excellent — you\'re building real wealth.', hi:'बेहतरीन — आप असली संपत्ति बना रहे हैं।' }
    : total>=60 ? { en:'Solid. A few tweaks and you\'re in great shape.', hi:'अच्छा है। थोड़ी सुधार से आप बेहतरीन होंगे।' }
    : total>=40 ? { en:'Shaky. Your spending is outpacing your plan.', hi:'कमजोर। आपका खर्च योजना से आगे है।' }
    : { en:'Needs attention. Let\'s fix the leaks first.', hi:'ध्यान देने की ज़रूरत है। पहले लीक ठीक करें।' };

  return {
    total,
    verdict: verdict[currentLang] || verdict.en,
    bars:[
      { label: hsT('savings'), value: Math.round(rate), pct: Math.round((savingsScore/45)*100), color:'var(--green)' },
      { label: hsT('budget'),  value: budgetPct, pct: budgetPct, color:'var(--amber)' },
      { label: hsT('consis'),  value: activeDays, pct: Math.round((consistencyScore/25)*100), color:'var(--accent)' },
    ],
  };
}

function renderHealthScore(){
  const host = document.getElementById('health-score-card');
  if(!host) return;
  const isPro = (typeof proEnabled==='function' && proEnabled()) || (typeof ptTestMode==='function' && ptTestMode());
  const s = computeHealthScore();

  const bars = s.bars.map(b=>`
    <div class="health-bar">
      <span class="health-bar-label">${b.label}</span>
      <div class="health-bar-track"><div class="health-bar-fill" style="width:${b.pct}%;background:${b.color}"></div></div>
      <span class="health-bar-num" style="color:${b.color}">${b.value}${b.label===hsT('savings')?'%':''}</span>
    </div>`).join('');

  const inner = `
    <div class="health-head">
      <p class="sec-title" style="margin:0"><i class="ti ti-heartbeat"></i><span>${hsT('title')}</span></p>
      <span class="chip" style="font-size:10px">${hsT('hint')}</span>
    </div>
    <div class="health-main">
      <div class="health-ring" style="--hs:${s.total*3.6}deg">
        <div class="health-ring-inner">
          <span class="health-ring-num">${s.total}</span>
          <span class="health-ring-label">${hsT('of100')}</span>
        </div>
      </div>
      <div class="health-verdict"><p>${s.verdict}</p></div>
    </div>
    <div class="health-bars">${bars}</div>`;

  if(isPro){
    host.innerHTML = `<div class="card health-card">${inner}</div>`;
  }else{
    host.innerHTML = `<div class="card health-card">
      <div class="premium-gate-blur" aria-hidden="true">${inner}</div>
      <div class="premium-gate-overlay">
        <div class="pg-lock">🔒</div>
        <p class="pg-title">${hsT('lockedTitle')}</p>
        <p class="pg-pitch">${hsT('lockedPitch')}</p>
        <button class="pg-cta" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${hsT('unlock')}</button>
      </div>
    </div>`;
  }
}

// =====================================================================
//  SUBSCRIPTION LEAK DETECTOR  (Pro, blur-gated)
//  Finds recurring charges (Netflix, Spotify, small monthly fees, etc.)
//  by scanning your real expense entries for repeated labels/amounts.
// =====================================================================
const LK_TXT = {
  title:  { en:'Subscription Leak Detector', hi:'सब्सक्रिप्शन लीक डिटेक्टर' },
  hint:   { en:'Recurring charges from your entries', hi:'आपकी एंट्रीज़ से आवर्ती शुल्क' },
  found:  { en:'likely subscriptions', hi:'संभावित सब्सक्रिप्शन' },
  yearly: { en:'/yr', hi:'/वर्ष' },
  perMo:  { en:'/mo', hi:'/माह' },
  last:   { en:'last paid', hi:'आखिरी भुगतान' },
  empty:  { en:'No clear recurring charges found yet — keep logging and check back later.', hi:'अभी कोई स्पष्ट आवर्ती शुल्क नहीं मिला — लॉग करते रहें और बाद में देखें।' },
  lockedTitle:{ en:'Find money leaking out', hi:'पैसा कहां से लीक हो रहा है' },
  lockedPitch:{ en:'The leak detector scans your recurring charges and shows the real annual cost of each — so you can cancel what you don’t use.',
               hi:'लीक डिटेक्टर आपके आवर्ती शुल्कों की स्कैन करके हर एक की असली सालाना लागत दिखाता है — ताकि आप वह रद्द कर सकें जो आप इस्तेमाल नहीं करते।' },
};
function lkT(k){ return (LK_TXT[k] && LK_TXT[k][currentLang]) || LK_TXT[k].en; }

function detectLeaks(){
  const exp = mainEntries().filter(e=>e.type==='expense');
  if(exp.length<6) return [];
  const groups = {};
  exp.forEach(e=>{
    const key = String(e.label||'').toLowerCase().trim();
    if(!key) return;
    if(!groups[key]) groups[key]=[];
    groups[key].push(e);
  });
  const leaks=[];
  Object.keys(groups).forEach(label=>{
    const items = groups[label];
    if(items.length<3) return;
    const months = new Set(items.map(e=>e.date.slice(0,7)));
    if(months.size<2) return; // must recur across at least two distinct months
    const amts = items.map(e=>e.amt).sort((a,b)=>a-b);
    const med = amts[Math.floor(amts.length/2)];
    const close = items.filter(e=>Math.abs(e.amt - med) <= Math.max(med*0.3, 20)).length;
    if(close<3) return;
    leaks.push({
      label: label.charAt(0).toUpperCase()+label.slice(1),
      median: med,
      count: items.length,
      months: months.size,
      yearly: Math.round(med*12),
      last: items.map(e=>e.date).sort().pop()
    });
  });
  return leaks.sort((a,b)=>b.yearly-a.yearly).slice(0,6);
}

function renderLeakDetector(){
  const host = document.getElementById('leak-detector-card');
  if(!host) return;
  const isPro = (typeof proEnabled==='function' && proEnabled()) || (typeof ptTestMode==='function' && ptTestMode());
  const leaks = detectLeaks();

  let body;
  if(leaks.length===0 && isPro){
    body = `<p class="empty" style="margin:8px 0 4px">${lkT('empty')}</p>`;
  }else{
    const displayLeaks = (leaks.length > 0) ? leaks : [
      { label: 'Netflix Premium', months: 3, last: new Date().toISOString(), yearly: 7788, median: 649 },
      { label: 'Gym Membership', months: 4, last: new Date().toISOString(), yearly: 18000, median: 1500 },
      { label: 'Cloud Storage', months: 6, last: new Date().toISOString(), yearly: 2520, median: 210 }
    ];
    body = `<div class="leak-list">` + displayLeaks.map(l=>`
      <div class="leak-item">
        <div class="leak-main">
          <span class="leak-name">${escapeHTML(l.label)}</span>
          <span class="leak-meta">${l.months} ${currentLang==='hi'?'महीने':'mo'} · ${lkT('last')} ${fmtDate(l.last)}</span>
        </div>
        <div class="leak-cost">
          <span class="leak-year">≈ ₹${l.yearly}<span class="leak-year-suffix">${lkT('yearly')}</span></span>
          <span class="leak-mo">≈ ₹${Math.round(l.median)}${lkT('perMo')}</span>
        </div>
      </div>`).join('') + `</div>`;
  }

  const inner = `
    <div class="health-head">
      <p class="sec-title" style="margin:0"><i class="ti ti-report-money"></i><span>${lkT('title')}</span></p>
      <span class="chip" style="font-size:10px">${lkT('hint')}</span>
    </div>
    ${leaks.length>0 ? `<p style="font-size:11px;color:var(--text-faint);margin:-6px 0 10px">${leaks.length} ${lkT('found')}</p>`:''}
    ${body}`;

  if(isPro){
    host.innerHTML = `<div class="card health-card">${inner}</div>`;
  }else{
    host.innerHTML = `<div class="card health-card" style="min-height:300px;">
      <div class="premium-gate-blur" aria-hidden="true" style="min-height:280px;">${inner}</div>
      <div class="premium-gate-overlay">
        <div class="pg-lock">🔍</div>
        <p class="pg-title">${lkT('lockedTitle')}</p>
        <p class="pg-pitch">${lkT('lockedPitch')}</p>
        <button class="pg-cta" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${hsT('unlock')}</button>
      </div>
    </div>`;
  }
}

function renderFutureMoneySimulator() {
  const host = document.getElementById('future-money-simulator-card');
  if(!host) return;

  const isPro = (typeof proEnabled==='function' && proEnabled());
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  const list = mainEntries();
  const income = list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const spent = list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);
  const balance = Math.max(5000, income - spent);
  const estSavingsPerMo = Math.max(1000, Math.round(balance * 0.15));

  const inner = `
    <div class="health-head" style="margin-bottom:14px;">
      <p class="sec-title" style="margin:0;display:flex;align-items:center;gap:6px;"><span style="font-size:22px;">🔮</span><span>${isHi ? 'फ्यूचर मनी सिम्युलेटर' : 'Future Money Simulator'}</span></p>
      <span class="chip" style="font-size:10px;background:rgba(139,92,246,0.2);color:var(--primary-bright);">${isHi ? '12-माह पूर्वानुमान' : '12-Mo Projections'}</span>
    </div>

    <div style="background:rgba(255,255,255,0.04);border-radius:18px;padding:18px;border:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-dim);">${isHi ? 'मासिक बचत दर लक्ष्य' : 'Monthly Savings Target'}</span>
        <strong id="sim-app-val" style="color:var(--accent-green);font-size:16px;">₹${estSavingsPerMo.toLocaleString('en-IN')}/mo</strong>
      </div>
      <input type="range" id="sim-app-slider" style="width:100%;accent-color:var(--accent);margin-bottom:16px;" min="500" max="${Math.max(50000, balance * 2)}" step="500" value="${estSavingsPerMo}" oninput="updateAppSimulator()"/>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:11px;color:var(--text-dim);">${isHi ? '6 महीने में संपत्ति' : 'In 6 Months'}</span>
          <div id="sim-app-6mo" style="font-size:20px;font-weight:800;color:var(--accent-green);margin-top:2px;">₹${(estSavingsPerMo * 6).toLocaleString('en-IN')}</div>
        </div>
        <div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:11px;color:var(--text-dim);">${isHi ? '1 वर्ष में संपत्ति' : 'In 1 Year'}</span>
          <div id="sim-app-12mo" style="font-size:20px;font-weight:800;color:var(--primary-bright);margin-top:2px;">₹${(estSavingsPerMo * 12).toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  `;

  if(isPro){
    host.innerHTML = `<div class="card health-card">${inner}</div>`;
  } else {
    host.innerHTML = `<div class="card health-card" style="min-height:300px;">
      <div class="premium-gate-blur" aria-hidden="true" style="min-height:280px;">${inner}</div>
      <div class="premium-gate-overlay">
        <div class="pg-lock">🔮</div>
        <p class="pg-title">${isHi ? 'फ्यूचर मनी सिम्युलेटर अनलॉक करें' : 'Unlock Future Money Simulator'}</p>
        <p class="pg-pitch">${isHi ? 'अपने 3, 6 और 12 महीने के बचत लक्ष्यों का पूर्वानुमान लगाएं।' : 'Forecast compounding wealth and milestones across 3, 6 & 12 months.'}</p>
        <button class="pg-cta" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${isHi ? 'Pro अनलॉक करें (₹50/माह)' : 'Unlock Pro (₹50/mo)'}</button>
      </div>
    </div>`;
  }
}

function updateAppSimulator() {
  const slider = document.getElementById('sim-app-slider');
  const valEl = document.getElementById('sim-app-val');
  const mo6El = document.getElementById('sim-app-6mo');
  const mo12El = document.getElementById('sim-app-12mo');
  if(!slider) return;

  const val = parseInt(slider.value) || 1000;
  if(valEl) valEl.textContent = '₹' + val.toLocaleString('en-IN') + '/mo';
  if(mo6El) mo6El.textContent = '₹' + (val * 6).toLocaleString('en-IN');
  if(mo12El) mo12El.textContent = '₹' + (val * 12).toLocaleString('en-IN');
}

window.renderWalletDistributionCard = function() {
  const host = document.getElementById('wallet-distribution-slot');
  if (!host) return;
  if (typeof computeWalletBalances !== 'function' || typeof userWallets === 'undefined') return;

  const balances = computeWalletBalances();
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  let totalNetWorth = 0;
  Object.values(balances).forEach(b => { totalNetWorth += b; });

  const walletRows = userWallets.map(w => {
    const bal = balances[w.id] || 0;
    const isNeg = bal < 0;
    const pct = totalNetWorth > 0 ? Math.max(0, Math.min(100, Math.round((bal / totalNetWorth) * 100))) : 0;
    return `
      <div style="background:rgba(255,255,255,0.03);border-radius:14px;padding:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">${w.icon || '💳'}</span>
            <strong style="font-size:13.5px;color:#fff;">${escapeHTML(w.name)}</strong>
          </div>
          <strong style="font-size:14px;color:${isNeg ? '#f87171' : 'var(--green,#34d399)'};font-family:'Space Grotesk',sans-serif;">
            ₹${bal.toLocaleString('en-IN')}
          </strong>
        </div>
        <div style="width:100%;height:6px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${w.color || '#34d399'};border-radius:99px;"></div>
        </div>
      </div>
    `;
  }).join('');

  host.innerHTML = `
    <div class="card" style="margin-top:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <p class="sec-title" style="margin:0;display:flex;align-items:center;gap:6px;"><span style="font-size:20px;">💼</span><span>${isHi ? 'खाते और वॉलेट वितरण' : 'Accounts & Wallet Distribution'}</span></p>
        <span class="chip" style="font-size:10.5px;">Net Worth: ₹${totalNetWorth.toLocaleString('en-IN')}</span>
      </div>
      <div style="margin-bottom:10px;">
        ${walletRows}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-sm" onclick="openTransferModal()" style="flex:1;border-radius:10px;font-size:11.5px;padding:6px;background:rgba(139,92,246,0.15);color:var(--accent-bright,#c4b5fd);border:1px solid rgba(139,92,246,0.3);">🔁 ${isHi ? 'ट्रांसफर करें' : 'Transfer'}</button>
        <button class="btn btn-sm" onclick="openNewWalletModal()" style="flex:1;border-radius:10px;font-size:11.5px;padding:6px;background:rgba(52,211,153,0.12);color:var(--green,#34d399);border:1px solid rgba(52,211,153,0.3);">+ ${isHi ? 'नया खाता' : 'New Wallet'}</button>
      </div>
    </div>
  `;
};

// =====================================================================
// ACTIONABLE SMART INSIGHTS & SIMPLE BUDGET MODE
// =====================================================================
window.getSavedTotalBudget = function(period, wId) {
  const p = period || window.budgetPeriod || 'monthly';
  const w = wId !== undefined ? wId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (w && w !== 'all') {
    const customKey = `pockettrack_budget_${p}_` + w;
    const val = localStorage.getItem(customKey);
    if (val) return parseFloat(val) || 0;
    if (p === 'weekly') {
      if (w === 'cash') return 1500;
      if (w === 'bank') return 5000;
      if (w === 'card') return 3000;
      return 2500;
    } else {
      if (w === 'cash') return 5000;
      if (w === 'bank') return 20000;
      if (w === 'card') return 10000;
      return 10000;
    }
  }
  if (p === 'weekly') {
    return parseFloat(localStorage.getItem('pockettrack_total_weekly_budget')) || 3500;
  }
  return parseFloat(localStorage.getItem('pockettrack_total_monthly_budget')) || 15000;
};

window.setSavedTotalBudget = function(amt, period, wId) {
  const p = period || window.budgetPeriod || 'monthly';
  const w = wId !== undefined ? wId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (amt > 0) {
    if (w && w !== 'all') {
      const key = `pockettrack_budget_${p}_${w}`;
      localStorage.setItem(key, amt);
      const wObj = (typeof userWallets !== 'undefined') ? userWallets.find(x => x.id === w) : null;
      const wLabel = wObj ? `${wObj.icon} ${wObj.name}` : w;
      if (typeof toast === 'function') toast(`${wLabel} ${p} budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
    } else {
      if (p === 'weekly') {
        localStorage.setItem('pockettrack_total_weekly_budget', amt);
        if (typeof toast === 'function') toast(`Weekly budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
      } else {
        localStorage.setItem('pockettrack_total_monthly_budget', amt);
        if (typeof toast === 'function') toast(`Monthly budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
      }
    }
    if (typeof renderBudgetEditor === 'function') renderBudgetEditor();
    renderReport();
  }
};

window.renderSmartInsights = function() {
  const host = document.getElementById('smart-insights-slot');
  if (!host) return;

  const list = mainEntries();
  const expList = list.filter(e => e.type === 'expense');
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  if (!expList.length) {
    host.innerHTML = `
      <div class="card" style="text-align:center;padding:24px;border-radius:20px;">
        <div style="font-size:32px;margin-bottom:6px;">📊</div>
        <h4 style="margin:0 0 4px;font-family:'Space Grotesk',sans-serif;font-size:16px;">${isHi ? 'कोई खर्च डेटा नहीं' : 'No Expense Data Yet'}</h4>
        <p style="font-size:12px;color:var(--text-dim);margin:0;">${isHi ? 'कुछ खर्चे दर्ज करें और स्मार्ट इनसाइट्स देखें।' : 'Log a few expenses to unlock spending patterns & daily burn rate.'}</p>
      </div>
    `;
    return;
  }

  // 1. Compute Day of Week Peak
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  let totalSpent = 0;

  expList.forEach(e => {
    if (e.date) {
      const d = new Date(e.date + 'T00:00:00');
      const dayIdx = d.getDay();
      if (!isNaN(dayIdx)) {
        dayTotals[dayIdx] += (parseFloat(e.amt) || 0);
        totalSpent += (parseFloat(e.amt) || 0);
      }
    }
  });

  let peakDayIdx = 0;
  let maxDaySpend = 0;
  dayTotals.forEach((amt, idx) => {
    if (amt > maxDaySpend) {
      maxDaySpend = amt;
      peakDayIdx = idx;
    }
  });
  const peakDayName = isHi ? dayNamesHi[peakDayIdx] : dayNames[peakDayIdx];
  const peakDayPct = totalSpent > 0 ? Math.round((maxDaySpend / totalSpent) * 100) : 0;

  // 2. Compute Top Expense Category
  const catTotals = {};
  expList.forEach(e => {
    const c = e.label || 'Other';
    catTotals[c] = (catTotals[c] || 0) + (parseFloat(e.amt) || 0);
  });
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCatName = sortedCats.length ? sortedCats[0][0] : 'None';
  const topCatAmount = sortedCats.length ? sortedCats[0][1] : 0;
  const topCatPct = totalSpent > 0 ? Math.round((topCatAmount / totalSpent) * 100) : 0;

  // 3. Simple Monthly Budget Calculation
  const totalBudget = window.getSavedTotalBudget();
  const budgetMode = localStorage.getItem('pockettrack_budget_mode') || 'simple';
  const budgetSpentPct = Math.min(100, Math.round((totalSpent / totalBudget) * 100));
  const isOverBudget = totalSpent > totalBudget;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const safeDailySpend = Math.round(remainingBudget / remainingDays);

  host.innerHTML = `
    <!-- Budget Mode Switcher Card -->
    <div class="card" style="margin-bottom:14px;border-radius:24px;padding:20px;border:1px solid rgba(139,92,246,0.35);background:linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;">🎯</span>
          <h4 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:16px;color:#fff;">${isHi ? 'मासिक बजट नियंत्रण' : 'Monthly Budget Control'}</h4>
        </div>
        <button class="btn btn-sm" onclick="promptEditTotalBudget()" style="border-radius:10px;font-size:11.5px;padding:4px 10px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid var(--border);">⚙️ ${isHi ? 'बजट बदलें' : 'Set Budget'}</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
        <div style="font-size:22px;font-weight:800;font-family:'Space Grotesk',sans-serif;color:#fff;">
          ₹${totalSpent.toLocaleString('en-IN')} <span style="font-size:13px;color:var(--text-dim);font-weight:500;">/ ₹${totalBudget.toLocaleString('en-IN')}</span>
        </div>
        <div style="font-size:14px;font-weight:800;color:${isOverBudget ? 'var(--red,#f87171)' : 'var(--green,#34d399)'};">${budgetSpentPct}%</div>
      </div>

      <div style="width:100%;height:10px;border-radius:6px;background:rgba(255,255,255,0.08);overflow:hidden;margin-bottom:12px;">
        <div style="width:${budgetSpentPct}%;height:100%;background:${isOverBudget ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#10b981,#3b82f6)'};border-radius:6px;transition:width 0.8s;"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:rgba(0,0,0,0.22);padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:11px;color:var(--text-dim);">${isHi ? 'दैनिक सुरक्षित सीमा' : 'Safe Daily Limit'}</div>
          <div style="font-size:16px;font-weight:800;color:var(--green,#34d399);margin-top:2px;">₹${safeDailySpend}/day</div>
        </div>
        <div style="background:rgba(0,0,0,0.22);padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:11px;color:var(--text-dim);">${isHi ? 'महीने के शेष दिन' : 'Days Left'}</div>
          <div style="font-size:16px;font-weight:800;color:#fff;margin-top:2px;">${remainingDays} days</div>
        </div>
      </div>
    </div>

    <!-- Actionable Intelligence Metrics -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));">
        <div style="font-size:22px;margin-bottom:4px;">🚨</div>
        <div style="font-size:11px;color:var(--text-dim);font-weight:600;">${isHi ? 'पीक खर्च का दिन' : 'Peak Spending Day'}</div>
        <div style="font-size:16px;font-weight:800;color:#fff;margin:2px 0;">${peakDayName}</div>
        <div style="font-size:11px;color:var(--primary-bright);font-weight:700;">${peakDayPct}% of all spend</div>
      </div>

      <div class="card" style="padding:14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));">
        <div style="font-size:22px;margin-bottom:4px;">🍔</div>
        <div style="font-size:11px;color:var(--text-dim);font-weight:600;">${isHi ? 'शीर्ष खर्च श्रेणी' : 'Top Expense Leak'}</div>
        <div style="font-size:16px;font-weight:800;color:#fff;margin:2px 0;">${escapeHTML(topCatName)}</div>
        <div style="font-size:11px;color:var(--green,#34d399);font-weight:700;">₹${topCatAmount.toLocaleString('en-IN')} (${topCatPct}%)</div>
      </div>
    </div>
  `;
};

window.promptEditTotalBudget = function() {
  if (typeof window.openSetBudgetModal === 'function') {
    window.openSetBudgetModal();
  }
};


