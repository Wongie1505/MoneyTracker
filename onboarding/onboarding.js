const cats=MT.data.categories;
$('cats').innerHTML=cats.map((c,i)=>`<div class="cat"><input value="${MT.esc(c.name)}" data-n="${i}"><input type="number" min="0" max="100" value="${c.pct}" data-p="${i}"></div>`).join('');
function total(){const t=[...document.querySelectorAll('[data-p]')].reduce((a,e)=>a+(+e.value||0),0);
  $('tot').textContent='Total: '+t+'%'+(t>100?' (over 100%, you would plan to spend more than you make)':'');$('tot').className='sub '+(t>100?'neg':'');return t}
document.addEventListener('input',total);total();
$('go').onclick=()=>{
  const inc=+$('inc').value;
  if(!(inc>0))return alert('Enter your estimated monthly income.');
  if(total()>100)return alert('Your split is over 100%. Reduce it.');
  document.querySelectorAll('[data-n]').forEach(e=>cats[e.dataset.n].name=e.value.trim()||cats[e.dataset.n].name);
  document.querySelectorAll('[data-p]').forEach(e=>cats[e.dataset.p].pct=+e.value||0);
  MT.data.settings.estIncome=inc;MT.data.settings.onboarded=true;MT.save();
  location.href='../home/home.html';
};
