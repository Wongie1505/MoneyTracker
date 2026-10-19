MT.guard();
let type='expense';
$('cat').innerHTML=MT.data.categories.map(c=>`<option>${MT.esc(c.name)}</option>`).join('');
$('date').value=MT.today();$('mon').value=MT.month(MT.today());
function setType(t){type=t;$('tExp').className=t==='expense'?'':'ghost';$('tInc').className=t==='income'?'':'ghost';$('catWrap').style.display=t==='expense'?'':'none'}
$('tExp').onclick=()=>setType('expense');$('tInc').onclick=()=>setType('income');
function draw(){
  const l=MT.monthTx($('mon').value).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  $('list').innerHTML=l.length?l.map(t=>MT.txRow(t,true)).join(''):'<div class="empty">No transactions this month.</div>';
}
$('save').onclick=()=>{
  const amount=+$('amt').value;
  if(!(amount>0))return alert('Enter an amount.');
  MT.data.transactions.push({id:Date.now(),type,amount,category:type==='income'?'Income':$('cat').value,note:$('note').value.trim(),date:$('date').value||MT.today()});
  MT.save();$('amt').value='';$('note').value='';$('mon').value=MT.month($('date').value);draw();$('amt').focus();
};
$('list').onclick=e=>{const id=e.target.dataset.id;if(id&&confirm('Delete this transaction?')){MT.data.transactions=MT.data.transactions.filter(t=>t.id!=id);MT.save();draw()}};
$('mon').onchange=draw;draw();$('amt').focus();
