let jaVoice=null, jaVoices=[], speechRun=0, speechTimer=null, speechUtterance=null;
function pickVoice(){
  try{jaVoices=speechSynthesis.getVoices().filter(v=>/^ja(?:[-_]|$)/i.test(v.lang));
    jaVoice=jaVoices.find(v=>/Kyoko|O-ren|Google|Nanami|Keita/i.test(v.name))||jaVoices[0]||null;
  }catch(e){jaVoices=[];jaVoice=null}
}
function dialogueVoices(){
  pickVoice();
  const selected=role=>jaVoices.find(v=>v.voiceURI===S.settings['voice'+role]);
  const female=selected('Female')||jaVoices.find(v=>/Kyoko|O-ren|Nanami|Haruka|Ayumi/i.test(v.name))||jaVoice;
  const male=selected('Male')||jaVoices.find(v=>/Otoya|Keita|Ichiro|Hattori/i.test(v.name))||jaVoices.find(v=>v.voiceURI!==female?.voiceURI)||female;
  return {female,male};
}
function dialogueParts(text){
  const parts=[];let role='narrator',start=0;
  for(const m of text.matchAll(/(女|男)[：:]/g)){
    const content=text.slice(start,m.index).trim();if(content)parts.push({role,text:content});
    role=m[1]==='女'?'female':'male';start=m.index+m[0].length;
  }
  const tail=text.slice(start).trim();if(tail)parts.push({role,text:tail});
  return parts;
}
function audioStatus(message){const el=document.querySelector('#audio-status');if(el)el.textContent=message;}
function stopSpeech(){speechRun++;clearTimeout(speechTimer);speechTimer=null;speechUtterance=null;if('speechSynthesis' in window)speechSynthesis.cancel();audioStatus('已停止播放。');}
function speak(text,rate){
  if(S.settings.mute)return;
  if(!('speechSynthesis' in window)){toast('此瀏覽器不支援語音');return}
  stopSpeech();pickVoice();
  const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';if(jaVoice)u.voice=jaVoice;u.rate=rate||(S.settings.rate||0.9);speechUtterance=u;
  speechSynthesis.speak(u);
}
function speakDialogue(text){
  stopSpeech();if(S.settings.mute)return;
  if(!('speechSynthesis' in window)){audioStatus('此瀏覽器不支援語音。');return}
  const voices=dialogueVoices();if(!voices.female){audioStatus('尚未找到日文語音，請安裝日文語音或稍後重試。');return}
  const parts=dialogueParts(text),run=speechRun;
  const shared=voices.female.voiceURI===voices.male.voiceURI;
  const next=i=>{
    if(run!==speechRun||S.settings.mute)return;
    if(i>=parts.length){speechUtterance=null;audioStatus('播放完畢，可再聽一次。');return}
    const p=parts[i],u=new SpeechSynthesisUtterance(p.text);
    u.lang='ja-JP';u.voice=voices[p.role]||jaVoice;u.rate=S.settings.rate||0.9;
    // A pitch distinction is a fallback, never presented as a separate real voice.
    u.pitch=shared?(p.role==='female'?1.12:p.role==='male'?.88:1):1;
    speechUtterance=u;
    audioStatus(`播放中：${p.role==='female'?'女方':p.role==='male'?'男方':'旁白'} · ${i+1}/${parts.length}${shared?'（同一聲音，以音高輔助區分）':''}`);
    u.onend=()=>{if(run!==speechRun)return;speechTimer=setTimeout(()=>next(i+1),i+1<parts.length?650:0)};
    u.onerror=()=>{if(run===speechRun){stopSpeech();audioStatus('播放中斷，請按播放重試或在設定選擇其他聲音。')}};
    try{speechSynthesis.speak(u)}catch(e){u.onerror()}
  };next(0);
}
function renderVoiceControls(){
  const target=document.querySelector('#dialogue-voices');if(!target)return;
  const voices=dialogueVoices();
  target.innerHTML='<h2>對話角色聲音</h2><p class="muted">自動依聲音名稱選擇，也可手動指定並試聽。換人時停頓約 0.65 秒；只有一種聲音時，以不同音高輔助區分。</p>'+['Female','Male'].map(role=>{
    const key='voice'+role,current=S.settings[key]||'';
    return `<p><label>${role==='Female'?'女方':'男方'} <select id="voice-${role}"><option value="">自動選擇</option>${current&&!jaVoices.some(v=>v.voiceURI===current)?`<option value="${esc(current)}" selected>已選聲音目前不可用（暫用自動選擇）</option>`:''}${jaVoices.map(v=>`<option value="${esc(v.voiceURI)}" ${v.voiceURI===current?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label></p>`;
  }).join('')+`<p class="muted">目前：女方 ${esc(voices.female?.name||'未找到日文語音')} ／ 男方 ${esc(voices.male?.name||'未找到日文語音')}</p><button class="btn small secondary" id="test-dialogue">試聽對話（依目前聲音開關）</button>`;
  ['Female','Male'].forEach(role=>document.querySelector('#voice-'+role).onchange=e=>{stopSpeech();S.settings['voice'+role]=e.target.value;save();renderVoiceControls()});
  document.querySelector('#test-dialogue').onclick=()=>{if(S.settings.mute){toast('目前靜音，請先開啟右上角聲音');return}speakDialogue('女：明日は何時に会いますか。男：十時に駅で会いましょう。女：分かりました。')};
}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=()=>{pickVoice();renderVoiceControls()};}
if(typeof window.addEventListener==='function')window.addEventListener('pagehide',stopSpeech);
