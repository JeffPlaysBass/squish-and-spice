/* Run with node tests/checks.cjs. No install required. */
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"math.js"),"utf8");
const ui=fs.readFileSync(path.join(root,"app.js"),"utf8");
const context=vm.createContext({});
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
 if(op==="mix")for(const o of ["+","−","×","÷"])check(qs.filter(q=>q.op===o).length===2,"balanced mixed operation round");
 for(const q of qs){
  const a=q.a.n/q.a.d,b=q.b.n/q.b.d,want=q.op==="+"?a+b:q.op==="−"?a-b:q.op==="×"?a*b:a/b;
  check(Math.abs(q.answer.n/q.answer.d-want)<1e-10,"fraction arithmetic");
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
for(const cash of ["coins","bills","mixed"])for(let trial=0;trial<50;trial++)for(const q of M.makeRound("money",{cash})){
 check(q.answer.n===q.pieces.reduce((s,n)=>s+n,0),"exact cents total");
 check(q.pieces.every(v=>M.CASH.some(c=>c.value===v)),"recognized US denominations");
 if(cash==="coins")check(q.pieces.every(v=>v<100),"coins only");
 if(cash==="bills")check(q.pieces.every(v=>v>=100),"bills only");
 if(cash==="mixed")check(q.pieces.some(v=>v<100)&&q.pieces.some(v=>v>=100),"coins plus bills");
 eq(M.parseAnswer(M.money(q.answer.n),"money"),q.answer,"dollar parsing");
 choices(q);
}
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
const uiContext=vm.createContext({window:win,document,localStorage,setInterval:fn=>timers.push(fn),console});
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
captured.deadline=Date.now()-1;timers[0]();
check(node.innerHTML.includes("Time’s up, superstar!"),"UI timer expiry screen");
g=M.startRound("fractions",{...c,duration:60},1000);
for(let i=0;i<8;i++){M.answerRound(g,g.questions[g.index].answer,null,1001+i);check(M.nextRound(g,1002+i)==="next","timed round continues beyond a full deck")}
check(g.questions.length===16&&g.index===8,"timed deck extension");

console.log("PASS: "+checks+" math, answer, state, persistence, timer and interface smoke checks. Browser play-testing is separate.");
