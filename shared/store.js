/* One source of truth: transactions + categories + settings. Everything else is calculated. */
const $=id=>document.getElementById(id);
const MT=(()=>{
  const KEY='moneytracker_v1';
  const DEF={settings:{onboarded:false,estIncome:0},
    categories:[{name:'Giving',pct:10},{name:'Basic needs',pct:50},{name:'Savings',pct:15},{name:'Transport',pct:10},{name:'Personal',pct:10},{name:'Other',pct:5}],
    transactions:[]};
  let d;
  try{d=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(!d)d=structuredClone(DEF);
  const save=()=>localStorage.setItem(KEY,JSON.stringify(d));
  const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const month=s=>s.slice(0,7);
  const money=n=>'MK '+Math.round(n).toLocaleString();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const monthTx=m=>d.transactions.filter(t=>month(t.date)===m);
  const sum=(l,type)=>l.filter(t=>t.type===type).reduce((a,t)=>a+t.amount,0);
  function incomeBase(m=month(today())){
    const by={};
    d.transactions.filter(t=>t.type==='income'&&month(t.date)<m).forEach(t=>by[month(t.date)]=(by[month(t.date)]||0)+t.amount);
    const ks=Object.keys(by).sort().slice(-3);
    if(ks.length>=2)return{amount:ks.reduce((a,k)=>a+by[k],0)/ks.length,source:'average of your last '+ks.length+' months',actual:true};
    return{amount:d.settings.estIncome,source:'your estimate',actual:false};
  }
  function spentByCat(m){const o={};monthTx(m).filter(t=>t.type==='expense').forEach(t=>o[t.category]=(o[t.category]||0)+t.amount);return o}
  function txRow(t,del){
    const inc=t.type==='income';
    return `<div class="tx"><div><b>${esc(t.note||t.category)}</b><span class="sub">${esc(t.category)} · ${t.date}</span></div>
    <div class="row"><b class="${inc?'pos':'neg'}">${inc?'+':'-'}${money(t.amount)}</b>${del?`<button class="x" data-id="${t.id}">✕</button>`:''}</div></div>`;
  }
  function guard(){if(!d.settings.onboarded)location.replace('../onboarding/onboarding.html')}
  const exportJSON=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));a.download='moneytracker-backup-'+today()+'.json';a.click()};
  function importJSON(text){const x=JSON.parse(text);if(!x.settings||!x.transactions||!x.categories)throw 0;d=x;save()}
  function reset(){d=structuredClone(DEF);save()}
  if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('../sw.js');
  return{get data(){return d},save,today,month,money,esc,monthTx,sum,incomeBase,spentByCat,txRow,guard,exportJSON,importJSON,reset};
})();
