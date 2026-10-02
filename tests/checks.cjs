/* Run with node tests/checks.cjs. No install required. */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"math.js"),"utf8");
const ui=fs.readFileSync(path.join(root,"app.js"),"utf8");
let testNow=1000000;
const testDate={now:()=>testNow};
let seed=123456789;
const seededMath=Object.create(Math);
seededMath.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
const context=vm.createContext({Date:testDate,Math:seededMath});
vm.runInContext(source,context);
const M=context.SquishMath;
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++}
function eq(a,b,message){check(M.equal(a,b),message)}
function choices(q){
 check(q.options.length===4,"exactly four answers");
 check(new Set(q.options.map(r=>r.n+"/"+r.d)).size===4,"unique answers");
 check(q.options.filter(r=>M.equal(r,q.answer)).length===1,"one correct option");
}
eq(M.calculate(M.rational(1,2),M.rational(1,3),"+"),M.rational(5,6),"different denominators");
eq(M.calculate(M.rational(5,4),M.rational(2,3),"−"),M.rational(7,12),"mixed subtraction");
eq(M.calculate(M.rational(3,2),M.rational(7,3),"×"),M.rational(7,2),"mixed multiplication");
eq(M.calculate(M.rational(5,2),M.rational(3,4),"÷"),M.rational(10,3),"mixed division");
eq(M.calculate(M.rational(2,3),M.rational(2,3),"−"),M.rational(0),"zero result");
for(const level of ["simple","mixed"])for(const op of ["+","−","×","÷","mix"])for(let trial=0;trial<40;trial++){
 const qs=M.makeRound("fractions",{level,op});
 check(qs.length===10,"ten fraction questions");
 const identity=q=>{const operands=[q.a.n+"/"+q.a.d,q.b.n+"/"+q.b.d];if(q.op==="+"||q.op==="×")operands.sort();return q.op+"|"+operands.join("|")};
 check(new Set(qs.map(identity)).size===10,"no repeated fraction problems, including swapped operands");
 check(qs.filter(q=>q.blank==="result").length===6&&qs.filter(q=>q.blank==="a").length===2&&qs.filter(q=>q.blank==="b").length===2,"regular and missing-number questions in every fraction round");
 if(op==="mix")for(const o of ["+","−","×","÷"]){const n=qs.filter(q=>q.op===o).length;check(n>=2&&n<=3,"balanced mixed operation round")}
 for(const q of qs){
  const a=q.a.n/q.a.d,b=q.b.n/q.b.d,want=q.op==="+"?a+b:q.op==="−"?a-b:q.op==="×"?a*b:a/b;
  check(Math.abs(q.result.n/q.result.d-want)<1e-10,"fraction arithmetic");
 eq(q.answer,q.blank==="a"?q.a:q.blank==="b"?q.b:q.result,"answer matches the missing position");
 eq(M.calculate(q.blank==="a"?q.answer:q.a,q.blank==="b"?q.answer:q.b,q.op),q.result,"substituted answer makes equation true");
  check(q.answer.n>=0&&q.answer.d>0,"nonnegative valid fraction");
  check(M.gcd(q.answer.n,q.answer.d)===1,"simplified fraction");
  check(q.answer.d<=24,"simple result denominator");
  check(level==="mixed"?a>1&&b>1:a<1&&b<1,"requested number type");
  eq(M.parseAnswer(M.format(q.answer),"fractions"),q.answer,"format and parse");
  choices(q);
 }
}
for(let table=1;table<=10;table++)for(let trial=0;trial<10;trial++){
 const qs=M.makeRound("times",{table});
 check(qs.length===10&&new Set(qs.map(q=>q.b)).size===10,"every multiplier 1–10 exactly once");
 for(const q of qs){check(q.a===table&&q.answer.n===table*q.b,"selected multiplication table");choices(q)}
}
for(const cash of ["coins","bills","mixed"])for(let trial=0;trial<50;trial++){
 const deck=M.makeRound("money",{cash});
 check(deck.length===10&&new Set(deck.map(q=>q.pieces.join(","))).size===10,"ten distinct money questions");
 for(const q of deck){
 check(q.answer.n===q.pieces.reduce((s,n)=>s+n,0),"exact cents total");
 check(q.pieces.every(v=>M.CASH.some(c=>c.value===v)),"recognized US denominations");
 if(cash==="coins")check(q.pieces.every(v=>v<100),"coins only");
 if(cash==="bills")check(q.pieces.every(v=>v>=100),"bills only");
 if(cash==="mixed")check(q.pieces.some(v=>v<100)&&q.pieces.some(v=>v>=100),"coins plus bills");
 eq(M.parseAnswer(M.money(q.answer.n),"money"),q.answer,"dollar parsing");
 choices(q);
}}
for(const [text,mode,n,d] of [["1 1/2","fractions",3,2],["6/4","fractions",3,2],["0","fractions",0,1],["$1.05","money",105,1],["1.5","money",150,1],["0.01","money",1,1],["100","times",100,1]])eq(M.parseAnswer(text,mode),M.rational(n,d),"answer format accepted");
for(const [s,m] of [["1/0","fractions"],["1..2","money"],["-1","times"],["1.001","money"],["","fractions"],["2e3","times"]])check(M.parseAnswer(s,m)===null,"invalid answer rejected");
eq(M.parseFields({whole:"1",top:"2",bottom:"4"}),M.rational(3,2),"mixed answer fields");
eq(M.parseFields({top:"6",bottom:"4"}),M.rational(3,2),"improper fractions accepted");
eq(M.parseFields({whole:"0"}),M.rational(0),"zero whole accepted");
for(const fields of [{},{top:"1",bottom:"0"},{top:"1"},{bottom:"2"},{whole:"1.5"},{whole:"-1",top:"1",bottom:"2"}])check(M.parseFields(fields)===null,"invalid fields rejected");
const c={op:"+",level:"simple",table:7,cash:"mixed",duration:0,input:"choices"};
let g=M.startRound("times",c,1000),p=M.emptyProgress();
for(let i=0;i<10;i++){
 const q=g.questions[g.index];
 check(M.answerRound(g,q.answer,null,1001)==="correct","correct answer");
 check(M.answerRound(g,q.answer,null,1001)==="ignored","double tap cannot score twice");
 check(M.nextRound(g,1002)===(i===9?"complete":"next"),"round progression");
}
let r=M.finishRound(g,p);
check(r.solved===10&&p.stars.Esther===10&&p.rounds.Esther===1&&p.tables[7]===10,"completed round stored");
check(M.finishRound(g,p)===null&&p.stars.Esther===10,"finish cannot duplicate reward");
g=M.startRound("fractions",c,1000);
check(M.revealRound(g)&&g.solved===0&&g.attempted===1,"learning reveal does not award correct score");
check(M.nextRound(g,1001)==="next","can continue after reveal");
g=M.startRound("times",{...c,duration:60},1000);
check(M.answerRound(g,g.questions[0].answer,null,60999)==="correct","answer before deadline");
check(M.nextRound(g,61000)==="expired","deadline exact boundary");
r=M.finishRound(g,p);check(r.best===1&&r.newBest,"timed best stored");
check(M.answerRound(g,g.questions[0].answer,null,61001)==="ignored","finished game rejects answer");
g=M.startRound("money",{...c,duration:120},1000);
check(M.pauseRound(g,31000)&&g.remaining===90000,"pause records remaining time");
check(!M.expired(g,900000),"paused clock does not expire");
check(M.answerRound(g,g.questions[0].answer,null,32000)==="ignored","paused answers ignored");
check(M.resumeRound(g,501000)&&g.deadline===591000,"resume preserves duration");
check(M.answerRound(g,g.questions[0].answer,null,591000)==="expired","late answers cannot score");
g=M.startRound("fractions",c,1000);
const original=g.config.op;c.op="÷";check(g.config.op===original,"round settings are independent");
const raw={stars:{Delilah:-2,Esther:"bad"},rounds:{Esther:3},best:{"__proto__":10},tables:{"2":500}};
const clean=M.sanitizeProgress(raw);
check(clean.stars.Delilah===0&&clean.stars.Esther===0&&clean.tables[2]===10,"stored data sanitized");
check(M.bestKey("fractions",{...c,duration:60})!==M.bestKey("fractions",{...c,duration:120}),"separate timer records");
// Lightweight interface smoke check. This exercises handlers, not browser layout.
const listeners={},timers=[];
const node={innerHTML:"",textContent:"",value:"",dataset:{},addEventListener:(type,fn)=>listeners[type]=fn,focus(){},setAttribute(){},classList:{remove(){},add(){},toggle(){}}};
const document={hidden:false,getElementById:()=>node,querySelector:()=>node,addEventListener(){}};
const store={};
const localStorage={getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v};
const win={SquishMath:M,scrollTo(){}};
const uiContext=vm.createContext({window:win,document,localStorage,setInterval:fn=>timers.push(fn),Date:testDate,console});
vm.runInContext(ui,uiContext);
function click(action,data={}){const target={...node,dataset:{action,...data},disabled:false};listeners.click({target:{closest:()=>target}})}
check(node.innerHTML.includes("Choose your adventure"),"home renders");
click("mode",{mode:"fractions"});check(node.innerHTML.includes("Pick your math power"),"fraction setup");
click("config",{key:"input",value:"type"});click("start");check(node.innerHTML.includes("fraction-builder"),"touch fraction inputs");
click("hint");check(node.innerHTML.includes("fraction-models"),"fraction visual hint");
click("reveal");check(node.innerHTML.includes("Let’s learn this one together"),"learning explanation");
click("next");click("pause");check(node.innerHTML.includes("Squish break."),"pause screen");
click("resume");check(node.innerHTML.includes("question-card"),"resume screen");
click("pause");click("finish");check(node.innerHTML.includes("answers solved"),"result screen");
click("home");click("mode",{mode:"money"});click("money-guide");check(node.innerHTML.includes("Meet the money"),"money guide");
click("back-help");click("start");click("count",{index:"0"});click("hint");check(node.innerHTML.includes("Counted so far"),"money counting aid");
click("pause");click("finish");click("shelf");check(node.innerHTML.includes("Your squishy shelf"),"shelf view");

