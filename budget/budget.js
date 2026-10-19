MT.guard();
const cats=MT.data.categories;
function draw(){
  const b=MT.incomeBase(),sp=MT.spentByCat(MT.month(MT.today()));
  $('base').textContent=MT.money(b.amount);$('src').textContent='Based on '+b.source;
  const t=cats.reduce((a,c)=>a+c.pct,0);
  $('tot').textContent='Allocated: '+t+'%'+(t>100?' (over 100%, fix this)':t<100?' ('+(100-t)+'% unplanned)':'');
  $('tot').className='sub '+(t>100?'neg':'');
  $('cats').innerHTML=cats.map((c,i)=>{const plan=b.amount*c.pct/100,s=sp[c.name]||0;
    return `<div class="card"><div class="row"><input class="nm" data-n="${i}" value="${MT.esc(c.name)}"><input class="pc" type="number" min="0" max="100" data-p="${i}" value="${c.pct}"><span>%</span><button class="x" data-d="${i}">✕</button></div>
    <div class="sub">Plan ${MT.money(plan)} · Spent ${MT.money(s)} · Left ${MT.money(plan-s)}</div>
    <div class="bar"><i class="${s>plan?'over':''}" style="width:${plan?Math.min(s/plan*100,100):0}%"></i></div></div>`}).join('');
}
document.addEventListener('change',e=>{
  const n=e.target.dataset.n,p=e.target.dataset.p;
  if(n!==undefined){const old=cats[n].name,nw=e.target.value.trim()||old;
    MT.data.transactions.forEach(t=>{if(t.type==='expense'&&t.category===old)t.category=nw});cats[n].name=nw}
  if(p!==undefined)cats[p].pct=Math.max(0,+e.target.value||0);
  MT.save();draw();
});
document.addEventListener('click',e=>{
  if(e.target.dataset.d!==undefined&&confirm('Delete category? Its past transactions stay but lose their budget.')){cats.splice(e.target.dataset.d,1);MT.save();draw()}
});
$('add').onclick=()=>{const n=prompt('Category name?');if(n){cats.push({name:n.trim(),pct:0});MT.save();draw()}};
draw();
