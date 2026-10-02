/* Squish & Spice — exact math and round logic. No dependencies. */
(function(root){
"use strict";
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function rational(n,d=1){
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw new Error("Invalid fraction");
 if(d<0){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g};
}
const equal=(a,b)=>!!a&&!!b&&a.n*b.d===b.n*a.d;
const key=r=>r.n+"/"+r.d;
const int=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[int(0,a.length-1)];
function shuffle(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=int(0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function format(r){const w=Math.floor(r.n/r.d),n=r.n%r.d;return n?(w?w+" ":"")+n+"/"+r.d:String(w)}
function spoken(r){const w=Math.floor(r.n/r.d),n=r.n%r.d;return n?(w?w+" and ":"")+n+" over "+r.d:String(w)}
const money=c=>"$"+(c/100).toFixed(2);
function calculate(a,b,op){
 if(op==="+")return rational(a.n*b.d+b.n*a.d,a.d*b.d);
 if(op==="−")return rational(a.n*b.d-b.n*a.d,a.d*b.d);
 if(op==="×")return rational(a.n*b.n,a.d*b.d);
 if(op==="÷")return rational(a.n*b.d,a.d*b.n);
 throw new Error("Unknown operation");
}
function options(answer,candidates,unit=1){
 const found=new Map;
 for(const r of candidates)if(r.n>=0&&!equal(r,answer))found.set(key(r),r);
 for(let i=1;found.size<3;i++){const r=rational(answer.n+i*unit,answer.d);if(!equal(r,answer))found.set(key(r),r)}
 return shuffle([answer,...shuffle([...found.values()]).slice(0,3)]);
}
const CASH=[
 {value:1,name:"Penny",detail:"Lincoln · copper",type:"coin"},
 {value:5,name:"Nickel",detail:"Jefferson · silver",type:"coin"},
 {value:10,name:"Dime",detail:"Roosevelt · silver",type:"coin"},
 {value:25,name:"Quarter",detail:"Washington · silver",type:"coin"},
 {value:100,name:"$1 bill",detail:"Washington",type:"bill"},
 {value:500,name:"$5 bill",detail:"Lincoln",type:"bill"},
 {value:1000,name:"$10 bill",detail:"Hamilton",type:"bill"},
 {value:2000,name:"$20 bill",detail:"Jackson",type:"bill"}
];
const fractionBanks=new Map(),moneyBanks=new Map();
function fractionSignature(a,b,op){
 const parts=[key(a),key(b)];
 if(op==="+"||op==="×")parts.sort();
 return "fractions|"+op+"|"+parts.join("|");
}
function fractionTemplates(level,op){
 const cacheKey=level+"|"+op;
 if(fractionBanks.has(cacheKey))return fractionBanks.get(cacheKey);
 const numbers=new Map;
 for(const d of [2,3,4,6,8])for(let n=1;n<d;n++)for(const whole of (level==="mixed"?[1,2]:[0])){
  const r=rational(whole*d+n,d);numbers.set(key(r),r);
 }
 const bank=new Map;
 for(const a of numbers.values())for(const b of numbers.values()){
  if(op==="−"&&a.n*b.d<b.n*a.d)continue;
  const result=calculate(a,b,op);
  if(result.d>24||result.n/result.d>12)continue;
  const signature=fractionSignature(a,b,op);
  if(!bank.has(signature))bank.set(signature,{a,b,signature});
 }
 const result=[...bank.values()];fractionBanks.set(cacheKey,result);return result;
}
function fractionWork(a,b,op){
 const answer=calculate(a,b,op),d=a.d*b.d/gcd(a.d,b.d),an=a.n*(d/a.d),bn=b.n*(d/b.d);
 const convert=(a.n>a.d||b.n>b.d)?"Use fractions first: "+format(a)+" = "+a.n+"/"+a.d+" and "+format(b)+" = "+b.n+"/"+b.d+". ":"";
 let steps,hint;
 if(op==="+"||op==="−"){
  hint=convert+"The pieces need the same size. A common denominator is "+d+". What do you multiply each denominator by to make "+d+"?";
  steps=[...(convert?[convert]:[]),"Make equal-sized pieces: "+a.n+"/"+a.d+" = "+an+"/"+d+" and "+b.n+"/"+b.d+" = "+bn+"/"+d+".",(op==="+"?"Add":"Subtract")+" the top numbers; keep the denominator: ("+an+" "+op+" "+bn+")/"+d+".","Simplify the result: "+format(answer)+"."];
 }else if(op==="×"){
  hint=convert+"Multiply top × top and bottom × bottom. Simplify afterward.";
  steps=[...(convert?[convert]:[]),"Multiply the top numbers: "+a.n+" × "+b.n+" = "+a.n*b.n+".","Multiply the bottom numbers: "+a.d+" × "+b.d+" = "+a.d*b.d+".","Simplify "+a.n*b.n+"/"+(a.d*b.d)+" to "+format(answer)+"."];
 }else{
  hint=convert+"Keep the first fraction. Change ÷ to ×. Flip the second fraction, then multiply.";
  steps=[...(convert?[convert]:[]),"Flip the second fraction: "+b.n+"/"+b.d+" becomes "+b.d+"/"+b.n+".","Multiply: "+a.n+"/"+a.d+" × "+b.d+"/"+b.n+" = "+(a.n*b.d)+"/"+(a.d*b.n)+".","Simplify the result: "+format(answer)+"."];
 }
 return {hint,steps};
}
function fractionQuestion(level,op,blank="result",template=null){
 const {a,b}=template||pick(fractionTemplates(level,op)),result=calculate(a,b,op);
 const answer=blank==="a"?a:blank==="b"?b:result;
 let {hint,steps}=fractionWork(a,b,op);
 if(blank!=="result"){
  let x,y,inverse;
  if(op==="+"){x=result;y=blank==="a"?b:a;inverse="−"}
  else if(op==="−"){x=blank==="a"?result:a;y=blank==="a"?b:result;inverse=blank==="a"?"+":"−"}
  else if(op==="×"){x=result;y=blank==="a"?b:a;inverse="÷"}
  else{x=blank==="a"?result:a;y=blank==="a"?b:result;inverse=blank==="a"?"×":"÷"}
  const operationNames={"+":"addition","−":"subtraction","×":"multiplication","÷":"division"};
  hint="Work backward using "+operationNames[inverse]+". Find the missing number by working out "+format(x)+" "+inverse+" "+format(y)+".";
  steps=["Find the missing number: "+format(x)+" "+inverse+" "+format(y)+".",...fractionWork(x,y,inverse).steps,"Check it: "+format(a)+" "+op+" "+format(b)+" = "+format(result)+"."];
 }
 return {kind:"fractions",a,b,op,result,blank,answer,signature:fractionSignature(a,b,op),hint,steps,options:options(answer,[rational(answer.n+1,answer.d),rational(answer.n+answer.d,answer.d),rational(Math.abs(answer.n-1),answer.d),rational(a.n+b.n,a.d+b.d)])};
}
function timesQuestion(table,multiplier){
 const answer=rational(table*multiplier);
 return {kind:"times",a:table,b:multiplier,signature:"times|"+table+"|"+multiplier,answer,hint:"Think of "+multiplier+" groups of "+table+". Each row below is one group. Count by "+table+"s to find the total.",steps:[multiplier+" groups of "+table+" means "+Array(multiplier).fill(table).join(" + ")+".","Skip-count: "+Array.from({length:multiplier},(_,i)=>table*(i+1)).join(", ")+".",table+" × "+multiplier+" = "+answer.n+"."],options:options(answer,[rational(answer.n+table),rational(Math.max(0,answer.n-table)),rational(answer.n+1),rational(Math.max(0,answer.n-1))])};
}
function moneyTemplates(level){
 if(moneyBanks.has(level))return moneyBanks.get(level);
 function combinations(values,min,max){
  const out=[];
  function add(parts,start){
   if(parts.length>=min)out.push([...parts].sort((a,b)=>b-a));
   if(parts.length===max)return;
   for(let i=start;i<values.length;i++){parts.push(values[i]);add(parts,i);parts.pop()}
  }
  add([],0);return out;
 }
 const coins=[1,5,10,25],bills=[100,500,1000,2000];
 let bank;
 if(level==="coins")bank=combinations(coins,3,7);
 else if(level==="bills")bank=combinations(bills,2,5);
 else{const cs=combinations(coins,2,5);bank=combinations(bills,1,3).flatMap(bs=>cs.map(c=>[...bs,...c]))}
 moneyBanks.set(level,bank);return bank;
}
function moneyQuestion(level,template=null){
 const pieces=[...(template||pick(moneyTemplates(level)))],answer=rational(pieces.reduce((a,b)=>a+b,0));
 return {kind:"money",pieces,signature:"money|"+pieces.join(","),answer,hint:"Count the biggest values first. Tap each piece once. With this hint open, the counter will help you add them up.",steps:["100 cents = 1 dollar.",pieces.map(c=>c>=100?money(c):c+"¢").join(" + ")+" = "+money(answer.n)+"."],options:options(answer,[rational(Math.max(0,answer.n-5)),rational(answer.n+10),rational(answer.n+25),rational(Math.max(0,answer.n-25)),rational(answer.n+100)],5)};
}
function questionKey(q){return q.signature}
function makeRound(mode,c,previous=[]){
 const prior=new Set(previous),current=new Set;
 if(mode==="times"){
  const deck=shuffle(Array.from({length:10},(_,i)=>i+1)).map(n=>timesQuestion(c.table,n));
  if(previous.length&&questionKey(deck[0])===previous[previous.length-1])[deck[0],deck[9]]=[deck[9],deck[0]];
  return deck;
 }
 function take(bank,signature){
  let available=bank.filter(x=>!current.has(signature(x))&&!prior.has(signature(x)));
  // Avoid the previous round when possible; every new round remains distinct even if that exhausts a finite bank.
  if(!available.length)available=bank.filter(x=>!current.has(signature(x)));
  if(!available.length)throw new Error("Not enough distinct questions");
  const item=pick(available);current.add(signature(item));return item;
 }
 if(mode==="money")return Array.from({length:10},()=>moneyQuestion(c.cash,take(moneyTemplates(c.cash),x=>"money|"+x.join(","))));
 const allOps=["+","−","×","÷"];
 const ops=c.op==="mix"?shuffle([...allOps,...allOps,...shuffle(allOps).slice(0,2)]):Array(10).fill(c.op);
 const blanks=shuffle(["result","result","result","result","result","result","a","a","b","b"]);
 return ops.map((op,i)=>fractionQuestion(c.level,op,blanks[i],take(fractionTemplates(c.level,op),t=>t.signature)));
}
function parseAnswer(raw,mode){
 const s=String(raw).trim();
 if(mode==="money"){const m=s.match(/^\$?(\d{1,5})(?:\.(\d{1,2}))?$/);return m?rational(Number(m[1])*100+Number((m[2]||"").padEnd(2,"0"))):null}
 if(mode==="times")return /^\d{1,5}$/.test(s)?rational(Number(s)):null;
 const m=s.match(/^(?:(\d{1,3})\s+)?(\d{1,4})\/(\d{1,3})$/);
 if(m){const d=Number(m[3]);return d?rational(Number(m[1]||0)*d+Number(m[2]),d):null}
 return /^\d{1,4}$/.test(s)?rational(Number(s)):null;
}
function parseFields(draft){
 const w=String(draft.whole||"").trim(),n=String(draft.top||"").trim(),d=String(draft.bottom||"").trim();
 if(!w&&!n&&!d)return null;
 if(!n&&!d)return parseAnswer(w,"fractions");
 if((w&&!/^\d{1,3}$/.test(w))||!/^\d{1,4}$/.test(n)||!/^\d{1,3}$/.test(d)||Number(d)===0)return null;
 return rational(Number(w||0)*Number(d)+Number(n),Number(d));
}
function bestKey(mode,c){return [mode,mode==="fractions"?c.op+"-"+c.level:mode==="times"?c.table:c.cash,c.duration,c.input,"round10"].join("|")}
function startRound(mode,config,now=Date.now(),previous=[]){
 const c={...config};
 return {mode,config:c,questions:makeRound(mode,c,previous),index:0,solved:0,attempted:0,firstTry:0,helped:0,wrong:[],done:false,hint:false,revealed:false,feedback:"",counted:[],draft:{},deadline:c.duration?now+c.duration*1000:0,remaining:c.duration*1000,paused:false,finished:false,seenFacts:[],scoreKey:bestKey(mode,c)};
}
function expired(g,now=Date.now()){return !g.paused&&g.config.duration>0&&now>=g.deadline}
function answerRound(g,answer,choiceId=null,now=Date.now()){
 if(g.finished||g.paused||g.done)return "ignored";
 if(expired(g,now))return "expired";
 if(!answer)return "invalid";
 if(choiceId!==null&&g.wrong.includes(choiceId))return "ignored";
 const q=g.questions[g.index];
 if(equal(q.answer,answer)){
  g.done=true;g.solved++;completeQuestion(g,g.wrong.length===0);
  if(g.mode==="times"&&!g.seenFacts.includes(q.b))g.seenFacts.push(q.b);
  return "correct";
 }
 g.wrong.push(choiceId===null?"typed-"+g.wrong.length:choiceId);
 return "incorrect";
}
function completeQuestion(g,firstTry){
 g.attempted++;
 if(firstTry)g.firstTry++;
}
function revealRound(g){if(g.finished||g.paused||g.done)return false;g.done=true;g.revealed=true;completeQuestion(g,false);g.helped++;return true}
function nextRound(g,now=Date.now()){
 if(g.finished||g.paused||!g.done)return "ignored";
 if(expired(g,now))return "expired";
 if(g.index===g.questions.length-1)return "complete";
 g.index++;g.wrong=[];g.done=false;g.hint=false;g.revealed=false;g.feedback="";g.feedbackKind="";g.counted=[];g.draft={};return "next";
}
function pauseRound(g,now=Date.now()){
 if(g.finished||g.paused)return false;
 if(g.config.duration)g.remaining=Math.max(0,g.deadline-now);
 if(g.config.duration&&!g.remaining)return false;
 g.paused=true;return true;
}
function resumeRound(g,now=Date.now()){if(g.finished||!g.paused)return false;g.paused=false;if(g.config.duration)g.deadline=now+g.remaining;return true}
function emptyProgress(){return {stars:{Delilah:0,Esther:0},rounds:{Delilah:0,Esther:0},squishies:{Delilah:0,Esther:0},best:{},tables:{}}}
function sanitizeProgress(input){
 const p=emptyProgress(),s=input&&typeof input==="object"?input:{};
 const num=n=>Number.isFinite(Number(n))?Math.min(1000000,Math.max(0,Math.floor(Number(n)))):0;
 for(const name of ["Delilah","Esther"]){p.stars[name]=num(s.stars?.[name]);p.rounds[name]=num(s.rounds?.[name]);p.squishies[name]=num(s.squishies?.[name]??s.rounds?.[name])}
 for(const k of Object.keys(s.best||{}))if(/^(fractions|money|times)\|[^|]{1,24}\|(60|120)\|(choices|type)(\|round10)?$/.test(k))p.best[k]=num(s.best[k]);
 for(let n=1;n<=10;n++)p.tables[n]=Math.min(10,num(s.tables?.[n]));
 return p;
}
function finishRound(g,progress){
 if(g.finished)return null;
 g.finished=true;
 const owner=g.mode==="fractions"?"Delilah":"Esther",oldBest=progress.best[g.scoreKey]||0;
 progress.stars[owner]+=g.solved;
 if(g.attempted>0)progress.rounds[owner]++;
 const earned=g.attempted===10&&g.firstTry===10?1:0;
 progress.squishies[owner]+=earned;
 if(g.config.duration)progress.best[g.scoreKey]=Math.max(oldBest,g.solved);
 if(g.mode==="times")progress.tables[g.config.table]=Math.max(progress.tables[g.config.table]||0,g.seenFacts.length);
 return {owner,solved:g.solved,attempted:g.attempted,firstTry:g.firstTry,earned,squishies:progress.squishies[owner],helped:g.helped,rounds:progress.rounds[owner],timed:!!g.config.duration,best:progress.best[g.scoreKey]||0,newBest:!!g.config.duration&&g.solved>oldBest};
}
root.SquishMath={gcd,rational,equal,int,pick,shuffle,format,spoken,money,calculate,CASH,fractionQuestion,timesQuestion,moneyQuestion,questionKey,makeRound,parseAnswer,parseFields,bestKey,startRound,expired,answerRound,revealRound,nextRound,pauseRound,resumeRound,emptyProgress,sanitizeProgress,finishRound};
})(typeof globalThis!=="undefined"?globalThis:window);
