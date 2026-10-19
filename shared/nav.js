(()=>{
  const tabs=[['home','Home','🏠'],['transactions','Transactions','💸'],['budget','Budget','🎯'],['reports','Reports','📊']];
  const p=document.body.dataset.page,n=document.createElement('nav');n.className='tabbar';
  n.innerHTML=tabs.map(t=>`<a href="../${t[0]}/${t[0]}.html" class="${p===t[0]?'on':''}"><span>${t[2]}</span>${t[1]}</a>`).join('');
  document.body.appendChild(n);
})();
