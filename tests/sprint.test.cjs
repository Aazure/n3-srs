const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element=()=>({classList:{toggle(){},remove(){}},appendChild(){},textContent:'',value:'',innerHTML:''});
const elements=new Map();const doc={querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],addEventListener(){},createElement:element,head:element(),body:element()};
const storage={};const ctx=vm.createContext({document:doc,window:{scrollTo(){}},navigator:{},location:{protocol:'http:',hostname:'localhost'},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},setTimeout,clearTimeout,console});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync('data.js','utf8'));
const html=fs.readFileSync('index.html','utf8');
run([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);
run(fs.readFileSync('practice-data.js','utf8'));run(fs.readFileSync('sprint.js','utf8'));
assert.equal(run('V.length'),802);assert.equal(run('G.length'),140);
for(const [day,phase] of [['2026-11-05','診斷與分級'],['2026-11-06','核心補強'],['2026-11-20','限時整合'],['2026-11-26','模考與收尾'],['2026-12-01','考前暖身']])assert.equal(run(`sprintPhase('${day}')`),phase);
run('render=()=>{};S=defaultState();');
assert.equal(run('PRACTICE.length'),24);
assert.equal(run('new Set(PRACTICE.map(q=>q.id)).size'),24);
assert.equal(run('PRACTICE.every(q=>q.opts.length===4&&new Set(q.opts).size===4&&q.opts[q.answer]&&q.why)'),true);
run("startTraining('diagnostic')");assert.equal(run('S.sprint.active.qs.length'),20);
for(const k of ['v','g','r','l'])assert.equal(run(`S.sprint.active.qs.filter(q=>q.kind==='${k}').length`),5);
run("save();S=load();");assert.equal(run('S.sprint.active.qs.length'),20);
run("delete S.sprint.active;S.sprint.results['g-context-1']={kind:'g',total:1,correct:0,lastOK:false};startTraining('weak')");assert.equal(run('S.sprint.active.qs[0].id'),'g-context-1');
run('S.settings.mute=false;S.settings.auto=true;setQuiet()');assert.equal(run('S.settings.mute'),true);assert.equal(run('S.settings.auto'),false);
// Freeze the date via a Date shim to test hard deadline boundaries.
for(const [date,v,g] of [['2026-11-19',20,3],['2026-11-20',10,1],['2026-11-26',0,0],['2026-12-01',0,0]]){
 run(`Date=class extends globalThis.Date { constructor(...args){super(...(args.length?args:['${date}T12:00:00+08:00']))} };S.days={};S.cards={};S.settings.newV=20;S.settings.newG=3;`);
 assert.equal(run('sprintAllowance().v'),v);assert.equal(run('sprintAllowance().g'),g);
}
console.log('PASS: phase boundaries, 24 question integrity, balanced diagnosis, persistence, wrong review, quiet mode, new-card cutoff');
