// Sprint progress is stored inside the existing backup, without changing card IDs.
const SPRINT_START='2026-11-04', SPRINT_END='2026-11-30';
const SKILLS={v:'單字',g:'文法',r:'閱讀',l:'聽力'};
function sprintState(){
  if(!S.sprint||typeof S.sprint!=='object')S.sprint={};
  const p=S.sprint;
  p.results=p.results||{};p.minutes=p.minutes||{};p.mock=p.mock||{};
  return p;
}
function sprintPhase(day=todayKey()){
  if(day<SPRINT_START)return '準備';
  if(day<='2026-11-05')return '診斷與分級';
  if(day<='2026-11-19')return '核心補強';
  if(day<='2026-11-25')return '限時整合';
  if(day<=SPRINT_END)return '模考與收尾';
  return '考前暖身';
}
function sprintAllowance(){
  const due=stats().vDue+stats().gDue, day=todayKey();
  const used=S.days[day]||{newV:0,newG:0};
  const factor=day>='2026-11-26'?0:day>='2026-11-20'?.5:1;
  const load=due>80?0:due>40?.5:1;
  return {v:Math.max(0,Math.floor(S.settings.newV*factor*load)-(used.newV||0)),g:Math.max(0,Math.floor(S.settings.newG*factor*load)-(used.newG||0))};
}
function skillStats(k){
  const rows=Object.values(sprintState().results).filter(r=>r.kind===k);
  const total=rows.reduce((n,r)=>n+r.total,0), correct=rows.reduce((n,r)=>n+r.correct,0);
  return {total,correct,weak:rows.filter(r=>!r.lastOK).length,unique:rows.length};
}
function setQuiet(){S.settings.mute=true;S.settings.auto=false;if('speechSynthesis' in window)speechSynthesis.cancel();save();}
function openSprint(mode){
  sprintState().mode=mode;if(mode==='office')setQuiet();
  save();view='home';render();
}
renderHome=function(m){
  const p=sprintState(), day=todayKey(), remaining=Math.max(0,dayDiff(day,SPRINT_END)+1), allowance=sprintAllowance();
  const mode=p.mode||'office';
  const done=p.minutes[day]||{};
  const modes=[['commute','通勤聽力',25],['office','上班靜音',30],['evening','晚間整合',35]];
  const ss=stats();
  m.innerHTML=`<div class="card sprint-hero"><span class="pill">${sprintPhase()} · 11/30 完成</span><h2 style="font-size:26px;margin:12px 0">${remaining?'還有 '+remaining+' 天，一次完成一小段。':'核心衝刺結束，今天輕量複習。'}</h2><p>聽力與文法優先，單字每天補，閱讀不中斷。</p><div class="bar"><i style="width:${Math.min(100,Math.max(0,dayDiff(SPRINT_START,day))/27*100)}%"></i></div><p class="muted">11/4–11/30 · 每日 90 分鐘 · 已記錄 ${Object.values(done).reduce((a,b)=>a+b,0)} 分鐘</p></div>
  <div class="grid">${modes.map(([id,label,n])=>`<button class="btn ${mode===id?'':'secondary'}" data-mode="${id}" aria-pressed="${mode===id}">${label}<br><small>${done[id]||0} / ${n} 分鐘</small></button>`).join('')}</div>
  <div class="card" style="margin-top:14px"><h2>${modes.find(x=>x[0]===mode)?.[1]||'今日任務'}</h2><p class="muted">${mode==='office'?'完全靜音；每組 5 題，可離開並續做。':mode==='commute'?'短聽力 → 作答 → 逐字稿 → 重聽。開車騎車時請勿操作。':'補文法、讀文章，再精聽今天的錯題。'}</p><div class="row">
  ${mode!=='commute'?'<button class="btn" id="srs-start">到期與新卡</button>':''}
  ${(mode==='commute'?['l']:mode==='office'?['v','g','r']:['g','r','l']).map(k=>`<button class="btn secondary" data-practice="${k}">${SKILLS[k]} 5 題</button>`).join('')}
  </div><p class="muted">到期 ${ss.vDue+ss.gDue} 張；今日新增上限：${allowance.v} 字、${allowance.g} 個文法。積欠多時減量，11/26 起停止新增。</p>
  <label>記錄本時段實際學習 <input id="minutes" type="number" min="1" max="180" value="5"> 分鐘</label> <button class="btn small secondary" id="log-time">加入紀錄</button><p class="muted">時間由你手動記錄，不把頁面閒置算成學習。</p></div>
  <div class="card"><h2>先找缺口，再安排練習</h2><p class="muted">診斷共 20 題，每項 5 題；可分段完成。結果是小樣本線索，不代表 N3 合格分數。聽力可留到有聲音時完成。</p><div class="row"><button class="btn secondary" id="diagnose">開始分項診斷</button>${p.active?'<button class="btn" id="resume">繼續未完成題組</button>':''}<button class="btn secondary" id="weak">重練錯題</button></div><div class="grid" style="margin-top:14px">${Object.keys(SKILLS).map(k=>{const a=skillStats(k);return `<div class="stat"><div class="l">${SKILLS[k]}</div><div class="n">${a.total?Math.round(a.correct/a.total*100)+'%':'待測'}</div><div class="l">${a.unique} 個不同題目 · ${a.weak} 個待補強</div></div>`}).join('')}</div></div>
  <div class="card"><h2>27 天衝刺路線</h2><p>11/4–5 診斷 → 11/6–19 核心補強 → 11/20–25 限時整合 → 11/26–30 模考與檢討</p><p class="muted">收錄 ${V.length} 個單字、${G.length} 張文法卡，以及 ${PRACTICE.length} 題原創情境練習。情境題庫仍有限，請搭配官方練習；合成語音不等同正式聽力音檔。</p><a href="https://www.jlpt.jp/e/samples/sampleindex.html" target="_blank" rel="noopener">開啟 JLPT 官方題本與聽力音檔 ↗</a><p class="muted">建議 11/26、11/29 分別保留完整時段模考，其餘時間檢討。以下由你完成官方題本後勾選。</p>${['第一回模考','第一回檢討','第二回模考','第二回檢討'].map((x,i)=>`<label style="display:block"><input type="checkbox" data-mock="${i}" ${p.mock[i]?'checked':''}> ${x}</label>`).join('')}</div>`;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>openSprint(b.dataset.mode));
  document.querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>startTraining(b.dataset.practice));
  if($('#srs-start'))$('#srs-start').onclick=()=>{session=null;view='study';render()};
  $('#diagnose').onclick=()=>startTraining('diagnostic');
  $('#weak').onclick=()=>startTraining('weak');
  if($('#resume'))$('#resume').onclick=()=>{view='training';render()};
  $('#log-time').onclick=()=>{const n=Number($('#minutes').value);if(!Number.isInteger(n)||n<1||n>180){toast('請輸入 1～180 分鐘');return}p.minutes[day]={...done,[mode]:(done[mode]||0)+n};save();render()};
  document.querySelectorAll('[data-mock]').forEach(b=>b.onchange=()=>{p.mock[b.dataset.mock]=b.checked;save()});
  $('#hdr-sub').textContent=remaining?`距離完成 ${remaining} 天`:'考前暖身';
};
function vocabQuestions(){return V.map(v=>{
  const choices=[v,...shuffle(V.filter(x=>x.id!==v.id&&x.meaning!==v.meaning)).filter((x,i,a)=>a.findIndex(y=>y.meaning===x.meaning)===i).slice(0,3)];
  return {id:'vocab-'+v.id,cardId:v.id,kind:'v',q:v.word+'（'+v.reading+'）的意思是？',passage:'',opts:choices.map(x=>x.meaning),answer:0,why:v.word+'（'+v.reading+'）：'+v.meaning};
})}
function orderedQuestions(list){
  const results=sprintState().results;
  return shuffle(list).sort((a,b)=>{
    const weight=q=>!results[q.id]?1:results[q.id].lastOK?2:0;
    return weight(a)-weight(b);
  });
}
function startTraining(kind){
  const p=sprintState();
  if(p.active){view='training';render();toast('先續做目前題組；也可返回後結束題組');return}
  const all=[...vocabQuestions(),...PRACTICE];
  let qs=kind==='diagnostic'?Object.keys(SKILLS).flatMap(k=>orderedQuestions(all.filter(q=>q.kind===k)).slice(0,5)):
    orderedQuestions(all.filter(q=>kind==='weak'?p.results[q.id]&&!p.results[q.id].lastOK:q.kind===kind)).slice(0,5);
  if(!qs.length){toast('目前沒有待重練錯題');return}
  qs=qs.map(q=>{const order=shuffle(q.opts.map((_,i)=>i));return {...q,opts:order.map(i=>q.opts[i]),answer:order.indexOf(q.answer)}});
  p.active={kind,qs,i:0,answers:[],startedAt:Date.now()};save();view='training';render();
}
function renderTraining(m){
  const p=sprintState(), a=p.active;
  if(!a){view='home';render();return}
  if(a.i>=a.qs.length){
    const correct=a.answers.filter(x=>x.ok).length;
    m.innerHTML=`<div class="card"><h2>本輪完成：${correct} / ${a.qs.length}</h2><p>答錯的項目已加入「重練錯題」。請依原因補強，再用不同題目確認理解。</p>${Object.keys(SKILLS).map(k=>{const rows=a.answers.filter(x=>x.kind===k);return rows.length?`<p>${SKILLS[k]}：${rows.filter(x=>x.ok).length} / ${rows.length}</p>`:''}).join('')}<p class="muted">這是練習表現，不換算 JLPT 分數或合格機率。</p><button class="btn" id="finish-training">完成並回課表</button></div>`;
    $('#finish-training').onclick=()=>{p.lastSession={date:todayKey(),kind:a.kind,correct,total:a.qs.length};delete p.active;save();view='home';render()};return;
  }
  const q=a.qs[a.i], ans=a.answers[a.i], listening=q.kind==='l';
  m.innerHTML=`<div class="row" style="justify-content:space-between;margin-bottom:12px"><span>${SKILLS[q.kind]} · ${a.i+1} / ${a.qs.length}</span><button class="btn small secondary" id="pause-training">暫停回課表</button></div><div class="bar" style="margin-bottom:14px"><i style="width:${a.i/a.qs.length*100}%"></i></div><div class="card">
  ${listening?`<p class="muted">合成語音短對話 · 作答後顯示逐字稿</p><button class="btn secondary" id="listen">${S.settings.mute?'開啟聲音並播放':'播放／重聽'}</button><p id="audio-status" role="status" class="muted">${S.settings.mute?'目前靜音。請到適合聽聲音的環境再按播放。':'可重播；正式音檔請使用首頁官方資源。'}</p>`:q.passage?`<p class="jp" style="font-size:19px;line-height:1.9">${esc(q.passage)}</p>`:''}
  <h2 class="jp" style="margin-top:20px">${esc(q.q)}</h2><div class="opts">${q.opts.map((x,i)=>`<button data-option="${i}" ${ans?'disabled':''} class="${ans?(i===q.answer?'correct':i===ans.choice?'wrong':''):''}">${esc(x)}</button>`).join('')}</div>
  ${ans?`<div role="status"><h3>${ans.ok?'答對了':'再確認一次用法'}</h3><p>${esc(q.why)}</p>${listening?`<details open><summary>逐字稿：看懂後，關閉再聽一次</summary><p class="jp">${esc(q.passage)}</p></details>`:''}${!ans.ok?`<label>這次卡在哪裡？ <select id="reason"><option value="">選擇原因</option>${['單字不認識','聽不出聲音','文法混淆','漏看或漏聽條件','閱讀太慢'].map(r=>`<option ${ans.reason===r?'selected':''}>${r}</option>`).join('')}</select></label>`:''}<p><button class="btn" id="training-next">${a.i===a.qs.length-1?'查看結果':'下一題'}</button></p></div>`:''}
  </div><button class="btn small secondary" id="end-training">結束本題組（保留已作答紀錄）</button>`;
  $('#pause-training').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();view='home';render()};
  $('#end-training').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();delete p.active;save();view='home';render()};
  if(listening)$('#listen').onclick=()=>{
    if(!('speechSynthesis' in window)){$('#audio-status').textContent='此瀏覽器無語音功能，請換支援的瀏覽器或使用官方音檔。';return}
    pickVoice();if(!jaVoice){$('#audio-status').textContent='未偵測到日文語音，請安裝日文語音後再試；此題可暫停。';return}
    S.settings.mute=false;save();document.body.classList.remove('muted');$('#mute').textContent='🔊';
    speak(q.passage.replace(/女：/g,'').replace(/男：/g,''));$('#audio-status').textContent='播放中；可按右上角靜音立即停止。';
  };
  document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{
    if(a.answers[a.i])return;
    const choice=Number(b.dataset.option),ok=choice===q.answer;
    a.answers[a.i]={choice,ok,kind:q.kind};
    const prev=p.results[q.id]||{kind:q.kind,total:0,correct:0};
    p.results[q.id]={...prev,total:prev.total+1,correct:prev.correct+Number(ok),lastOK:ok,date:todayKey()};
    if(!ok&&q.cardId){const c=card(q.cardId);if(!c.seen)c.seen=1;c.box=0;c.due=todayKey()}
    save();render();
  });
  if($('#reason'))$('#reason').onchange=e=>{ans.reason=e.target.value;p.results[q.id].reason=e.target.value;save()};
  if($('#training-next'))$('#training-next').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();a.i++;save();render()};
}
// Merge missing settings when loading older backups.
S.settings={...defaultState().settings,...S.settings};
const sprintStyle=document.createElement('style');
sprintStyle.textContent='.sprint-hero{background:var(--accent-soft)}button:focus-visible,a:focus-visible,select:focus-visible{outline:3px solid var(--blue);outline-offset:3px}select{font:inherit;padding:8px;max-width:100%;background:var(--card);color:var(--ink)}.grid button small{font-weight:400}';
document.head.appendChild(sprintStyle);

if((sprintState().mode||'office')==='office')setQuiet();
