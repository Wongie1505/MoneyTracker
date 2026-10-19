MT.guard();
$('mon').value=MT.month(MT.today());
function prev(m,k){const [y,mo]=m.split('-').map(Number),d=new Date(y,mo-1-k,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function draw(){
  const m=$('mon').value,tx=MT.monthTx(m),inc=MT.sum(tx,'income'),exp=MT.sum(tx,'expense'),pl=inc-exp;
  $('title').textContent='Report for '+m;
  $('inc').textContent=MT.money(inc);$('exp').textContent=MT.money(exp);
  $('pl').textContent=(pl<0?'-':'')+MT.money(Math.abs(pl));$('pl').className=pl<0?'neg':'pos';
  const b=MT.incomeBase(m),sp=MT.spentByCat(m);
  $('plan').innerHTML=MT.data.categories.map(c=>{const p=b.amount*c.pct/100,s=sp[c.name]||0;
    return `<div style="margin-bottom:12px"><div class="split"><span>${MT.esc(c.name)}</span><span class="sub">${MT.money(s)} / ${MT.money(p)}</span></div>
    <div class="bar"><i class="${s>p?'over':''}" style="width:${p?Math.min(s/p*100,100):0}%"></i></div></div>`}).join('');
  const ms=[5,4,3,2,1,0].map(k=>prev(m,k)),data=ms.map(x=>{const t=MT.monthTx(x);return[MT.sum(t,'income'),MT.sum(t,'expense')]});
  const mx=Math.max(1,...data.flat());
  $('chart').innerHTML=ms.map((x,i)=>`<div class="col"><div class="pair"><i class="a" style="height:${data[i][0]/mx*100}%"></i><i class="b" style="height:${data[i][1]/mx*100}%"></i></div>${x.slice(5)}</div>`).join('');
}
$('mon').onchange=draw;$('pdf').onclick=()=>window.print();draw();