let captured=null;
const originalStart=M.startRound;
M.startRound=(...args)=>(captured=originalStart(...args));
for(const mode of ["fractions","times","money"]){
 click("home");click("mode",{mode});click("config",{key:"input",value:"choices"});click("start");
 const count=captured.questions.length;
 for(let i=0;i<count;i++){const q=captured.questions[captured.index];click("answer",{index:String(q.options.findIndex(r=>M.equal(r,q.answer)))});click("next")}
 check(node.innerHTML.includes("answers solved")&&captured.solved===count,"full "+mode+" interface round");
}
click("home");click("mode",{mode:"fractions"});click("config",{key:"input",value:"type"});click("start");
const expected=captured.questions[0].answer;
listeners.input({target:{dataset:{draft:"top"},value:String(expected.n)}});
listeners.input({target:{dataset:{draft:"bottom"},value:String(expected.d)}});
click("hint");
check(node.innerHTML.includes('value="'+expected.n+'"'),"typed draft survives hint render");
listeners.submit({target:{id:"answer-form"},preventDefault(){}});
check(captured.solved===1&&node.innerHTML.includes("Here’s the math magic"),"typed fraction submission");
click("pause");click("finish");
click("home");click("mode",{mode:"times"});click("config",{key:"duration",value:"60"});click("start");
captured.deadline=testNow-1;timers[0]();
check(node.innerHTML.includes("Time’s up, superstar!"),"UI timer expiry screen");
// v2: a reward belongs to one complete, perfect round.
function playScore({count=10,wrongAt=-1,revealAt=-1,timed=false,hints=false}={}){
 const game=M.startRound("fractions",{...c,duration:timed?60:0},1000),profile=M.emptyProgress();
 for(let i=0;i<count;i++){
  const q=game.questions[game.index];
  if(hints)game.hint=true;
  if(i===revealAt)M.revealRound(game);
  else{
   if(i===wrongAt)M.answerRound(game,M.rational(q.answer.n+q.answer.d,q.answer.d),null,1100+i);
   M.answerRound(game,q.answer,null,1200+i);
  }
  const next=M.nextRound(game,1300+i);
  check(next===(i===9?"complete":"next"),"round ends at ten, including timed play");
 }
 const result=M.finishRound(game,profile);
 return {result,profile,game};
}
for(const timed of [false,true]){
 let run=playScore({timed});
 check(run.result.earned===1&&run.profile.squishies.Delilah===1&&run.result.firstTry===10,"perfect single round earns exactly one squishy");
 check(M.finishRound(run.game,run.profile)===null&&run.profile.squishies.Delilah===1,"reward cannot be claimed twice");
 for(const config of [{count:9},{wrongAt:0},{revealAt:0}]){
  run=playScore({...config,timed});
  check(run.result.earned===0&&run.profile.squishies.Delilah===0,"partial, retried, or revealed round does not earn a squishy");
 }
 run=playScore({timed,hints:true});
 check(run.result.earned===1,"hints remain allowed for a perfect round");
}
const cumulative=M.emptyProgress();
for(let round=0;round<2;round++){
 const part=playScore({count:5}).game;part.finished=false;
 M.finishRound(part,cumulative);
}
check(cumulative.stars.Delilah===10&&cumulative.squishies.Delilah===0,"ten correct spread across rounds does not unlock a squishy");
const migrated=M.sanitizeProgress({rounds:{Delilah:3,Esther:2},stars:{Delilah:19,Esther:10}});
check(migrated.squishies.Delilah===3&&migrated.squishies.Esther===2,"existing v1 squishies are preserved");
const current=M.sanitizeProgress({rounds:{Delilah:5},squishies:{Delilah:0}});
check(current.squishies.Delilah===0,"new nonperfect rounds cannot become legacy rewards");
check(M.sanitizeProgress(migrated).squishies.Delilah===3,"migration is stable across reloads");
// Fixed inputs test inverse operations and the exact example from the feedback.
const example=M.fractionQuestion("simple","+","b",{a:M.rational(1,2),b:M.rational(1,4)});
eq(example.result,M.rational(3,4),"example has 3/4 on the right");
eq(example.answer,M.rational(1,4),"example blank is 1/4");
check(!example.hint.includes("1/4"),"missing-number hint does not state the hidden value");
for(const op of ["+","−","×","÷"])for(const blank of ["a","b","result"]){
 const q=M.fractionQuestion("mixed",op,blank,{a:M.rational(5,2),b:M.rational(3,2)});
 eq(q.answer,blank==="a"?M.rational(5,2):blank==="b"?M.rational(3,2):M.calculate(q.a,q.b,op),"all inverse-operation positions");
 check(q.steps.length>=3,"worked inverse explanation supplied");
 choices(q);
}
// Previously generated questions are avoided when another round has enough alternatives.
for(const mode of ["fractions","money"]){
 const config={...c,op:"+"},first=M.makeRound(mode,config),keys=first.map(M.questionKey),second=M.makeRound(mode,config,keys);
 check(second.every(q=>!keys.includes(M.questionKey(q))),"back-to-back rounds avoid the preceding questions");
}
// Even adversarial randomness must not create duplicates or an unbounded retry loop.
seededMath.random=()=>0;
for(const level of ["simple","mixed"])for(const op of ["+","−","×","÷","mix"]){
 const deck=M.makeRound("fractions",{level,op});
 check(new Set(deck.map(M.questionKey)).size===10,"distinct fractions under constant random source");
}
for(const cash of ["coins","bills","mixed"])check(new Set(M.makeRound("money",{cash}).map(M.questionKey)).size===10,"distinct money under constant random source");
seededMath.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
// Timed correct answers advance without an explanation or an extra button tap.
for(const mode of ["fractions","times","money"]){
 click("home");click("mode",{mode});click("config",{key:"duration",value:"60"});click("config",{key:"input",value:"choices"});click("start");
 let oldChoice;
 for(let i=0;i<10;i++){
  testNow+=250;
  const q=captured.questions[captured.index],answerIndex=q.options.findIndex(r=>M.equal(r,q.answer));
  click("answer",{index:String(answerIndex),question:String(i)});
  check(captured.solved===i+1,"timed answer scored");
  if(i<9){
   check(captured.index===i+1&&!captured.done,"timed mode automatically displays next question");
   check(!node.innerHTML.includes('class="explanation"')&&!node.innerHTML.includes('class="primary next-button"'),"no worked-answer stop in timed mode");
   click("answer",{index:String(answerIndex),question:String(i)});
   check(captured.solved===i+1,"stale answer event cannot score next question");
  }
 }
 check(captured.finished&&node.innerHTML.includes("NEW SQUISHY UNLOCKED!"),"timed round ends with a perfect-round reward");
}
// Typed answers advance as well; invalid formatting does not use an attempt.
click("home");click("mode",{mode:"fractions"});click("config",{key:"input",value:"type"});click("start");
const typedQ=captured.questions[0];
listeners.submit({target:{id:"answer-form"},preventDefault(){}});
check(captured.attempted===0&&captured.wrong.length===0,"invalid input is not a math mistake");
listeners.input({target:{dataset:{draft:"top"},value:String(typedQ.answer.n)}});
listeners.input({target:{dataset:{draft:"bottom"},value:String(typedQ.answer.d)}});
listeners.submit({target:{id:"answer-form"},preventDefault(){}});
check(captured.index===1&&captured.solved===1,"typed timed answer automatically advances");
testNow+=250;
captured.questions[captured.index]=example;
click("hint");
const hintHtml=node.innerHTML.slice(node.innerHTML.indexOf('<aside class="hint-panel"'),node.innerHTML.indexOf('</aside>'));
check(hintHtml.includes("Known number = 1/2")&&hintHtml.includes("Result = 3/4")&&!hintHtml.includes("= 1/4"),"missing-number visual shows only known values");
click("pause");const savedIndex=captured.index;testNow+=90000;timers[0]();
check(captured.index===savedIndex&&!captured.finished,"paused timed round cannot advance or expire");
click("resume");check(!captured.paused&&captured.deadline>testNow,"resume starts with saved time");
click("reveal");check(captured.done&&node.innerHTML.includes("Let’s learn this one together"),"explicit worked-help remains readable in timed play");
click("next");check(captured.index===savedIndex+1,"worked-help can continue");
captured.deadline=testNow-1;timers[0]();
check(captured.finished&&!node.innerHTML.includes("NEW SQUISHY UNLOCKED!"),"expired partial round has no reward");

console.log("PASS: "+checks+" math, answer, state, persistence, timer and interface smoke checks. Browser play-testing is separate.");
