const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const el=()=>({classList:{toggle(){},remove(){}},appendChild(){},innerHTML:'',value:''});
const nodes=new Map();const doc={querySelector:s=>{if(!nodes.has(s))nodes.set(s,el());return nodes.get(s)},querySelectorAll:()=>[],addEventListener(){},createElement:el,body:el(),head:el()};
const saved={cards:{v0:{seen:3,box:2,due:'2026-11-06'},v739:{seen:7,box:4,due:'2026-11-18'},g95:{seen:4,box:3,due:'2026-11-11'}},settings:{mute:true}};
const ctx=vm.createContext({document:doc,window:{scrollTo(){}},localStorage:{getItem:()=>JSON.stringify(saved),setItem(){}},setTimeout,clearTimeout,console});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync('data.js','utf8'));
run(fs.readFileSync('speech.js','utf8'));
const html=fs.readFileSync('index.html','utf8');
run([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]);
const {v,g}=JSON.parse(run('JSON.stringify({v:V,g:G})'));
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/original-identities.json'));
assert.equal(v.length,802);assert.equal(g.length,140);
assert.equal(new Set(v.map(x=>x.id)).size,802);
assert.equal(new Set(v.map(x=>x.word+'|'+x.reading)).size,802);
assert.equal(new Set(g.map(x=>x.id)).size,140);
for(const x of baseline.v){const got=v.find(y=>y.id===x.id);assert.equal(got.word,x.word,x.id);assert.equal(got.reading,x.reading,x.id)}
for(let i=0;i<baseline.g.length;i++)assert.equal(g[i].id,baseline.g[i].id);
assert.equal(run("S.cards.v739.box"),4);assert.equal(run("S.cards.g95.due"),'2026-11-11');
assert.equal(v.find(x=>x.id==='v739').word,'ボランティア');
for(const x of v){assert.ok(x.word&&x.reading&&x.meaning&&x.pos&&x.cat);assert.ok(!JSON.stringify(x).includes('\uFFFD'))}
for(const x of v.slice(740)){assert.ok(x.example&&x.translation&&x.scene,x.word)}
for(const x of g){for(const f of ['p','m','f','e','t','g'])assert.ok(x[f],x.id+':'+f);assert.ok(!/動詞ます形/.test(x.f),x.id)}
assert.match(g[95].f,/話す→話させられる/);
assert.match(g[53].f,/せずに/);assert.match(g[53].f,/去掉「ない」/);
assert.match(g[121].f,/去ない＋なければならない/);
assert.match(g[122].f,/去ない＋なくてもいい/);
assert.equal(g[6].p,'～ばかりでなく～も');
assert.match(g[104].f,/でしまう→じゃう/);
assert.match(g[40].f,/でも換成だって/);
assert.equal(v.find(x=>x.word==='貴重').pos,'な');
assert.ok(!v.find(x=>x.word==='荒い').meaning.includes('粗糙'));
assert.match(run("backHTML(V.find(v=>v.word==='申し込む'))"),/講座に申し込みました/);
assert.match(run('backHTML(G[95])'),/話させられる/);
for(const type of ['m','r','w']){
 for(let i=0;i<150;i++){
  const q=JSON.parse(run(`JSON.stringify(makeQuestion('${type}'))`));
  assert.equal(new Set(q.opts.map(o=>o.t)).size,4);
  assert.equal(q.opts.filter(o=>o.ok).length,1);
 }
}
const audit=JSON.parse(fs.readFileSync('audit/content-review.json'));
assert.equal(audit.vocab.length,740);assert.equal(audit.grammar.length,140);assert.equal(audit.addedVocab.length,62);
for(const item of audit.vocab.filter(x=>x.after))assert.equal(item.after[2],v.find(x=>x.id===item.id).meaning);
console.log('PASS: 802 vocabulary / 140 grammar; legacy IDs and progress preserved; full audit ledger; new examples; conjugation regressions; distinct quiz choices');
