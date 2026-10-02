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
function fractionQuestion(level,op){
 let a,b,answer;
 for(let t=0;t<200;t++){
  const da=pick([2,3,4,6,8]),db=Math.random()<.45?da:pick([2,3,4,6,8]);
  const mixed=level==="mixed";
  a=rational(int(1,da-1)+(mixed?int(1,2)*da:0),da);
  b=rational(int(1,db-1)+(mixed?int(1,2)*db:0),db);
  if(op==="−"&&a.n*b.d<b.n*a.d)[a,b]=[b,a];
  answer=calculate(a,b,op);
  if(answer.d<=24&&answer.n/answer.d<=12)break;
 }
 const d=a.d*b.d/gcd(a.d,b.d),an=a.n*(d/a.d),bn=b.n*(d/b.d);
 const convert=level==="mixed"?"Convert the mixed numbers first: "+format(a)+" = "+a.n+"/"+a.d+" and "+format(b)+" = "+b.n+"/"+b.d+". ":"";
 let steps, hint;
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
 return {kind:"fractions",a,b,op,answer,hint,steps,options:options(answer,[rational(answer.n+1,answer.d),rational(answer.n+answer.d,answer.d),rational(Math.abs(answer.n-1),answer.d),rational(a.n+b.n,a.d+b.d),rational(Math.abs(a.n-b.n),d)])};
}
function timesQuestion(table,multiplier){
 const answer=rational(table*multiplier);
 return {kind:"times",a:table,b:multiplier,answer,hint:"Think of "+multiplier+" groups of "+table+". Each row below is one group. Count by "+table+"s to find the total.",steps:[multiplier+" groups of "+table+" means "+Array(multiplier).fill(table).join(" + ")+".","Skip-count: "+Array.from({length:multiplier},(_,i)=>table*(i+1)).join(", ")+".",table+" × "+multiplier+" = "+answer.n+"."],options:options(answer,[rational(answer.n+table),rational(Math.max(0,answer.n-table)),rational(answer.n+1),rational(Math.max(0,answer.n-1))])};
}
function moneyQuestion(level){
 let pieces;
 if(level==="coins")pieces=Array.from({length:int(3,7)},()=>pick([1,5,10,25]));
 else if(level==="bills")pieces=Array.from({length:int(2,5)},()=>pick([100,500,1000,2000]));
 else pieces=[...Array.from({length:int(1,3)},()=>pick([100,500,1000,2000])),...Array.from({length:int(2,5)},()=>pick([1,5,10,25]))];
 pieces.sort((a,b)=>b-a);
 const answer=rational(pieces.reduce((a,b)=>a+b,0));
 return {kind:"money",pieces,answer,hint:"Count the biggest values first. Tap each piece once. With this hint open, the counter will help you add them up.",steps:["100 cents = 1 dollar.",pieces.map(c=>c>=100?money(c):c+"¢").join(" + ")+" = "+money(answer.n)+"."],options:options(answer,[rational(Math.max(0,answer.n-5)),rational(answer.n+10),rational(answer.n+25),rational(Math.max(0,answer.n-25)),rational(answer.n+100)],5)};
}
function makeRound(mode,c){
 if(mode==="times")return shuffle(Array.from({length:10},(_,i)=>i+1)).map(n=>timesQuestion(c.table,n));
 if(mode==="money")return Array.from({length:8},()=>moneyQuestion(c.cash));
 const ops=c.op==="mix"?shuffle(["+","−","×","÷","+","−","×","÷"]):Array(8).fill(c.op);
 return ops.map(op=>fractionQuestion(c.level,op));
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
function bestKey(mode,c){return [mode,mode==="fractions"?c.op+"-"+c.level:mode==="times"?c.table:c.cash,c.duration,c.input].join("|")}
function startRound(mode,config,now=Date.now()){
 const c={...config};
 return {mode,config:c,questions:makeRound(mode,c),index:0,solved:0,attempted:0,helped:0,wrong:[],done:false,hint:false,revealed:false,feedback:"",counted:[],draft:{},deadline:c.duration?now+c.duration*1000:0,remaining:c.duration*1000,paused:false,finished:false,seenFacts:[],scoreKey:bestKey(mode,c)};
}
function expired(g,now=Date.now()){return !g.paused&&g.config.duration>0&&now>=g.deadline}
function answerRound(g,answer,choiceId=null,now=Date.now()){
 if(g.finished||g.paused||g.done)return "ignored";
 if(expired(g,now))return "expired";
 if(!answer)return "invalid";
 if(choiceId!==null&&g.wrong.includes(choiceId))return "ignored";
 const q=g.questions[g.index];
 if(equal(q.answer,answer)){
  g.done=true;g.solved++;g.attempted++;
  if(g.mode==="times"&&!g.seenFacts.includes(q.b))g.seenFacts.push(q.b);
  return "correct";
 }
 g.wrong.push(choiceId===null?"typed-"+g.wrong.length:choiceId);
 return "incorrect";
}
function revealRound(g){if(g.finished||g.paused||g.done)return false;g.done=true;g.revealed=true;g.attempted++;g.helped++;return true}
function nextRound(g,now=Date.now()){
 if(g.finished||g.paused||!g.done)return "ignored";
 if(expired(g,now))return "expired";
 if(g.index===g.questions.length-1){if(!g.config.duration)return "complete";g.questions.push(...makeRound(g.mode,g.config))}
 g.index++;g.wrong=[];g.done=false;g.hint=false;g.revealed=false;g.feedback="";g.counted=[];g.draft={};return "next";
}
function pauseRound(g,now=Date.now()){
 if(g.finished||g.paused)return false;
 if(g.config.duration)g.remaining=Math.max(0,g.deadline-now);
 if(g.config.duration&&!g.remaining)return false;
 g.paused=true;return true;
}
function resumeRound(g,now=Date.now()){if(g.finished||!g.paused)return false;g.paused=false;if(g.config.duration)g.deadline=now+g.remaining;return true}
function emptyProgress(){return {stars:{Delilah:0,Esther:0},rounds:{Delilah:0,Esther:0},best:{},tables:{}}}
function sanitizeProgress(input){
 const p=emptyProgress(),s=input&&typeof input==="object"?input:{};
 const num=n=>Number.isFinite(Number(n))?Math.min(1000000,Math.max(0,Math.floor(Number(n)))):0;
 for(const name of ["Delilah","Esther"]){p.stars[name]=num(s.stars?.[name]);p.rounds[name]=num(s.rounds?.[name])}
 for(const k of Object.keys(s.best||{}))if(/^(fractions|money|times)\|[^|]{1,24}\|(60|120)\|(choices|type)$/.test(k))p.best[k]=num(s.best[k]);
 for(let n=1;n<=10;n++)p.tables[n]=Math.min(10,num(s.tables?.[n]));
 return p;
}
function finishRound(g,progress){
 if(g.finished)return null;
 g.finished=true;
 const owner=g.mode==="fractions"?"Delilah":"Esther",oldBest=progress.best[g.scoreKey]||0;
 progress.stars[owner]+=g.solved;
 if(g.solved>0)progress.rounds[owner]++;
 if(g.config.duration)progress.best[g.scoreKey]=Math.max(oldBest,g.solved);
 if(g.mode==="times")progress.tables[g.config.table]=Math.max(progress.tables[g.config.table]||0,g.seenFacts.length);
 return {owner,solved:g.solved,attempted:g.attempted,helped:g.helped,rounds:progress.rounds[owner],timed:!!g.config.duration,best:progress.best[g.scoreKey]||0,newBest:!!g.config.duration&&g.solved>oldBest};
}
root.SquishMath={gcd,rational,equal,int,pick,shuffle,format,spoken,money,calculate,CASH,fractionQuestion,timesQuestion,moneyQuestion,makeRound,parseAnswer,parseFields,bestKey,startRound,expired,answerRound,revealRound,nextRound,pauseRound,resumeRound,emptyProgress,sanitizeProgress,finishRound};
})(typeof globalThis!=="undefined"?globalThis:window);
