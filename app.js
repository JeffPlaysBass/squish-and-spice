/* Squish & Spice — touch-first game interface. */
(function(){
"use strict";
const M=window.SquishMath;
if(!M)throw new Error("The math engine did not load.");
const app=document.getElementById("app");
const STORAGE_KEY="squish-and-spice-v1";
const MONEY_STYLE_KEY="squish-and-spice-money-style";
const MONEY_ART={1:"penny.svg",5:"nickel.svg",10:"dime.svg",25:"quarter.svg",100:"one-dollar.svg",500:"five-dollars.svg",1000:"ten-dollars.svg",2000:"twenty-dollars.svg"};
let savedMoneyStyle="tokens";
try{if(localStorage.getItem(MONEY_STYLE_KEY)==="drawings")savedMoneyStyle="drawings"}catch{}
const BUDDIES=[
 {name:"Lime Wiggle",color:"#b9ef4c",accent:"#7cbe31",accessory:"🍋"},
 {name:"Berry Bounce",color:"#fb89c6",accent:"#df4294",accessory:"🍓"},
 {name:"Chili Chomp",color:"#ff976f",accent:"#ed614c",accessory:"🌶️"},
 {name:"Unicorn Puff",color:"#c3a0ff",accent:"#9060d6",accessory:"🦄"},
 {name:"Bubble Blue",color:"#81dcf8",accent:"#34accd",accessory:"🫧"},
 {name:"Peach Squeeze",color:"#ffc88f",accent:"#f69e59",accessory:"🍑"},
 {name:"Jelly Hopper",color:"#82e6ac",accent:"#3abf7b",accessory:"🐸"},
 {name:"Mochi Moon",color:"#bfc4ff",accent:"#828add",accessory:"🌙"},
 {name:"Rainbow Pop",color:"#ffafdf",accent:"#dc72bc",accessory:"🌈"},
 {name:"Cookie Cloud",color:"#f2d09b",accent:"#cf9e59",accessory:"🍪"},
 {name:"Guac Rock",color:"#c6e979",accent:"#8db643",accessory:"🥑"},
 {name:"Super Squish",color:"#ffe37b",accent:"#e7b73a",accessory:"⭐"}
];
const MODES={
 fractions:{title:"Fraction Fiesta",owner:"Delilah",icon:"🌶️",color:"pink",description:"A spicy little challenge with fractions & mixed numbers.",label:"ADD · SUBTRACT · MULTIPLY · DIVIDE"},
 times:{title:"Times Table Pop",owner:"Esther",icon:"✳",color:"violet",description:"Pick a table or mix them all. Pop your way to 10!",label:"1s THROUGH 10s · ALL TABLES MIX"},
 money:{title:"Snack Shop",owner:"Esther",icon:"🪙",color:"lime",description:"Count your coins and bills for a pretend snack run.",label:"AMERICAN COINS & BILLS"}
};
let storageOK=true,progress=M.emptyProgress();
try{progress=M.sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"))}catch{storageOK=false}
const state={screen:"home",mode:"fractions",config:{op:"+",level:"simple",table:1,cash:"coins",duration:0,input:"choices"},game:null,result:null,sound:false,moneyStyle:savedMoneyStyle,shelfOwner:"Delilah",helpFrom:"home"};
let audio;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const btn=(html,action,attrs="",cls="")=>'<button type="button" class="'+cls+'" data-action="'+action+'" '+attrs+'>'+html+'</button>';
const activeOwner=()=>MODES[state.mode].owner;
const fraction=r=>{const w=Math.floor(r.n/r.d),n=r.n%r.d;return '<span class="math-number" aria-label="'+M.spoken(r)+'">'+(n?(w?'<span aria-hidden="true">'+w+'</span>':"")+'<span class="fraction" aria-hidden="true"><span>'+n+'</span><span>'+r.d+'</span></span>':'<span aria-hidden="true">'+w+'</span>')+'</span>'};
const answerLabel=r=>state.mode==="fractions"?fraction(r):state.mode==="money"?M.money(r.n):r.n;
const answerSpeech=r=>state.mode==="money"?M.money(r.n):M.spoken(r);
const qNow=()=>state.game.questions[state.game.index];
function mascot(b,index=0){
 const grad="g"+index;
 return '<svg viewBox="0 0 200 180" class="mascot" aria-hidden="true"><defs><radialGradient id="'+grad+'" cx=".32" cy=".22" r=".85"><stop stop-color="#fff" stop-opacity=".65"/><stop offset=".3" stop-color="'+b.color+'"/><stop offset="1" stop-color="'+b.accent+'"/></radialGradient></defs><ellipse cx="100" cy="164" rx="65" ry="9" fill="#25204b" opacity=".13"/><path d="M33 98C24 66 37 33 67 25C92 6 125 17 145 36C175 40 186 67 174 96C189 121 173 153 143 157C114 171 98 157 79 163C44 165 16 141 28 115Z" fill="url(#'+grad+')" stroke="#272044" stroke-width="3"/><path d="M52 62Q59 38 85 37" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity=".5"/><ellipse cx="74" cy="96" rx="6" ry="9" fill="#272044"/><ellipse cx="129" cy="96" rx="6" ry="9" fill="#272044"/><circle cx="72" cy="93" r="2" fill="white"/><circle cx="127" cy="93" r="2" fill="white"/><path d="M90 111Q102 125 114 111" fill="none" stroke="#272044" stroke-width="5" stroke-linecap="round"/><ellipse cx="57" cy="112" rx="10" ry="5" fill="#f26da7" opacity=".55"/><ellipse cx="148" cy="112" rx="10" ry="5" fill="#f26da7" opacity=".55"/></svg><span class="buddy-accessory" aria-hidden="true">'+b.accessory+'</span>';
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));storageOK=true}catch{storageOK=false}}
function sound(kind="happy"){
 if(!state.sound)return;
 try{
  audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});
  const now=audio.currentTime,notes=kind==="squish"?[320,440]:[523,659,784];
  notes.forEach((freq,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type="sine";o.frequency.setValueAtTime(freq,now+i*.09);g.gain.setValueAtTime(.0001,now+i*.09);g.gain.exponentialRampToValueAtTime(.055,now+i*.09+.015);g.gain.exponentialRampToValueAtTime(.0001,now+i*.09+.2);o.connect(g);g.connect(audio.destination);o.start(now+i*.09);o.stop(now+i*.09+.22)});
 }catch{}
}
function choices(items,key){
 return '<div class="choices">'+items.map(([v,t])=>btn(t,"config",'data-key="'+key+'" data-value="'+v+'" aria-pressed="'+(String(state.config[key])===String(v))+'"',"choice "+(String(state.config[key])===String(v)?"selected":""))).join("")+'</div>';
}
function moneyStylePicker(compact=false){
 const styles=[["tokens","Learning tokens","Big, clear values"],["drawings","Money drawings","Familiar faces & designs"]];
 return '<div class="money-style-options '+(compact?"compact":"with-previews")+'" role="group" aria-label="Money appearance">'+styles.map(([id,title,detail])=>{
  const preview=id==="tokens"?'<span class="preview-token-coin">25¢</span><span class="preview-token-bill">$5</span>':'<img class="preview-drawn-coin" src="./assets/money/quarter.svg" alt="" width="66" height="67" draggable="false"><img class="preview-drawn-bill" src="./assets/money/five-dollars.svg" alt="" width="132" height="57" draggable="false">';
  return btn((compact?"":'<span class="money-style-preview" aria-hidden="true">'+preview+'</span>')+'<strong>'+title+'</strong>'+(compact?"":'<span class="money-style-description">'+detail+'</span>'),"money-style",'data-style="'+id+'" aria-pressed="'+(state.moneyStyle===id)+'"',"money-style-choice "+(state.moneyStyle===id?"selected":""));
 }).join("")+'</div>';
}
function home(){
 return '<section class="welcome"><div class="welcome-copy"><div class="eyebrow"><span class="little-star">✦</span> DELILAH & ESTHER’S MATH CLUB</div><h1>Small math.<br><span>BIG squish.</span></h1><p>Pick an adventure. Grow your brain.<br>Meet your next squishy sidekick.</p><div class="welcome-notes"><span>✦ No timer? No problem.</span><span>✦ Hints always welcome.</span></div></div><div class="welcome-buddy">'+btn(mascot(BUDDIES[0],99),"squish",'aria-label="Give Lime Wiggle a squish"',"squish-button hero-squish")+'<div class="speech-bubble" id="squish-message">Psst. Tap me!</div><span class="sparkle one" aria-hidden="true">✳</span><span class="sparkle two" aria-hidden="true">✦</span></div></section><section aria-labelledby="adventure-title"><div class="section-heading"><h2 id="adventure-title">Choose your adventure</h2><span class="tiny-note">Three ways to play</span></div><div class="mode-grid">'+Object.entries(MODES).map(([id,m])=>'<article class="mode-card '+m.color+'"><div class="card-top"><span class="zone">'+m.owner+'’s zone</span><span class="card-icon" aria-hidden="true">'+m.icon+'</span></div><div class="mode-label">'+m.label+'</div><h3>'+m.title+'</h3><p>'+m.description+'</p>'+btn('Let’s play <span aria-hidden="true">✦</span>',"mode",'data-mode="'+id+'"',"primary play-button")+'</article>').join("")+'</div></section><section class="shelf-banner"><div class="shelf-preview" aria-hidden="true">🍋 🌶️ 🦄</div><div><h2>A whole crew to collect</h2><p>Get all 10 right on your first try to meet a new squishy.</p></div>'+btn("Visit your squishy shelf","shelf","","secondary")+'</section><p class="save-note">Your progress stays in this browser on this device. No accounts. No ads.</p>';
}
function setup(){
 const m=MODES[state.mode],c=state.config;
 let settings="";
 if(state.mode==="fractions")settings='<fieldset><legend><span>1</span> Pick your math power</legend>'+choices([["+","＋ Add"],["−","− Subtract"],["×","× Multiply"],["÷","÷ Divide"],["mix","🌶️ Mix all four"]],"op")+'</fieldset><fieldset><legend><span>2</span> Choose your ingredients</legend>'+choices([["simple","Simple fractions"],["mixed","Mixed numbers"]],"level")+'<p class="tip">'+(c.level==="simple"?"Start with fractions like ½ and ¾, including puzzles like ½ + ? = ¾.":"Practice numbers like 1½ and 2⅓, with the missing number on either side of the equals sign.")+'</p></fieldset>';
 if(state.mode==="times")settings='<fieldset><legend><span>1</span> Pick a table or mix them all!</legend><div class="table-choices">'+btn('<strong><span aria-hidden="true">✦</span> All tables</strong><small>Random mix of 1s–10s · '+(progress.tables.mix||0)+'/10 best</small>',"config",'data-key="table" data-value="mix" aria-pressed="'+(c.table==="mix")+'"',"table-choice table-mix "+(c.table==="mix"?"selected":""))+Array.from({length:10},(_,i)=>{const n=i+1;return btn('<strong>'+n+'s</strong><small>'+((progress.tables[n]||0)===10?"★ All 10 solved":(progress.tables[n]||0)+"/10 best")+'</small>',"config",'data-key="table" data-value="'+n+'" aria-pressed="'+(c.table===n)+'"',"table-choice "+(c.table===n?"selected":""))}).join("")+'</div><p class="tip">'+(c.table==="mix"?"Ten different facts: one from each table, in a random order. Both numbers stay between 1 and 10.":"A round covers ×1 to ×10 in a fresh order.")+' In timed play, finish all ten before the clock runs out!</p></fieldset>';
 if(state.mode==="money")settings='<fieldset><legend><span>1</span> What’s in your pocket?</legend>'+choices([["coins","🪙 Coins"],["bills","💵 Bills"],["mixed","🛍️ Coins + bills"]],"cash")+'<p class="tip">Pennies, nickels, dimes, quarters, and $1, $5, $10 and $20 bills.</p></fieldset><fieldset><legend><span>2</span> Choose your money look</legend>'+moneyStylePicker()+'<p class="tip">Both styles use the same values. You can switch while you play.</p>'+btn("Meet the money","money-guide","","text-button")+'</fieldset>';
 return '<section class="paper setup"><div class="eyebrow">'+m.owner.toUpperCase()+'’S ZONE</div><h1 class="page-title"><span aria-hidden="true">'+m.icon+'</span> '+m.title+'</h1>'+settings+'<fieldset><legend><span>⚡</span> Find your pace</legend>'+choices([[0,"☁ No timer"],[60,"60-second dash"],[120,"2-minute dash"]],"duration")+'<p class="tip">'+(c.duration?"Beat the clock across 10 questions. Correct answers jump straight to the next question.":"Take your time: 10 different questions, with room to learn.")+'</p><p class="tip reward-rule">🧸 A perfect 10 means every answer right on the first try. Hints are welcome!</p></fieldset><fieldset><legend><span>✎</span> How will you answer?</legend>'+choices([["choices","Tap a choice"],["type","Build / type it"]],"input")+'</fieldset><div class="setup-bottom"><div class="best-pill">'+(c.duration?"🏆 Your best: "+(progress.best[M.bestKey(state.mode,c)]||0)+" solved":"⭐ Every solved answer earns a star")+'</div>'+btn("Let’s do this!","start","","primary")+'</div></section>';
}
function fractionBars(r,label){
 const count=Math.ceil(r.n/r.d)||1;
 return '<div class="fraction-model"><strong>'+label+' = '+M.format(r)+'</strong><div class="fraction-bars">'+Array.from({length:count},(_,i)=>'<div class="fraction-bar" style="grid-template-columns:repeat('+r.d+',1fr)" aria-hidden="true">'+Array.from({length:r.d},(_,j)=>'<i class="'+(i*r.d+j<r.n?"filled":"")+'"></i>').join("")+'</div>').join("")+'</div></div>';
}
function hintPanel(q){
 let visual="";
 if(state.mode==="times")visual='<div class="dot-model"><div class="dot-grid" style="grid-template-columns:repeat('+q.a+', 14px)" aria-label="'+q.b+' rows of '+q.a+' dots">'+Array.from({length:q.a*q.b},()=>'<i aria-hidden="true"></i>').join("")+'</div><span>'+q.b+' groups of '+q.a+'</span></div>';
 if(state.mode==="fractions")visual='<div class="fraction-models">'+(q.blank==="a"?fractionBars(q.b,"Known number")+fractionBars(q.result,"Result"):q.blank==="b"?fractionBars(q.a,"Known number")+fractionBars(q.result,"Result"):fractionBars(q.a,"First number")+fractionBars(q.b,"Second number"))+'</div><p class="tip">Each bar is one whole. Shaded pieces show the known numbers.</p>';
 if(state.mode==="money")visual='<p class="count-along" aria-live="polite">Counted so far <strong>'+M.money(state.game.counted.reduce((s,i)=>s+q.pieces[i],0))+'</strong></p>';
 return '<aside class="hint-panel" id="hint-panel"><h2>💡 Let’s break it down</h2><p>'+esc(q.hint)+'</p>'+visual+'</aside>';
}
function cashToken(v,i,interactive=true){
 const c=M.CASH.find(x=>x.value===v),counted=interactive&&state.game.counted.includes(i);
 if(state.moneyStyle==="drawings"){
  const image='<img class="money-art" src="./assets/money/'+MONEY_ART[v]+'" alt="" width="'+(c.type==="coin"?240:426)+'" height="'+(c.type==="coin"?244:184)+'" draggable="false">';
  const caption='<span class="money-drawing-label"><strong>'+c.name+'</strong><span>'+(c.type==="coin"?v+"¢":c.detail)+'</span></span>';
  const html='<span class="money-drawing-picture">'+image+'</span>'+caption+(counted?'<span class="count-check" aria-hidden="true">✓</span>':"");
  const cls="money-drawing money-drawing-"+c.type+" money-value-"+v+(counted?" counted":"");
  return interactive?btn(html,"count",'data-index="'+i+'" aria-pressed="'+counted+'" aria-label="'+c.name+', '+(v>=100?M.money(v):v+" cents")+'"',cls):'<div class="'+cls+'">'+html+'</div>';
 }
 const html='<span class="cash-value">'+(v>=100?"$"+v/100:v+"¢")+'</span><span class="cash-name">'+c.name+'</span><span class="cash-detail">'+c.detail+'</span>'+(counted?'<span class="count-check" aria-hidden="true">✓</span>':"");
 const cls="cash-token "+(c.type==="bill"?"bill":"coin coin-"+v)+(counted?" counted":"");
 return interactive?btn(html,"count",'data-index="'+i+'" aria-pressed="'+counted+'" aria-label="'+c.name+', '+(v>=100?M.money(v):v+" cents")+'"',cls):'<div class="'+cls+'">'+html+'</div>';
}
function question(q){
 if(state.mode==="money")return '<div class="question-caption">SNACK SHOP CHECKOUT</div><h2 class="cash-question">What is the total value?</h2><div class="money-style-inline"><span>Money look</span>'+moneyStylePicker(true)+'</div><div class="cash-tray">'+q.pieces.map((v,i)=>cashToken(v,i)).join("")+'</div><p class="tip cash-tip">Add all the money. Answer in dollars and cents.<br>Tap pieces to keep track as you add.<br>'+(state.moneyStyle==="drawings"?"Real-money designs, drawn for our game.":"Learning tokens with easy-to-read values.")+'</p>';
 if(state.mode==="times")return '<div class="question-caption">POP THE MISSING NUMBER</div><h2 class="equation" aria-label="'+q.a+' times '+q.b+' equals what?">'+q.a+'<span class="operator" aria-hidden="true">×</span>'+q.b+'<span class="operator" aria-hidden="true">=</span><span class="mystery" aria-hidden="true">?</span></h2>';
 const mystery='<span class="mystery" aria-label="missing number">?</span>';
 return '<div class="question-caption">'+(q.blank==="result"?"A LITTLE SPICE FOR YOUR BRAIN":"FIND THE MISSING NUMBER")+'</div><h2 class="equation">'+(q.blank==="a"?mystery:fraction(q.a))+'<span class="operator">'+q.op+'</span>'+(q.blank==="b"?mystery:fraction(q.b))+'<span class="operator">=</span>'+(q.blank==="result"?mystery:fraction(q.result))+'</h2>';
}
function answerForm(g){
 const disabled=g.done?"disabled":"",d=g.draft;
 if(state.mode==="fractions")return '<form class="answer-form" id="answer-form" novalidate><div class="form-caption">Build your answer</div><div class="fraction-builder"><label>Whole<span class="optional">optional</span><input name="whole" data-draft="whole" aria-label="Whole number, optional" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="0" value="'+esc(d.whole||"")+'" '+disabled+'></label><div class="builder-fraction"><label><span>Top number</span><input name="top" data-draft="top" aria-label="Fraction numerator, top number" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="top" value="'+esc(d.top||"")+'" '+disabled+'></label><label><span>Bottom number</span><input name="bottom" data-draft="bottom" aria-label="Fraction denominator, bottom number" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="bottom" value="'+esc(d.bottom||"")+'" '+disabled+'></label></div><button class="primary" type="submit" '+disabled+'>Check it</button></div><p class="tip">A whole-number answer can leave top and bottom blank. Equivalent fractions count too!</p></form>';
 return '<form class="answer-form" id="answer-form" novalidate><label for="answer-input">'+(state.mode==="money"?"Total value in dollars and cents":"Your answer")+'</label><div class="input-row">'+(state.mode==="money"?'<span class="dollar-prefix" aria-hidden="true">$</span>':"")+'<input id="answer-input" name="answer" data-draft="answer" inputmode="'+(state.mode==="money"?"decimal":"numeric")+'" autocomplete="off" maxlength="12" placeholder="'+(state.mode==="money"?"1.25":"?")+'" value="'+esc(d.answer||"")+'" '+disabled+'><button class="primary" type="submit" '+disabled+'>Check it</button></div>'+(state.mode==="money"?'<p class="tip">For 75 cents, type 0.75. For two dollars, type 2.00.</p>':"")+'</form>';
}
function formatTime(ms){const n=Math.max(0,Math.ceil(ms/1000));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0")}
function game(){
 const g=state.game,q=qNow(),m=MODES[state.mode],timed=!!g.config.duration,b=BUDDIES[progress.squishies[m.owner]%BUDDIES.length];
 const answers=g.config.input==="choices"?'<div class="answers" role="group" aria-label="Choose your answer">'+q.options.map((r,i)=>{const wrong=g.wrong.includes(i),correct=g.done&&M.equal(q.answer,r);return btn(answerLabel(r)+(correct?'<span class="answer-mark" aria-hidden="true">✓</span>':wrong?'<span class="answer-mark" aria-hidden="true">↻</span>':""),"answer",'data-index="'+i+'" data-question="'+g.index+'" aria-label="'+esc(answerSpeech(r)+(correct?", correct answer":wrong?", try a different answer":""))+'" '+(g.done||wrong?"disabled":""),"answer "+(correct?"correct":wrong?"incorrect":""))}).join("")+'</div>':answerForm(g);
 const feedback=g.feedback?'<div id="feedback" role="status" class="feedback '+(g.feedbackKind==="success"?"positive":g.done?(g.revealed?"learning":"positive"):"retry")+'">'+esc(g.feedback)+'</div>':'<div id="feedback" role="status" class="feedback-empty"></div>';
 const solved=g.done?'<div class="explanation"><h3>'+(g.revealed?"Let’s learn this one together":"Here’s the math magic")+'</h3><ol>'+q.steps.map(s=>'<li>'+esc(s)+'</li>').join("")+'</ol></div>'+btn(!timed&&g.index===g.questions.length-1?"See my score":"Next question","next","","primary next-button"):'<div class="help-row">'+btn(g.hint?"Hide hint":"💡 Show a hint","hint",'aria-expanded="'+g.hint+'" aria-controls="hint-panel"',"secondary")+btn("Show me how","reveal","","text-button")+'</div>';
 return '<div class="game-heading"><div><div class="eyebrow">'+m.owner.toUpperCase()+'’S ZONE</div><h1>'+m.icon+' '+m.title+'</h1></div>'+btn("Ⅱ Pause","pause","","secondary")+'</div><div class="round-stats"><span>'+("Question "+(g.index+1)+" of "+g.questions.length)+'</span><strong class="star-counter">⭐ '+g.solved+' solved</strong>'+(timed?'<span class="timer" id="timer" role="timer" aria-label="Time remaining">'+formatTime(g.remaining)+'</span>':'<span class="chill-label">☁ No rush</span>')+'</div><p class="perfect-track">🧸 '+g.firstTry+'/10 correct on the first try</p>'+(!timed?'<div class="round-track" role="progressbar" aria-label="Questions completed" aria-valuenow="'+g.index+'" aria-valuemin="0" aria-valuemax="'+g.questions.length+'"><span style="width:'+(100*g.index/g.questions.length)+'%"></span></div>':"")+'<div class="play-layout"><section class="paper question-card">'+question(q)+answers+feedback+solved+(g.hint&&!g.done?hintPanel(q):"")+'</section><aside class="buddy-panel"><span class="zone">YOUR HYPE SQUISH</span>'+btn(mascot(b,80),"squish",'aria-label="Squish '+b.name+'"',"squish-button")+'<h2>'+b.name+'</h2><p id="squish-message">A little squish. A big deep breath.<br>You’ve got this!</p><div class="buddy-note">'+(timed?"Get all 10 right on your first tries before time runs out to earn a squishy. You can pause anytime.":"Every solved answer earns a star. A perfect 10 on your first tries earns a squishy.")+'</div><div class="mini-progress"><span>YOUR STARS</span><strong>⭐ '+progress.stars[m.owner]+'</strong></div></aside></div>';
}
function paused(){return '<section class="paper centered pause-card"><span class="big-icon" aria-hidden="true">☁️</span><div class="eyebrow">TAKE A BREATHER</div><h1>Squish break.</h1><p>'+(state.game.config.duration?"Your clock is paused. Come back when you’re ready.":"Your question will be right here when you’re ready.")+'</p><div class="center-actions">'+btn("Keep playing","resume","","primary")+btn("Finish & save stars","finish","","secondary")+'</div><p class="tip">Finishing now keeps every star you’ve earned.</p></section>'}
function results(){
 const r=state.result,b=BUDDIES[Math.max(0,Math.min(BUDDIES.length-1,r.squishies-1))];
 const unlocked=Math.max(0,Math.min(BUDDIES.length,r.squishies)-Math.min(BUDDIES.length,r.squishies-r.earned));
 const reward=r.earned?'<div class="reward"><span class="zone">'+(unlocked===1?"NEW SQUISHY UNLOCKED!":unlocked>1?unlocked+" NEW SQUISHIES UNLOCKED!":"PERFECT 10! YOUR CREW IS CHEERING!")+'</span>'+btn(mascot(b,81),"squish",'aria-label="Squish your reward, '+b.name+'"',"squish-button reward-squish")+'<h2>'+b.name+'</h2><p id="squish-message">'+('Ten out of ten on your first tries. You earned this squish!')+'</p></div>':'<p class="no-score-note">Your stars are yours to keep! A new squishy needs a completed round with 10 correct first tries. Hints are always welcome.</p>';
 return '<section class="paper centered result-card"><div class="confetti" aria-hidden="true">✦ &nbsp; ✳ &nbsp; ✦ &nbsp; ✳ &nbsp; ✦</div><div class="eyebrow">HIGH FIVE, '+r.owner.toUpperCase()+'!</div><h1>'+(r.earned?"A perfect 10. A well-earned squish!":r.timed?(r.expired?"Time’s up, superstar!":"That was a great dash!"):"You did the brain work!")+'</h1><p>'+(r.solved?"A little practice. A little progress. A lot to celebrate.":"Every try helps you learn. A fresh start is always here.")+'</p><div class="result-stats"><div><strong>'+r.firstTry+"/10"+'</strong><span>correct on first try</span></div><div><strong>'+r.solved+'</strong><span>answers solved · +'+r.solved+' ⭐</span></div>'+(r.timed?'<div class="'+(r.newBest?"new-best":"")+'"><strong>'+r.best+'</strong><span>'+(r.newBest?"🏆 New personal best!":"your personal best")+'</span></div>':"")+'</div>'+reward+'<div class="center-actions">'+btn("Another round!","start","","primary")+btn("Change settings","setup","","secondary")+btn("My squishy shelf","shelf","","secondary")+'</div><p class="save-note">'+(storageOK?"Saved in this browser on this device.":"Your browser could not save progress. Your stars are available for this visit.")+'</p></section>';
}
function shelf(){
 const name=state.shelfOwner,rounds=progress.squishies[name];
 return '<section class="paper shelf"><div class="eyebrow">SMALL SQUISHIES. BIG WINS.</div><h1>Your squishy shelf</h1><div class="choices">'+["Delilah","Esther"].map(n=>btn(n+' <span aria-hidden="true">⭐</span> '+progress.stars[n],"shelf-owner",'data-owner="'+n+'" aria-pressed="'+(name===n)+'"',"choice "+(name===n?"selected":""))).join("")+'</div><p>Get 10/10 on your first tries to meet a new buddy. Hints are welcome!<br>'+Math.min(BUDDIES.length,rounds)+' of '+BUDDIES.length+' collected. Tap your buddies to squish!</p><div class="shelf-grid">'+BUDDIES.map((b,i)=>'<article class="shelf-item '+(rounds>i?"":"locked")+'">'+(rounds>i?btn(mascot(b,i),"squish",'aria-label="Squish '+b.name+'"',"squish-button shelf-squish"):'<div class="locked-buddy" aria-hidden="true">?</div>')+'<h2>'+(rounds>i?b.name:"Mystery squish "+(i+1))+'</h2><p>'+(rounds>i?"Ready to squish!":"Earn "+(i+1-rounds)+" more perfect 10"+(i+1-rounds===1?"":"s"))+'</p></article>').join("")+'</div>'+btn("Back to adventures","home","","primary")+'</section>';
}
function guide(){
 const money=state.screen==="money-guide";
 return '<section class="paper guide"><div class="eyebrow">'+(money?"POCKET-SIZED KNOW-HOW":"WELCOME TO THE CLUB")+'</div><h1>'+(money?"Meet the money":"A little help to get rolling")+'</h1>'+(money?'<p>Choose learning tokens or drawings of familiar US coins and bills. Match each piece to its name and value.</p>'+moneyStylePicker()+'<div class="money-reference '+(state.moneyStyle==="drawings"?"illustrated-reference":"")+'">'+M.CASH.map(c=>'<div>'+cashToken(c.value,0,false)+'<p><strong>'+c.name+'</strong><br>'+c.value+' cent'+(c.value===1?"":"s")+'</p></div>').join("")+'</div><div class="hint-panel"><h2>Count biggest to smallest</h2><p>Start with bills, then quarters, dimes, nickels and pennies.</p><p>4 quarters = $1 · 10 dimes = $1 · 20 nickels = $1<br>100 pennies = $1 · 100 cents = $1</p></div>':'<div class="how-grid"><article><span>1</span><h2>Pick your adventure</h2><p>Delilah’s fractions cover all four operations. Esther can choose one times table, mix all tables from 1s to 10s, or practice US money.</p></article><article><span>2</span><h2>Find your pace</h2><p>Every round has 10 different questions. Timed rounds end after ten questions or when the clock runs out, and move on automatically after a correct answer. Pause anytime.</p></article><article><span>3</span><h2>Try. Learn. Squish.</h2><p>Hints are always welcome. “Show me how” explains an answer so you can learn and move on. Solve answers to earn stars. Get all 10 right on your first attempts to earn a squishy; hints are allowed. In timed play, finish all ten before the clock runs out. Each perfect round earns one squishy.</p></article></div><div class="hint-panel"><h2>Good to know</h2><p>You can always try again and earn stars. A wrong answer or “Show me how” means that round cannot earn a squishy. Equivalent fractions count, including improper fractions. Money answers use dollars and cents, like 1.25.</p><p>Personal bests are separate for each game, difficulty, timer, and answer style. Progress stays in this browser on this device; it does not sync between devices.</p><p>The timer pauses when you leave the tab. Use “Finish & save stars” before closing the game to save your current round.</p></div>')+btn("Back to "+(money?"Snack Shop":"playing"),"back-help","","primary")+'</section>';
}
function render(focus=false){
 const isGame=state.screen==="game"||state.screen==="pause";
 const content=state.screen==="home"?home():state.screen==="setup"?setup():state.screen==="game"?game():state.screen==="pause"?paused():state.screen==="result"?results():state.screen==="shelf"?shelf():guide();
 app.innerHTML='<header class="site-header"><div class="header-inner">'+btn('<span class="logo-icon" aria-hidden="true">✳</span><span>Squish<span class="logo-amp">&</span>Spice<span class="logo-small">THE MATH CLUB</span></span>',"home",'aria-label="Squish and Spice home"',"brand")+'<nav aria-label="Main navigation">'+(!isGame?btn("Play","home","","nav-button "+(state.screen==="home"?"active":""))+btn("My squishies","shelf","","nav-button "+(state.screen==="shelf"?"active":""))+btn("?","help",'aria-label="How to play"',"icon-button"):"")+btn(state.sound?"♫":"♪","sound",'aria-label="'+(state.sound?"Turn sound off":"Turn sound on")+'" aria-pressed="'+state.sound+'" title="'+(state.sound?"Sound on":"Sound off")+'"',"icon-button sound-button "+(state.sound?"sound-on":""))+'</nav></div></header><main id="main" tabindex="-1">'+content+'</main><footer>Made for Delilah & Esther <span aria-hidden="true">✦</span> A little math. A little magic.</footer>';
 if(focus){document.getElementById("main")?.focus({preventScroll:true});window.scrollTo(0,0)}
}
function begin(){
 const previous=state.game?.mode===state.mode?state.game.questions.map(M.questionKey):[];
 state.game=M.startRound(state.mode,state.config,Date.now(),previous);state.result=null;state.screen="game";render(true);
}
function finish(expired=false){
 if(!state.game||state.game.finished)return;
 const r=M.finishRound(state.game,progress);if(!r)return;
 r.expired=expired;state.result=r;state.shelfOwner=r.owner;state.screen="result";save();render(true);if(r.solved)sound();
}
function pause(){
 if(state.screen!=="game")return;
 if(!M.pauseRound(state.game)){if(M.expired(state.game))finish(true);return}
 state.screen="pause";render(true);
}
function submit(answer,choice=null){
 const g=state.game;if(state.screen!=="game"||Date.now()<(g.acceptAnswersAfter||0))return;
 const result=M.answerRound(g,answer,choice);
 if(result==="ignored")return;
 if(result==="expired"){finish(true);return}
 if(result==="invalid"){g.feedbackKind="";g.feedback=state.mode==="fractions"?"Use whole numbers in the boxes. A fraction needs a top and a bottom; the bottom cannot be zero.":state.mode==="money"?"Enter an amount like 1.25 for $1.25, or 0.75 for 75 cents.":"Enter a whole number, like 24.";}
 if(result==="correct"){
  sound();
  if(g.config.duration){
   const next=M.nextRound(g);
   if(next==="expired"||next==="complete"){finish(next==="expired");return}
   g.acceptAnswersAfter=Date.now()+180;
   g.feedback="Correct! Keep going. ⭐";g.feedbackKind="success";
   render();
   if(g.config.input==="type")document.querySelector('[data-draft="'+(state.mode==="fractions"?"whole":"answer")+'"]')?.focus({preventScroll:true});
   return;
  }
  g.feedback=M.pick(["Squish-tastic! You solved it. ⭐","Hot stuff! That’s right. ⭐","Your brain just did a happy dance! ⭐"]);
 }
 if(result==="incorrect"){g.feedbackKind="";g.feedback=M.pick(["Not quite yet. Try a hint, then give it another go!","Your brain is warming up. You can try again!"]);if(g.wrong.length>=2)g.hint=true}
 render();
 if(result==="correct")document.querySelector('[data-action="next"]')?.focus({preventScroll:true});
 else if(g.config.input==="type")document.querySelector('[data-draft="'+(state.mode==="fractions"?"whole":"answer")+'"]')?.focus({preventScroll:true});
}
function handle(action,data={},target){
 if(action==="squish"){
  if(target){target.classList.remove("squashed");void target.offsetWidth;target.classList.add("squashed");const msg=document.getElementById("squish-message");if(msg)msg.textContent=M.pick(["Squeeeesh! You’ve got this.","Big brain energy!","A squish for your excellent effort.","Breathe in. Squish out."])}
  sound("squish");return;
 }
 if(action==="sound"){
  state.sound=!state.sound;if(state.sound)sound("squish");
  if(target){target.innerHTML=state.sound?"♫":"♪";target.setAttribute("aria-pressed",String(state.sound));target.setAttribute("aria-label",state.sound?"Turn sound off":"Turn sound on");target.classList.toggle("sound-on",state.sound)}return;
 }
 if(action==="home"){
  if(state.screen==="game"){pause();return}
  if(state.screen==="pause"){finish();return}
  state.screen="home";state.game=null;render(true);return;
 }
 if(action==="mode"){if(!MODES[data.mode])return;state.mode=data.mode;state.screen="setup";render(true);return}
 if(action==="setup"){state.screen="setup";render(true);return}
 if(action==="money-style"){
  if(!["tokens","drawings"].includes(data.style))return;
  state.moneyStyle=data.style;
  try{localStorage.setItem(MONEY_STYLE_KEY,state.moneyStyle)}catch{}
  render();
  document.querySelector('[data-action="money-style"][data-style="'+state.moneyStyle+'"]')?.focus({preventScroll:true});
  return;
 }
 if(action==="config"){
  const allowed={op:["+","−","×","÷","mix"],level:["simple","mixed"],table:[1,2,3,4,5,6,7,8,9,10,"mix"],cash:["coins","bills","mixed"],duration:[0,60,120],input:["choices","type"]};
  const k=data.key,v=(k==="table"&&data.value!=="mix")||k==="duration"?Number(data.value):data.value;
  if(!allowed[k]?.includes(v))return;state.config[k]=v;render();
  document.querySelector('[data-key="'+k+'"][data-value="'+v+'"]')?.focus({preventScroll:true});return;
 }
 if(action==="start"){begin();return}
 if(action==="pause"){pause();return}
 if(action==="resume"){if(state.screen==="pause"&&M.resumeRound(state.game)){state.screen="game";render(true)}return}
 if(action==="finish"){finish();return}
 if(action==="shelf"){state.screen="shelf";render(true);return}
 if(action==="shelf-owner"){if(["Delilah","Esther"].includes(data.owner))state.shelfOwner=data.owner;render();return}
 if(action==="help"||action==="money-guide"){state.helpFrom=state.screen;state.screen=action==="help"?"help":"money-guide";render(true);return}
 if(action==="back-help"){state.screen=state.helpFrom;render(true);return}
 if(state.screen!=="game")return;
 const g=state.game,q=qNow();
 if(M.expired(g)){finish(true);return}
 if(action==="answer"){if(data.question!==undefined&&Number(data.question)!==g.index)return;const i=Number(data.index);if(q.options[i])submit(q.options[i],i);return}
 if(action==="hint"){g.hint=!g.hint;render();document.querySelector('[data-action="hint"]')?.focus({preventScroll:true});return}
 if(action==="count"){
  const i=Number(data.index);if(!Number.isInteger(i)||i<0||i>=q.pieces.length)return;
  g.counted=g.counted.includes(i)?g.counted.filter(x=>x!==i):[...g.counted,i];render();document.querySelector('[data-action="count"][data-index="'+i+'"]')?.focus({preventScroll:true});return;
 }
 if(action==="reveal"){
  g.feedbackKind="";if(M.revealRound(g)){g.feedback="Let’s learn this one together. The answer is "+answerSpeech(q.answer)+".";render();document.querySelector('[data-action="next"]')?.focus({preventScroll:true})}return;
 }
 if(action==="next"){const result=M.nextRound(g);if(result==="expired")finish(true);else if(result==="complete")finish(false);else if(result==="next")render(true)}
}
app.addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(b&&!b.disabled)handle(b.dataset.action,b.dataset,b)});
app.addEventListener("input",e=>{if(state.screen==="game"&&e.target.dataset.draft)state.game.draft[e.target.dataset.draft]=e.target.value});
app.addEventListener("submit",e=>{if(e.target.id!=="answer-form")return;e.preventDefault();const g=state.game;if(!g)return;submit(state.mode==="fractions"?M.parseFields(g.draft):M.parseAnswer(g.draft.answer||"",state.mode))});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.screen==="game"&&state.game.config.duration)pause()});
setInterval(()=>{
 const g=state.game;if(state.screen!=="game"||!g?.config.duration)return;
 g.remaining=Math.max(0,g.deadline-Date.now());
 const timer=document.getElementById("timer");if(timer){timer.textContent=formatTime(g.remaining);timer.classList.toggle("urgent",g.remaining<=10000)}
 if(!g.remaining)finish(true);
},200);
render();
})();