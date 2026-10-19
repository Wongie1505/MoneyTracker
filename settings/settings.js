MT.guard();
$('est').value=MT.data.settings.estIncome;
$('saveEst').onclick=()=>{MT.data.settings.estIncome=+$('est').value||0;MT.save();alert('Saved.')};
$('exp').onclick=MT.exportJSON;
$('imp').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{MT.importJSON(r.result);alert('Restored.');location.href='../home/home.html'}catch(x){alert('That file is not a valid backup.')}};r.readAsText(f)};
$('reset').onclick=()=>{if(confirm('Delete everything? Export a backup first.')){MT.reset();location.href='../index.html'}};
