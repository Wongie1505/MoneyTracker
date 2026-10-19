MT.guard();
const m=MT.month(MT.today()),b=MT.incomeBase(),tx=MT.monthTx(m);
const inc=MT.sum(tx,'income'),exp=MT.sum(tx,'expense'),rem=b.amount-exp;
$('rem').textContent=MT.money(rem);$('rem').className='big '+(rem<0?'neg':'');
$('remsub').textContent='of '+MT.money(b.amount)+' planned ('+b.source+')';
$('rembar').style.width=Math.min(Math.max(exp/(b.amount||1)*100,0),100)+'%';
if(exp>b.amount)$('rembar').className='over';
$('inc').textContent=MT.money(inc);$('exp').textContent=MT.money(exp);
const pl=inc-exp;$('pl').textContent=(pl<0?'-':'')+MT.money(Math.abs(pl));$('pl').className=pl<0?'neg':'pos';
const sp=MT.spentByCat(m);
$('buckets').innerHTML=MT.data.categories.map(c=>{const plan=b.amount*c.pct/100,s=sp[c.name]||0;
  return `<div class="bk"><div class="split"><span>${MT.esc(c.name)}</span><span class="sub">${MT.money(s)} / ${MT.money(plan)}</span></div>
  <div class="bar"><i class="${s>plan?'over':''}" style="width:${plan?Math.min(s/plan*100,100):0}%"></i></div></div>`}).join('');
const r=[...MT.data.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,5);
$('recent').innerHTML=r.length?r.map(t=>MT.txRow(t)).join(''):'<div class="empty">Nothing yet. Tap + to add your first one.</div>';
