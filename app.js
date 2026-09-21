'use strict';
/* YOLO ARC v1 — local-save RPG. Key: yoloarc_v1 (migrates heroarc_v1) */
var $ = function(id){ return document.getElementById(id); };
var KEY = 'yoloarc_v1', OLDKEY = 'heroarc_v1';
var store = {
  load: function(){ try {
    var cur=JSON.parse(localStorage.getItem(KEY)); if(cur) return cur;
    var old=JSON.parse(localStorage.getItem(OLDKEY)); if(!old) return null;
    try{ localStorage.setItem(KEY, JSON.stringify(old)); localStorage.removeItem(OLDKEY); }catch(e2){}
    return old;
  } catch(e){ return null; } },
  save: function(s){ try { s.savedAt=Date.now(); localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} try { if(typeof window!=='undefined'&&window.__cloudPush) window.__cloudPush(); } catch(e2){} },
  clear: function(){ localStorage.removeItem(KEY); localStorage.removeItem(OLDKEY); }
};

var CLASSES = {
  knight: { name:'Knight', face:'K', bonus:'str', desc:'STR path' },
  mage:   { name:'Mage',   face:'M', bonus:'int', desc:'INT path' },
  rogue:  { name:'Rogue',  face:'R', bonus:'foc', desc:'FOC path' }
};

var TRACKS = {
  python: { label:'Learn Python', tag:'PYTHON · DATA', days:'60 DAYS',
    boss:{ title:'The Data Beast', desc:'Clean one real CSV with Pandas. Ship 3 charts + 200 words of insight.' },
    levels:[
      { t:'Variables & Data', d:'Syntax, types, input/output', qs:[['Hello, variables','Run 5 tiny variable scripts','foc'],['Types & casting','int / str / float drills','int'],['Tip calculator CLI','Ship one working CLI tool','str'],['Quiz: types','5-question gate','int']] },
      { t:'Loops & Logic', d:'if / for / while', qs:[['if/else drills','10 condition problems','int'],['FizzBuzz','Classic loop kata','foc'],['Debug the loop','Fix 3 broken loops','int'],['Quiz: logic','5-question gate','int']] },
      { t:'Functions & Files', d:'def / modules / files', qs:[['5 functions','Args, return, defaults','int'],['Modules & pip','Use random + datetime','foc'],['Word counter','Read a .txt, count words','str'],['Quiz: functions','5-question gate','int']] },
      { t:'Pandas Basics', d:'Frames, filters, plots', qs:[['Load a CSV','read_csv, head, describe','foc'],['Filter & groupby','Answer 5 data questions','int'],['Clean messy data','Kill NaNs + dupes','str'],['Plot 3 charts','One honest figure each','str']] }
    ]},
  fitness: { label:'Run 5K', tag:'ENGINE · ZERO TO 5K', days:'40 DAYS',
    boss:{ title:'The 5K Wall', desc:'One GPS-tracked 5K with no walking. Screenshot + one-line race report.' },
    levels:[
      { t:'Base Walk', d:'Daily motion, no injury', qs:[['Walk 20 min x3','Log three walks','str'],['Mobility 101','Hips + ankles routine','foc'],['Sleep 7h x3','Recovery baseline','foc'],['Quiz: form','Posture + cadence check','int']] },
      { t:'Run / Walk', d:'Intervals + cadence', qs:[['1/1 intervals x3','Three 20-min sessions','str'],['Cadence drill','180spm practice','foc'],['Strength x2','Squats + core','str'],['Long walk 60 min','Zone-2 base','str']] },
      { t:'Steady 3K', d:'Aerobic engine', qs:[['2K time trial','Easy pace, timed','str'],['400m x4','Track or app intervals','str'],['Strength x2','Single-leg focus','str'],['Run 3K','No walking allowed','str']] },
      { t:'Race Prep', d:'Taper + fuel', qs:[['Run 4K','Negative split attempt','str'],['Shakeout 2K','Easy day-before jog','foc'],['Fuel plan','Write carbs + hydration','int'],['Early sleep','Race-ready routine','foc']] }
    ]},
  spanish: { label:'Spanish Basics', tag:'LENGUA · A1', days:'30 DAYS',
    boss:{ title:'The Conversation Gate', desc:'Record a 5-minute self-intro + Q&A entirely in Spanish.' },
    levels:[
      { t:'Sounds & Greetings', d:'Pronunciation first', qs:[['Alphabet + ñ','Shadow 20 words aloud','foc'],['10 greetings','Role-play out loud','str'],['Numbers 1–100','Count + self-quiz','int'],['Quiz: basics','5-question gate','int']] },
      { t:'Core Verbs', d:'ser / estar / tener / ir', qs:[['Conjugate 4 verbs','Present tense table','int'],['30 phrases','Flashcard streak','foc'],['Describe family','50-word text','str'],['Quiz: verbs','5-question gate','int']] },
      { t:'Daily Life', d:'Food, time, directions', qs:[['Order food RP','Dialogue aloud','str'],['Tell the time','5 sentences','int'],['Directions','Map exercise','foc'],['Listen 15 min','Podcast + 3 notes','foc']] },
      { t:'Past + Future', d:'Pretérito + ir a', qs:[['Past: 10 verbs','Diary entry','int'],['Future plans','5 sentences','str'],['Mi semana, 100 words','Short story','str'],['Mock convo 3 min','Voice note','str']] }
    ]}
};

var QUIZ = [
 {q:'Which Python type is mutable?', opts:['tuple','list','str'], a:1, d:'code'},
 {q:'FizzBuzz: divisible by 3 AND 5 prints…', opts:['Fizz','Buzz','FizzBuzz'], a:2, d:'code'},
 {q:'`def` defines a…', opts:['loop','function','import'], a:1, d:'code'},
 {q:'Pandas 2D table object?', opts:['Series','DataFrame','ndarray'], a:1, d:'code'},
 {q:'What does len([1,2,3]) return?', opts:['2','3','6'], a:1, d:'code'},
 {q:'x = x + 1 can be written as…', opts:['x += 1','x ++','x =+ 1'], a:0, d:'code'},
 {q:'Which reads a CSV with Pandas?', opts:['pd.load','pd.read_csv','pd.open'], a:1, d:'code'},
 {q:'A `for` loop repeats using…', opts:['an iterator','a guess','a string'], a:0, d:'code'},
 {q:'NaN in data means…', opts:['a name','missing value','negative'], a:1, d:'code'},
 {q:'matplotlib is for…', opts:['plotting','gaming','email'], a:0, d:'code'},
 {q:'180spm in running means…', opts:['heart rate','steps per minute','km per hour'], a:1, d:'fit'},
 {q:'Zone-2 base training feels…', opts:['all-out','easy, can talk','painful'], a:1, d:'fit'},
 {q:'Best4K prep the day before?', opts:['hard intervals','easy shakeout','full rest + junk food'], a:1, d:'fit'},
 {q:'Strength helps runners mainly by…', opts:['looking big','injury-proofing + economy','burnout'], a:1, d:'fit'},
 {q:'Negative split means…', opts:['start fast, fade','second half faster','run backwards'], a:1, d:'fit'},
 {q:'Cadence drills target…', opts:['arm size','steps per minute','shoe brand'], a:1, d:'fit'},
 {q:'Recovery baseline needs…', opts:['4h sleep','7h+ sleep','no water'], a:1, d:'fit'},
 {q:'Spanish “tengo” comes from…', opts:['ser','tener','ir'], a:1, d:'lang'},
 {q:'“¿Dónde está…?” asks for…', opts:['time','location','price'], a:1, d:'lang'},
 {q:'“Voy a comer” is…', opts:['past','future','order'], a:1, d:'lang'},
 {q:'“Gracias” means…', opts:['please','thanks','hello'], a:1, d:'lang'},
 {q:'“La familia” = …', opts:['the food','the family','the map'], a:1, d:'lang'},
 {q:'Shadowing a language means…', opts:['repeat aloud fast','write essays','sleep on it'], a:0, d:'lang'},
 {q:'“Números” are…', opts:['numbers','names','noodles'], a:0, d:'lang'},
 {q:'Boss HP drops when you…', opts:['open the app','finish objectives','wait'], a:1, d:'gen'},
 {q:'A recovery quest appears after…', opts:['2+ idle days','level 5','boss slain'], a:0, d:'gen'},
 {q:'Best proof of work is…', opts:['“trust me”','specific + numbers','long excuses'], a:1, d:'gen'},
 {q:'Streaks reward…', opts:['luck','showing up daily','big weekends'], a:1, d:'gen'},
 {q:'Weak-link training targets…', opts:['your best stat','your lowest stat','nothing'], a:1, d:'gen'},
 {q:'A gate quiz needs…', opts:['any answer','the right answer','a long answer'], a:1, d:'gen'},
 {q:'Focus timer standard block?', opts:['25 min','5 hours','all day'], a:0, d:'gen'},
 {q:'XP level threshold is…', opts:['100','500','5000'], a:1, d:'gen'}
];
function pickQuiz(){
  var dom='gen';
  try{ dom=detectDomain(S.goalLabel); }catch(e){}
  var pool=QUIZ.filter(function(x){ return x.d===dom; });
  if(!pool.length) pool=QUIZ.filter(function(x){ return x.d==='gen'; });
  if(!pool.length) pool=QUIZ;
  return pool[Math.floor(Math.random()*pool.length)];
}
var ACHS = [
  { id:'first', name:'First Blood', desc:'Clear 1 quest' },
  { id:'streak3', name:'On Fire', desc:'3-day streak' },
  { id:'half', name:'Halfway Hero', desc:'50% of arc done' },
  { id:'boss', name:'Boss Slayer', desc:'Drop the boss to 0 HP' },
  { id:'focused', name:'Timekeeper', desc:'Log a focus session' },
  { id:'lvl4', name:'Arc Walker', desc:'Reach level 4' }
];

function fresh(){ return { hero:'', cls:'knight', goalKey:'python', goalLabel:'Learn Python', days:60, hrs:'1', exp:'beginner', pace:'balanced', seed:0, xp:0, streak:0, lastCheckin:null, done:{}, bossDone:{}, ach:{}, log:[], heat:{}, stats:{str:1,int:1,foc:1}, ml:{str:0,int:0,foc:0,cleared:0,dealt:0}, daily:null, taunt:null, createdAt:Date.now() }; }
var S = store.load() || fresh();
var ORIG_PYTHON_JSON = JSON.stringify(TRACKS.python);
var selCls = S.cls || 'knight';
var pendingQ = null, pendingQuiz = null;
var timerSec = 25*60, timerOn = false, timerId = null, timerElapsed = 0;

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function track(){ if(S.goalKey==='_ai'&&!TRACKS._ai){ TRACKS._ai=smartArc({ goal:S.goalLabel, doneLooks:'', days:S.days, hrs:S.hrs||'1', exp:S.exp||'beginner', pace:S.pace||'balanced', seed:S.seed||0 }); } return TRACKS[S.goalKey] || TRACKS[S.goalKey = 'python']; }
function lvl(){ return Math.floor(S.xp/500)+1; }
function rankName(l){ if(l>=8) return 'MYTHIC'; if(l>=6) return 'GOLD'; if(l>=4) return 'SILVER'; if(l>=2) return 'BRONZE'; return 'SCRAP'; }
function allQ(){ var out=[], t=track(); for(var li=0; li<t.levels.length; li++){ for(var qi=0; qi<t.levels[li].qs.length; qi++){ out.push({ id:'L'+li+'Q'+qi, li:li, title:t.levels[li].qs[qi][0], sub:t.levels[li].qs[qi][1], stat:t.levels[li].qs[qi][2] }); } } return out; }
function scaled(){ var t=track(); if(S.days<=21 && t.levels.length>3){ return [t.levels[0], { t:t.levels[1].t.split(' ')[0]+' + '+t.levels[2].t.split(' ')[0], d:'Condensed — honest workload', qs:t.levels[1].qs.slice(0,2).concat(t.levels[2].qs.slice(0,2)) }, t.levels[3]]; } return t.levels; }
function idsFor(li){ var all=allQ(), n=scaled().length, per=Math.ceil(all.length/n); return all.slice(li*per,(li+1)*per).map(function(q){return q.id;}); }
function findQ(id){ if(id==='R0') return { title:'Recovery run', sub:'15-min comeback', stat:'foc' }; if(id==='D0'&&S.daily&&S.daily.title) return { title:S.daily.title, sub:S.daily.sub, stat:S.daily.stat }; var all=allQ(); for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; return { title:id, sub:'', stat:'foc' }; }
function lvlDone(li){ var ids=idsFor(li); return ids.length>0 && ids.every(function(id){return S.done[id];}); }
function doneN(){ return Object.keys(S.done).length; }
function bossHP(){ var n=Object.keys(S.bossDone).length; return { hp:Math.max(0,100-n*25), dead:n>=4 }; }
function needsRec(){ if(!S.lastCheckin || S.done.R0) return false; return Math.floor((Date.now()-new Date(S.lastCheckin).getTime())/864e5)>=2; }
function todayK(){ return new Date().toISOString().slice(0,10); }
function bumpHeat(){ var k=todayK(); S.heat[k]=(S.heat[k]||0)+1; }
function addLog(t){ S.log.unshift(new Date().toLocaleString()+' — '+t); S.log=S.log.slice(0,40); }

function checkAch(){ if(doneN()>=1) S.ach.first=1; if(S.streak>=3) S.ach.streak3=1; if(doneN()>=Math.ceil(allQ().length/2)) S.ach.half=1; if(bossHP().dead) S.ach.boss=1; if(lvl()>=4) S.ach.lvl4=1; }

/* ---------- SMART ARC ENGINE (on-device AI + tiny ML) ----------
   Reads goal + done-looks + experience + pace, detects the domain,
   and deals levels + boss. Learns from your history via S.ml. */
var DOMAIN_KEYS = {
  code:['python','code','coding','javascript','typescript','java','developer','program','website','portfolio','app','data','pandas','sql','backend','frontend',' dev'],
  fit:['run','5k','marathon','fit','gym','muscle','weight','yoga','swim','push','sport','football','basketball','dance','walk','lift'],
  lang:['spanish','french','arabic','language','english','german','italian','japanese','speak','ielts','toefl','turkish'],
  music:['guitar','piano','music','sing','drums','violin','beat','produce'],
  art:['draw','design','paint','photo','video','youtube','content','draw','film'],
  biz:['business','startup','client','freelance','money','shop','store','brand','marketing','sales','revenue','hustle','coffee','bakery','cart','food','restaurant','sell','launch','ebook'],
  study:['exam','study','univers','school','math','physics','degree','course','thesis','grade','homework']
};
var DOMAIN_BOSS = {
  code:['The Shipped Beast','The Demo Dragon'], fit:['The 5K Wall','The Final Timer'],
  lang:['The Conversation Gate','The Fluency Golem'], music:['The Stage Fright','The First Gig'],
  art:['The Blank Canvas','The Gallery Gate'], biz:['The First Paying Customer','The Launch Day'],
  study:['The Final Exam','The Thesis Terror'], general:['The Doubt Demon','The Finish Line']
};
var DOMAIN_FLAVOR = {
  code:['Ship one tiny script','Read docs + take notes'], fit:['One Zone-2 session','Form check on video'],
  lang:['Shadow 20 phrases aloud','Write 10 sentences'], music:['Play one section 5x slow','Record + listen back'],
  art:['One 25-min study','Post 1 WIP for feedback'], biz:['Talk to 1 customer','Write the offer in 1 page'],
  study:['2 past-paper questions','Teach-back in 100 words'], general:['One 25-min rep','Write down 3 lessons']
};
function detectDomain(text){
  var t=' '+(String(text||'').toLowerCase())+' ', best='general', bs=0;
  for(var d in DOMAIN_KEYS){ var s=0, ks=DOMAIN_KEYS[d]; for(var i=0;i<ks.length;i++){ if(t.indexOf(ks[i])>=0) s+=ks[i].length; } if(s>bs){bs=s;best=d;} }
  return best;
}
function weakestStat(){
  var m=S.ml||{str:0,int:0,foc:0}, w='str';
  if(m.int<m[w]) w='int'; if(m.foc<m[w]) w='foc';
  return w;
}
function mlLearn(stat){ S.ml=S.ml||{str:0,int:0,foc:0,cleared:0,dealt:0}; S.ml[stat]=(S.ml[stat]||0)+1; S.ml.cleared=(S.ml.cleared||0)+1; }
function smartArc(o){
  var g=(o.goal||'Custom goal').trim()||'Custom goal';
  var dom=detectDomain(g+' '+(o.doneLooks||''));
  var exp=o.exp||'beginner', pace=o.pace||'balanced', seed=o.seed||0;
  var shortG=g.length>34?g.slice(0,34)+'…':g;
  var flav=DOMAIN_FLAVOR[dom]||DOMAIN_FLAVOR.general;
  function Q(a,b,s){ return [a,b,s]; }
  var baseQuest = exp==='advanced' ? Q('Baseline test','Prove your base in one session, logged', 'str') : Q('Define done for '+shortG,'Write a 5-sentence spec','int');
  var pools=[
    [baseQuest, Q('First 3 reps','3 x 25-min sessions','foc'), Q('Study 3 examples','Steal 1 idea from each','int'), Q(flav[0],'Log it','foc'), Q(flav[1],'Log it','int'), Q('Setup + easy win','Unblock day-1 friction','str')],
    [Q('7-day streak','One rep daily, logged','str'), Q('Fix 3 mistakes','Write what broke + fix','int'), Q('Ask for feedback','One outside eye','str'), Q('Volume block','5 focused reps','foc'), Q('Mid-arc review','Score 1-10 + why','foc'), Q('Teach it back','Explain simply, 100 words','int')],
    [Q('Hard mode x3','Next-difficulty sessions','str'), Q('Timed trial','Beat your own baseline','str'), Q('Edge cases','List 5 ways it fails','int'), Q('Cut the scope','Kill one nice-to-have','foc'), Q('Deep study block','90 min, phone away','int'), Q('Weak-link training','Extra rep on hardest part','foc')],
    [Q('Polish pass','Fix the roughest 20%','str'), Q('Collect proof','Screenshots / stats / video','foc'), Q('Dry run','Full rehearsal once','str'), Q('Boss prep','Checklist ready','foc'), Q('Ship checklist','Everything Green','foc'), Q('Victory lap','One clean rep, no notes','str')]
  ];
  var titles=['Map the terrain','Volume phase','Raise the bar','Polish + proof'];
  var descs=['Scope + first reps','Reps beat talent','Harder variants','Make it undeniable'];
  if(exp==='advanced'){ titles[0]='Skip basics — prove base'; }
  var per = pace==='grind'?5:(pace==='chill'?3:4);
  var weak=weakestStat(), levels=[];
  for(var li=0; li<4; li++){
    var pool=pools[li], qs=[], seen={};
    for(var k=0;k<per;k++){ var q=pool[(seed+li*2+k)%pool.length]; if(seen[q[0]]){ q=pool[(seed+li*2+k+3)%pool.length]; } seen[q[0]]=1; qs.push([q[0],q[1],q[2]]); }
    var hasWeak=qs.some(function(x){return x[2]===weak;});
    if(!hasWeak){ var qi=qs.length-1; if(/quiz/i.test(qs[qi][0])) qi=0; qs[qi]=[qs[qi][0]+' (weak-link)','Extra focus rep — your data says '+weak.toUpperCase()+' lags',weak]; }
    levels.push({ t:titles[li], d:descs[li], qs:qs });
  }
  var bossT=DOMAIN_BOSS[dom][seed%DOMAIN_BOSS[dom].length];
  var bossD=(o.doneLooks&&o.doneLooks.trim()) ? o.doneLooks.trim()+' — split across the 4 boss objectives below.' : 'One public proof of '+g+': publish, demo, or post before/after with numbers.';
  return { label:g, tag:dom.toUpperCase()+' · '+exp.toUpperCase()+' · '+pace.toUpperCase(), days:String(o.days||60)+' DAYS', boss:{ title:bossT+': '+shortG, desc:bossD }, levels:levels, domain:dom };
}
/* Backwards-compat wrapper (old saves call customTrack) */
function customTrack(label){ return smartArc({ goal:label, doneLooks:'', days:S.days, hrs:S.hrs, exp:'beginner', pace:'balanced', seed:0 }); }
function validArc(j){
  if(!j||!j.boss||!j.boss.title||!j.boss.desc) return false;
  if(!j.levels||j.levels.length<3||j.levels.length>6) return false;
  for(var i=0;i<j.levels.length;i++){ var L=j.levels[i];
    if(!L.t||!L.qs||L.qs.length<3||L.qs.length>6) return false;
    for(var k=0;k<L.qs.length;k++){ var q=L.qs[k];
      if(!q[0]||!q[1]||(q[2]!=='str'&&q[2]!=='int'&&q[2]!=='foc')) return false; } }
  return true;
}

/* ---------- render ---------- */
function render(){
  var L=lvl(), cur=(L-1)*500, pct=Math.min(100, Math.round((S.xp-cur)/5));
  var cls=CLASSES[S.cls]||CLASSES.knight;
  $('face').textContent = S.hero ? (S.hero.charAt(0).toUpperCase()) : '?';
  $('charName').textContent = S.hero ? S.hero.toUpperCase()+' THE '+cls.name.toUpperCase() : 'NO HERO YET';
  $('charRank').textContent = 'RANK: '+rankName(L)+' · LV '+L;
  $('charLevel').textContent = L;
  $('xpBar').style.width = pct+'%';
  $('xpTxt').textContent = S.xp; $('nextTxt').textContent = L*500;
  $('streakTxt').textContent = S.streak; $('navStreakNum').textContent = S.streak;
  $('campaignSub').textContent = S.hero ? (S.goalLabel+' · '+S.days+' days · '+doneN()+'/'+allQ().length+' quests · '+cls.desc) : 'No active arc. Start one above.';
  $('recoveryBox').classList.toggle('hidden', !needsRec());
  var tot=S.stats.str+S.stats.int+S.stats.foc;
  $('strTxt').textContent=S.stats.str; $('intTxt').textContent=S.stats.int; $('focTxt').textContent=S.stats.foc;
  $('strBar').style.width=Math.min(100,S.stats.str*12)+'%'; $('intBar').style.width=Math.min(100,S.stats.int*12)+'%'; $('focBar').style.width=Math.min(100,S.stats.foc*12)+'%';

  // heat last 30d
  var h=''; var now=new Date();
  for(var i=29;i>=0;i--){ var d=new Date(now.getTime()-i*864e5); var k=d.toISOString().slice(0,10); var v=S.heat[k]||0; var c=v>=3?'l3':v===2?'l2':v===1?'l1':''; h+='<i class="'+c+'" title="'+k+': '+v+'"></i>'; }
  $('heat').innerHTML=h;

  checkAch();
  $('achList').innerHTML = ACHS.map(function(a){ return '<div class="ach'+(S.ach[a.id]?' on':'')+'"><b>'+(S.ach[a.id]?'■':'□')+'</b><span><b>'+a.name+'</b> — '+a.desc+'</span></div>'; }).join('');

  $('logList').innerHTML = S.log.length ? S.log.map(function(x){ return '<div class="logitem">'+esc(x)+'</div>'; }).join('') : '<p class="dim">Nothing yet. Your proofs, check-ins and boss damage land here.</p>';

  // levels
  var sc=scaled(), html='';
  for(var li=0; li<sc.length; li++){
    var ids=idsFor(li), dn=ids.filter(function(id){return S.done[id];}).length;
    var locked = li>0 && !lvlDone(li-1);
    var tag = dn===ids.length ? '<span class="tag done">CLEAR</span>' : locked ? '<span class="tag">LOCKED</span>' : '<span class="tag open">OPEN</span>';
    html+='<div class="level"><div class="level-head"><div class="lvlnum">'+(dn===ids.length?'★':(li+1))+'</div><div><h3>LEVEL '+(li+1)+' — '+esc(sc[li].t)+'</h3><p>'+esc(sc[li].d)+' · '+dn+'/'+ids.length+(locked?' · clear previous level':'')+'</p></div>'+tag+'</div><div class="quests">';
    for(var j=0;j<ids.length;j++){
      var q=findQ(ids[j]), done=!!S.done[ids[j]];
      html+='<div class="quest'+(done?' done':'')+(locked&&!done?' locked':'')+'"><div class="qbox" data-q="'+ids[j]+'">'+(done?'✓':'')+'</div><div class="qt"><b>'+esc(q.title)+'</b><span>'+esc(q.sub)+' · +'+q.stat.toUpperCase()+'</span></div><div class="qxp">+100 XP</div></div>';
    }
    if(li===0 && needsRec() && !S.done.R0) html+='<div class="quest"><div class="qbox" data-q="R0"></div><div class="qt"><b>Recovery run: 15-min comeback</b><span>Any 15-min session + 1 sentence of proof</span></div><div class="qxp">+50 XP</div></div>';
    html+='</div></div>';
  }
  $('levels').innerHTML = html;
  var boxes=document.querySelectorAll('[data-q]');
  for(var b=0;b<boxes.length;b++){ boxes[b].onclick=function(){ openVerify(this.getAttribute('data-q')); }; }

  // boss
  var boss=track().boss, hp=bossHP();
  $('bossTitle').textContent=boss.title; $('bossDesc').textContent=boss.desc;
  $('bossHpTxt').textContent = hp.dead ? 'SLAIN' : hp.hp+' HP';
  var sh=$('shareBtn'); if(sh) sh.classList.toggle('hidden', !hp.dead);
  $('bossBar').style.width=hp.hp+'%';
  var names=bossNames();
  var bh='';
  for(var t2=0;t2<4;t2++){ var dd=!!S.bossDone['B'+t2];
    bh+='<div class="quest'+(dd?' done':'')+'"><div class="qbox" data-b="B'+t2+'">'+(dd?'✓':'')+'</div><div class="qt"><b>'+names[t2]+'</b><span>Boss objective '+(t2+1)+' of 4 · deals 25 dmg</span></div><div class="qxp">+125 XP</div></div>';
  }
  $('bossTasks').innerHTML=bh;
  var bb=document.querySelectorAll('[data-b]');
  for(var c=0;c<bb.length;c++){ bb[c].onclick=function(){ bossHit(this.getAttribute('data-b')); }; }

  renderDaily();
  renderPosters();
  store.save(S);
  maybeTaunt();
}

function renderPosters(){
  var arr=[['python','PYTHON · DATA','Learn Python','Engine builds Variables → Pandas → Data boss from your words.','60 DAYS'],['fitness','ENGINE · 5K','Run 5K','Engine builds base → intervals → 5K Wall from your words.','40 DAYS'],['spanish','LENGUA · A1','Spanish Basics','Engine builds sounds → verbs → Conversation Gate.','30 DAYS']];
  $('templateGrid').innerHTML=arr.map(function(x){ return '<div class="poster"><span class="k">'+x[1]+'</span><h3>'+x[2]+'</h3><p>'+x[3]+'</p><p class="mono dim">'+x[4]+'</p><button class="btn small" data-t="'+x[0]+'">Fill + start</button></div>'; }).join('');
  var btns=document.querySelectorAll('[data-t]');
  for(var i=0;i<btns.length;i++){ btns[i].onclick=function(){ fillPreset(this.getAttribute('data-t')); startArc(true); }; }
}

/* ---------- verify ---------- */
function openVerify(qid){
  var all=allQ(), idx=-1;
  for(var i=0;i<all.length;i++) if(all[i].id===qid) idx=i;
  var li = qid==='R0' ? 0 : Math.floor(idx/Math.ceil(all.length/scaled().length));
  if(li>0 && !lvlDone(li-1)){ toast('Clear Level '+li+' first — locked.'); return; }
  if(S.done[qid]) return;
  if(qid==='D0'){
    pendingQ=qid; pendingQuiz=null;
    $('mKick').textContent='DAILY DROP · JUDGED 1-10 · UP TO +50 XP';
    $('mTitle').textContent=S.daily.title;
    $('mDesc').textContent='Bonus quest. The Judge grades the proof — sharper proof, more XP.';
    $('mBody').innerHTML='<textarea id="proof" rows="3" placeholder="Prove today’s quest…"></textarea>';
    $('modalBack').classList.remove('hidden'); return;
  }
  pendingQ=qid;
  var q=findQ(qid), isQuiz = /quiz/i.test(q.title);
  $('mKick').textContent = qid==='R0' ? 'RECOVERY CHECK' : 'VERIFICATION · +'+q.stat.toUpperCase();
  $('mTitle').textContent = qid==='R0' ? 'Prove the comeback' : q.title;
  if(qid==='R0' || !isQuiz){
    $('mDesc').textContent='The Judge grades every proof 1-10. Score x 10 = your XP. Be specific.';
    $('mBody').innerHTML='<textarea id="proof" rows="3" placeholder="What did you actually do? Numbers and artifacts score highest."></textarea>';
    pendingQuiz=null;
  } else {
    var item=pickQuiz(); pendingQuiz=item;
    $('mDesc').textContent='Gate quiz — answer right to claim XP: '+item.q;
    var o=''; for(var k=0;k<item.opts.length;k++) o+='<label class="quizopt"><input type="radio" name="qq" value="'+k+'"> '+esc(item.opts[k])+'</label>';
    $('mBody').innerHTML=o;
  }
  $('modalBack').classList.remove('hidden');
}
var modalBusy=false;
function closeModal(){ $('modalBack').classList.add('hidden'); pendingQ=null; pendingQuiz=null; pendingBoss=null; modalBusy=false; var sb=$('mSubmit'); sb.disabled=false; sb.textContent='CLAIM XP'; }
function geminiJudge(title, proof, cb){
  geminiChat([{role:'user', content:'You judge quest proofs in YOLO ARC, a real-life RPG. Goal: "'+S.goalLabel+'". Quest: "'+title+'". Proof: "'+String(proof).slice(0,600)+'". Score 1-10. 1-3 vague or fakeable. 4-6 real effort. 7-8 specific and verifiable. 9-10 undeniable with numbers or artifacts. Reply ONLY JSON {"score":N,"note":"ten words max"}.'}], 0.3, function(err, content){
    if(!err){
      try{
        var o=extractJSON(content);
        var s=Math.max(1,Math.min(10,Math.round(o.score)||7));
        cb({score:s, note:String(o.note||'judged').slice(0,60), engine:'GEMINI'}); return;
      }catch(e){}
    }
    cb(err&&(err.message==='no-key'||err.message==='needs-key')?{score:8, note:'solid work', engine:'LOCAL'}:{score:7, note:'kept moving', engine:'LOCAL'});
  }, false);
}
function bankXp(qid, q, gain, logLine){
  var before=lvl();
  if(qid==='D0'){ S.daily.done=true; S.daily.got=gain; }
  else S.done[qid]=Date.now();
  S.xp+=gain; bumpHeat();
  S.stats[q.stat]=(S.stats[q.stat]||1)+1; mlLearn(q.stat);
  if(qid==='R0'){ S.streak=1; S.lastCheckin=new Date().toISOString(); }
  addLog(logLine+' (+'+gain+' XP)');
  closeModal();
  if(lvl()!==before){ sfx('level'); bigtoast('LEVEL '+lvl()+' — RANK '+rankName(lvl())); }
  else toast('+'+gain+' XP banked.');
  render();
}
$('mCancel').onclick=function(){ closeModal(); };
$('modalBack').addEventListener('click', function(e){ if(e.target.id==='modalBack'){ closeModal(); } });
$('mSubmit').onclick=function(){
  if(pendingBoss){ bankBoss(); return; }
  if(!pendingQ||modalBusy) return;
  var q=findQ(pendingQ);
  if(pendingQuiz){
    var sel=document.querySelector('input[name="qq"]:checked');
    if(!sel){ toast('Pick an answer first.'); return; }
    if(Number(sel.value)!==pendingQuiz.a){ closeModal(); toast('Wrong gate — review and retry. No XP lost.'); return; }
    bankXp(pendingQ, q, 100, 'Gate passed: '+q.title);
    return;
  }
  var v=($('proof') && $('proof').value || '').trim();
  if(v.length<10){ toast('Give the Judge something to read (10+ chars).'); return; }
  if(pendingQ==='R0'){ bankXp('R0', q, 50, 'Recovery quest cleared — streak restarted'); return; }
  modalBusy=true; var sb=$('mSubmit'); sb.disabled=true; sb.textContent='JUDGE IS READING…';
  var isDaily=(pendingQ==='D0');
  geminiJudge(q.title, v, function(res){
    var gain=isDaily?res.score*5:res.score*10;
    bankXp(pendingQ, q, gain, (isDaily?'Daily drop ':('Judge '+res.score+'/10 ['+res.engine+']'+(res.note?' "'+res.note+'"':'')+' '))+q.title);
  });
};

var pendingBoss=null;
function bossNames(){ return ['Scope + proof plan','Core build','Polish + evidence','Publish + post-mortem']; }
function bossHit(id){
  if(S.bossDone[id]) return;
  var last=scaled().length-1;
  if(!lvlDone(last)){ toast('The boss is immune — clear all levels first.'); return; }
  pendingBoss=id; pendingQuiz=null;
  var n=Number(String(id).slice(1))||0;
  $('mKick').textContent='BOSS STRIKE · +125 XP · 25 DMG';
  $('mTitle').textContent=bossNames()[n]||'Boss strike';
  $('mDesc').textContent='Paste link or notes (10+ chars). Bosses respect raw proof — flat reward.';
  $('mBody').innerHTML='<textarea id="proof" rows="3" placeholder="Evidence of the objective…"></textarea>';
  $('modalBack').classList.remove('hidden');
}
function bankBoss(){
  var v=($('proof')&&$('proof').value||'').trim();
  if(v.length<10){ toast('Boss shrugs — 10+ chars of evidence.'); return; }
  var id=pendingBoss;
  S.bossDone[id]=Date.now(); S.xp+=125; bumpHeat();
  addLog('Boss hit: '+v.slice(0,90)+' (+125 XP)');
  pendingBoss=null; closeModal(); shakeBoss();
  var hp=bossHP();
  if(hp.dead){ sfx('boss'); bigtoast('BOSS SLAIN — ARC COMPLETE'); addLog('BOSS SLAIN. Arc complete: '+S.goalLabel); }
  else { sfx('hit'); toast('25 damage dealt. Boss: '+hp.hp+' HP.'); }
  render();
}

/* ---------- AI COACH (one tap, reads log + stats) ---------- */
$('coachBtn').onclick=function(){
  if(!S.hero){ toast('Start an arc first.'); return; }
  var out=$('coachOut'), btn=$('coachBtn');
  btn.disabled=true; out.textContent='Reading your log…';
  var ctx='Goal '+S.goalLabel+', level '+lvl()+' rank '+rankName(lvl())+', streak '+S.streak+', stats STR '+S.stats.str+' INT '+S.stats.int+' FOC '+S.stats.foc+', quests '+doneN()+'/'+allQ().length+'. Recent log: '+S.log.slice(0,6).join(' | ');
  geminiChat([{role:'user', content:'You are a tough-loving RPG coach for YOLO ARC. Player context: '+ctx+'. Give ONE actionable tip under 25 words, specific to their numbers. Reply ONLY JSON {"tip":"..."}.'}], 0.7, function(err, content){
    var tip='';
    if(!err){ try{ tip=String(extractJSON(content).tip||'').slice(0,160); }catch(e){} }
    if(!tip){
      var w=weakestStat();
      tip='Your '+w.toUpperCase()+' lags at '+((S.ml&&S.ml[w])||0)+' — schedule one '+w.toUpperCase()+' rep before noon tomorrow.';
      out.textContent='“'+tip+'” (local)';
    } else out.textContent='“'+tip+'”';
    addLog('Coach: '+tip); btn.disabled=false; store.save(S);
  }, true);
};

/* ---------- DAILY DROP (one bonus quest per day) ---------- */
function renderDaily(){
  var box=$('dailyBox'); if(!box) return;
  if(!S.hero){ box.innerHTML='<p class="dim">Start an arc to unlock the daily drop.</p>'; return; }
  if(!S.daily||S.daily.date!==todayK()){
    if(!getKey()){
      var w0=weakestStat();
      S.daily={ date:todayK(), title:'Weak-link rep: 25 min toward '+S.goalLabel, sub:'Log specifics — the Judge rewards numbers', stat:w0, done:false };
      try{ store.save(S); }catch(e){}
    } else {
      box.innerHTML='<button class="btn small red" id="pullBtn" type="button">PULL TODAY’S DROP</button><p class="dim">One Gemini bonus quest for today, judged up to +50 XP.</p>';
      $('pullBtn').onclick=pullDaily; return;
    }
  }
  if(S.daily.done){ box.innerHTML='<div class="ach on"><b>■</b><span><b>Cleared:</b> '+esc(S.daily.title)+' (+'+S.daily.got+' XP)</span></div>'; return; }
  box.innerHTML='<div class="quest"><div class="qbox" id="dailyCheck">?</div><div class="qt"><b>'+esc(S.daily.title)+'</b><span>'+esc(S.daily.sub)+' · judged 1-10</span></div><div class="qxp">+50 XP</div></div>';
  $('dailyCheck').onclick=function(){ openVerify('D0'); };
}
function pullDaily(){
  $('dailyBox').innerHTML='<p class="dim">Rolling today’s quest…</p>';
  var ctx='Goal: '+S.goalLabel+'. Level '+lvl()+', streak '+S.streak+', weakest stat '+weakestStat()+', done '+doneN()+'/'+allQ().length+'. Recent: '+S.log.slice(0,5).join(' | ');
  geminiChat([{role:'user', content:'Write ONE bonus daily quest for YOLO ARC. Context: '+ctx+'. Doable today in under an hour. Reply ONLY JSON {"title":"...","sub":"concrete verification under 12 words","stat":"str|int|foc"}.'}], 0.8, function(err, content){
    var o=null;
    if(!err){ try{ o=extractJSON(content); }catch(e){} }
    if(o&&o.title&&o.sub&&(o.stat==='str'||o.stat==='int'||o.stat==='foc')){
      S.daily={ date:todayK(), title:String(o.title).slice(0,70), sub:String(o.sub).slice(0,90), stat:o.stat, done:false };
      addLog('Daily drop: '+S.daily.title); renderDaily(); store.save(S); return;
    }
    var w=weakestStat();
    S.daily={ date:todayK(), title:'Weak-link rep: 25 min toward '+S.goalLabel, sub:'Log what you did, 10+ chars', stat:w, done:false };
    addLog('Daily drop (local): '+S.daily.title); renderDaily(); store.save(S);
  }, true);
}

/* ---------- BOSS TRASH-TALK (from real slip-ups) ---------- */
function slipStats(){
  var daysAgo=S.lastCheckin?Math.floor((Date.now()-new Date(S.lastCheckin).getTime())/864e5):99;
  if(isNaN(daysAgo)) daysAgo=99;
  return { idle:daysAgo, pct:Math.round(doneN()/Math.max(1,allQ().length)*100), weak:weakestStat(), streak:S.streak };
}
function localTaunt(){
  var s=slipStats();
  var pool=[
    'Idle '+s.idle+' day(s), hero? I nap through weaker excuses.',
    'Only '+s.pct+'% cleared. I have seen scarier warm-ups.',
    'Your '+s.weak.toUpperCase()+' is dessert-soft. Come take your 25 damage back.'
  ];
  return pool[(S.seed||0)%pool.length];
}
function setTaunt(t){ S.taunt={ date:todayK(), text:t }; store.save(S); var el=$('bossTaunt'); if(el) el.textContent='“'+t+'”'; }
function fetchTaunt(manual){
  if(!S.hero) return;
  var s=slipStats();
  if(manual){ var el0=$('bossTaunt'); if(el0) el0.textContent='The boss clears its throat…'; }
  geminiChat([{role:'user', content:'You are the final boss "'+track().boss.title+'" in YOLO ARC, roasting the player with TRUE stats: days idle '+s.idle+', arc cleared '+s.pct+'%, streak '+s.streak+', weakest stat '+s.weak+'. One taunt, max 22 words, playful, no profanity. Reply ONLY JSON {"taunt":"..."}.'}], 0.9, function(err, content){
    var ta='';
    if(!err){ try{ ta=String(extractJSON(content).taunt||'').slice(0,140); }catch(e){} }
    setTaunt(ta||localTaunt());
  }, manual);
}
function maybeTaunt(){
  if(!S.hero) return;
  if(S.taunt&&S.taunt.date===todayK()&&S.taunt.text){ var el=$('bossTaunt'); if(el) el.textContent='“'+S.taunt.text+'”'; return; }
  fetchTaunt(false);
}
$('tauntBtn').onclick=function(){ fetchTaunt(true); };
$('soundBtn').onclick=function(){ sfxOn=!sfxOn; $('soundBtn').textContent=sfxOn?'SOUND ON':'MUTED'; if(sfxOn) sfx('level'); };
function themeMode(){ try{ return localStorage.getItem('yoloarc_theme')||'auto'; }catch(e){ return 'auto'; } }
function applyTheme(mode){
  var dark = mode==='dark';
  try{ if(mode==='auto'&&typeof window!=='undefined'&&window.matchMedia){ dark=window.matchMedia('(prefers-color-scheme: dark)').matches; } }catch(e){}
  try{ document.documentElement.setAttribute('data-theme', dark?'dark':'light'); }catch(e){}
  var b=$('themeBtn'); if(b) b.textContent = mode==='auto'?'AUTO':(dark?'DARK':'LIGHT');
  try{ localStorage.setItem('yoloarc_theme', mode); }catch(e){}
}
function initTheme(){
  applyTheme(themeMode());
  var b=$('themeBtn');
  if(b) b.onclick=function(){
    var cur=themeMode();
    applyTheme(cur==='auto'?'light':(cur==='light'?'dark':'auto'));
  };
  try{
    if(typeof window!=='undefined'&&window.matchMedia){
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ if(themeMode()==='auto') applyTheme('auto'); });
    }
  }catch(e){}
}
try{ initTheme(); }catch(e){}
$('shareBtn').onclick=function(){ shareVictory(); };
function shareVictory(){
  try{
    var c=document.createElement('canvas'); c.width=1200; c.height=630;
    var x=c.getContext('2d');
    x.fillStyle='#F4EFE2'; x.fillRect(0,0,1200,630);
    x.strokeStyle='#181310'; x.lineWidth=10; x.strokeRect(24,24,1152,582);
    x.fillStyle='#FF4B2D'; x.fillRect(24,24,1152,90);
    x.fillStyle='#F4EFE2'; x.font='bold 44px sans-serif'; x.fillText('YOLO ARC — BOSS SLAIN', 60, 88);
    x.fillStyle='#181310'; x.font='bold 72px sans-serif';
    x.fillText((S.hero||'Nameless').toUpperCase(), 60, 210);
    x.font='40px sans-serif'; x.fillText(String(S.goalLabel).slice(0,42), 60, 270);
    x.font='bold 54px sans-serif';
    x.fillText('LV '+lvl()+' · '+rankName(lvl())+' · '+S.xp+' XP', 60, 360);
    x.font='36px sans-serif';
    x.fillText('Streak '+S.streak+' days · '+doneN()+' quests cleared', 60, 420);
    x.fillStyle='#FFC531'; x.fillRect(60,470,400,70);
    x.fillStyle='#181310'; x.font='bold 38px sans-serif'; x.fillText('LIFE IS THE MAIN QUEST', 80, 518);
    var a=document.createElement('a');
    a.download='yolo-arc-victory.png'; a.href=c.toDataURL('image/png'); a.click();
    toast('Victory card downloaded.');
  }catch(e){ toast('Share failed on this browser.'); }
}
document.addEventListener('keydown', function(e){
  var modalOpen=$('modalBack')&&!$('modalBack').classList.contains('hidden');
  var tag=document.activeElement&&document.activeElement.tagName;
  if(modalOpen&&e.key==='Enter'&&tag!=='TEXTAREA'&&tag!=='BUTTON'){ e.preventDefault(); $('mSubmit').click(); }
  else if(!modalOpen&&e.code==='Space'&&tag!=='INPUT'&&tag!=='TEXTAREA'&&tag!=='SELECT'&&tag!=='BUTTON'){ e.preventDefault(); var tb=$('timerBtn'); if(tb) tb.click(); }
});

/* ---------- server-first AI pipe (same-origin /api, direct-key fallback for file://) ---------- */
function extractJSON(content){ var m=String(content||'').match(/\{[\s\S]*\}/); if(!m) throw new Error('empty'); return JSON.parse(m[0]); }
function geminiChat(msgs, temp, cb, allowPrompt){
  function direct(key, cb2, mi){
    var models=[GEMINI_MODEL,'gemini-2.5-flash-lite','gemini-2.0-flash'].filter(function(m,i,a){ return m&&a.indexOf(m)===i; });
    var m=models[mi||0]||models[0];
    fetch(GEMINI_EP,{ method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
      body:JSON.stringify({ model:m, response_format:{type:'json_object'}, temperature:temp, messages:msgs }) })
    .then(function(r){
      if(r.status===404&&(mi||0)<models.length-1){ direct(key, cb2, (mi||0)+1); return null; }
      if(!r.ok) throw new Error('HTTP '+r.status); return r.json();
    })
    .then(function(j){ if(!j) return; cb2(null, (((j.choices||[])[0]||{}).message||{}).content||''); })
    .catch(function(e){ cb2(e); });
  }
  fetch('/api/gemini',{ method:'POST', headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ messages:msgs, temperature:temp }) })
  .then(function(r){ if(r.status===503) throw new Error('needs-key'); if(!r.ok) throw new Error('api'); return r.json(); })
  .then(function(j){ if(!j||!j.content) throw new Error('api'); cb(null, j.content); })
  .catch(function(e){
    var key=getKey();
    if(!key&&allowPrompt&&(e&&e.message==='needs-key')){ key=ensureKey(); }
    if(!key&&allowPrompt&&(typeof location!=='undefined')&&location.protocol==='file:'){ key=ensureKey(); }
    if(!key){ cb(e); return; }
    direct(key, cb);
  });
}
/* ---------- GEMINI ENGINE (the only engine — local smartArc is fallback) ---------- */
var GEMINI_EP='https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
var GEMINI_MODEL='gemini-3.5-flash-lite';
var GKEY='yoloarc_gemini_key';
function getKey(){ try{ return localStorage.getItem(GKEY)||''; }catch(e){ return ''; } }
function setKey(k){ try{ localStorage.setItem(GKEY,k); }catch(e){} }
function ensureKey(){
  var k=getKey(); if(k) return k;
  k=(prompt('Paste your Gemini API key. It is stored ONLY in this browser and sent ONLY to Google:')||'').trim();
  if(!k) return '';
  setKey(k); return k;
}
$('keyBtn').onclick=function(){
  var cur=getKey();
  var k=prompt('Gemini key is '+(cur?'SET':'NOT SET')+'. Paste a new key, type CLEAR to remove it, or Cancel:', '');
  if(k===null) return;
  k=k.trim();
  if(/^clear$/i.test(k)){ try{localStorage.removeItem(GKEY);}catch(e){} toast('Key cleared — local engine will deal arcs.'); }
  else if(k){ setKey(k); toast('Key saved in this browser.'); }
};
function arcPrompt(f, goal, seed, avoid){
  var per = f.pace==='grind'?5:(f.pace==='chill'?3:4);
  var weak = weakestStat();
  return 'You are the quest engine of YOLO ARC, a real-life RPG. Design a training arc. '
  + 'GOAL: '+goal+'. DONE LOOKS LIKE: '+(f.doneLooks||'player defined')+'. DAYS: '+f.days+'. HRS PER DAY: '+f.hrs
  + '. EXPERIENCE: '+f.exp+'. PACE: '+f.pace+' ('+per+' quests per level). STAT THAT LAGS AND MUST BE TRAINED: '+weak
  + '. SEED: '+seed+'.'+(avoid?' Do not reuse this boss or these quests: '+avoid:'')
  + ' RULES: exactly 4 levels ordered easy to hard with names and one-line focus each; each quest is ["title","concrete real-world verification","stat"]; stat is only str, int or foc; every level includes at least one '+weak
  + ' quest; quests must be verifiable in real life and scale to the days and hours given; boss is one concrete final deliverable with proof.'
  + ' Reply with ONLY this JSON, no other text: {"levels":[{"t":"level name","d":"focus","qs":[["quest","verification","stat"]]}],"boss":{"title":"boss name","desc":"deliverable plus proof"}}';
}
function dealArc(f, goal, seed, avoid, done){
  var fb={ goal:goal, doneLooks:f.doneLooks, days:f.days, hrs:f.hrs, exp:f.exp||S.exp||'beginner', pace:f.pace||S.pace||'balanced', seed:seed };
  geminiChat([{role:'user', content:arcPrompt(fb, goal, seed, avoid)}], 0.7, function(err, content){
    if(!err){
      try{
        var arc=extractJSON(content);
        if(validArc(arc)){
          TRACKS._ai={ label:goal, tag:'GEMINI · '+fb.exp.toUpperCase()+' · '+fb.pace.toUpperCase(), days:String(fb.days)+' DAYS', boss:arc.boss, levels:arc.levels, domain:detectDomain(goal) };
          done('GEMINI'); return;
        }
      }catch(e){}
      addLog('Gemini miss (bad shape) — local engine covered.');
    }
    else if(err&&err.message!=='no-key'&&err.message!=='needs-key'){ addLog('Gemini miss ('+err.message+') — local engine covered.'); }
    TRACKS._ai=smartArc(fb); done('LOCAL');
  }, true);
}
function lockBtns(lock, txt){
  var gb=$('generateBtn'), rb=$('remixBtn');
  gb.disabled=lock; rb.disabled=lock;
  if(lock){ gb.textContent=txt||'ASKING GEMINI…'; }
  else { gb.textContent='START ARC →'; rb.textContent='REMIX'; }
}
/* ---------- arc lifecycle ---------- */
function readForm(){
  return {
    label:(($('customGoal').value||'').trim()||'My arc'),
    doneLooks:($('doneInput')&&$('doneInput').value||'').trim(),
    days:Math.max(7,Math.min(180, Number($('deadlineInput').value)||60)),
    hrs:$('hoursSelect').value, exp:$('expSelect').value, pace:$('paceSelect').value,
    hero:(($('heroInput').value||'').trim()||'Nameless')
  };
}
function dealQuests(n){ S.ml=S.ml||{str:0,int:0,foc:0,cleared:0,dealt:0}; S.ml.dealt=(S.ml.dealt||0)+n; }
function startArc(fromPoster){
  var f=readForm();
  S.cls=selCls; S.days=f.days; S.hrs=f.hrs; S.exp=f.exp; S.pace=f.pace;
  S.goalLabel=f.label; S.goalKey='_ai'; S.hero=f.hero;
  lockBtns(true);
  dealArc(f, f.label, S.seed||0, null, function(engine){
    S.xp=0; S.done={}; S.bossDone={}; S.ach={}; S.log=[]; S.heat={}; S.stats={str:1,int:1,foc:1}; S.daily=null; S.taunt=null;
    S.stats[CLASSES[S.cls].bonus]=3;
    S.streak=0; S.lastCheckin=new Date().toISOString(); S.createdAt=Date.now();
    dealQuests(allQ().length);
    var rate=(S.ml.cleared||0)/Math.max(1,(S.ml.dealt||0)-allQ().length);
    addLog('Arc written by '+engine+': '+S.goalLabel+' ('+S.days+'d, '+f.exp+', '+f.pace+') as '+CLASSES[S.cls].name+'.');
    if(rate>0.7&&(S.ml.dealt||0)>8) addLog('Coach note: you clear a lot — grind pace fits you.');
    else if(rate<0.3&&(S.ml.dealt||0)>8) addLog('Coach note: gentle rebuild — small quests first.');
    addLog('Boss revealed: '+track().boss.title);
    render();
    document.getElementById('arena').scrollIntoView({ behavior:'smooth' });
    toast(engine==='GEMINI' ? 'Gemini dealt your arc. Level 1 is open.' : 'Gemini unreachable — local engine dealt it. Set key via the key button.');
    lockBtns(false);
  });
}
$('generateBtn').onclick=function(){ startArc(false); };
$('remixBtn').onclick=function(){
  var f=readForm(); S.seed=(S.seed||0)+1;
  var goal=(f.label&&f.label!=='My arc')?f.label:S.goalLabel;
  var avoid=(TRACKS._ai&&TRACKS._ai.boss&&TRACKS._ai.boss.title)||'';
  lockBtns(true, 'REMIXING…');
  dealArc({ exp:f.exp||S.exp, pace:f.pace||S.pace, days:S.days, hrs:S.hrs, doneLooks:f.doneLooks }, goal, S.seed, avoid, function(engine){
    S.goalLabel=goal;
    S.done={}; S.bossDone={}; S.taunt=null;
    dealQuests(allQ().length);
    addLog('REMIX #'+S.seed+' by '+engine+' ('+TRACKS._ai.domain+', weak-link: '+weakestStat().toUpperCase()+').');
    addLog('Boss revealed: '+track().boss.title);
    render(); toast(engine==='GEMINI'?'Remixed by Gemini — fresh quests and boss.':'Remixed locally — Gemini unreachable.');
    lockBtns(false);
  });
};
var PRESETS={
  python:{ goal:'Learn Python for data analysis', done:'Clean a real CSV with Pandas, 3 charts + 200-word insight report', days:60 },
  fitness:{ goal:'Run 5K from zero', done:'GPS-tracked 5K with no walking', days:40 },
  spanish:{ goal:'Hold a 5-minute Spanish conversation', done:'5-min recording, self-intro + Q&A in Spanish', days:30 },
  biz:{ goal:'Land my first freelance client', done:'Signed client + delivered work + testimonial', days:45 }
};
function fillPreset(k){
  var p=PRESETS[k]; if(!p) return;
  $('customGoal').value=p.goal; $('doneInput').value=p.done; $('deadlineInput').value=p.days;
  document.querySelector('.cabinet').scrollIntoView({ behavior:'smooth', block:'center' });
  $('customGoal').focus(); toast('Example loaded — edit it into YOUR words, then START ARC.');
}
(function(){ var btns=document.querySelectorAll('#presetChips [data-preset]'); for(var i=0;i<btns.length;i++) btns[i].onclick=function(){ fillPreset(this.getAttribute('data-preset')); }; })();
$('burger').onclick=function(){ $('navLinks').classList.toggle('open'); };
(function(){ var as=document.querySelectorAll('#navLinks a'); for(var i=0;i<as.length;i++){ as[i].onclick=function(){ $('navLinks').classList.remove('open'); }; } })();
$('pressStart').onclick=function(){ document.querySelector('.cabinet').scrollIntoView({ behavior:'smooth', block:'center' }); $('heroInput').focus(); };
$('demoBtn').onclick=function(){ $('heroInput').value='Yamen'; setCls('knight'); fillPreset('python'); startArc(true); };
function setCls(c){ selCls=c; var btns=document.querySelectorAll('.cls'); for(var i=0;i<btns.length;i++) btns[i].classList.toggle('is-sel', btns[i].getAttribute('data-cls')===c); }
(function(){ var btns=document.querySelectorAll('.cls'); for(var i=0;i<btns.length;i++) btns[i].onclick=function(){ setCls(this.getAttribute('data-cls')); }; })();

$('checkinBtn').onclick=function(){
  var today=new Date().toDateString();
  var last=S.lastCheckin?new Date(S.lastCheckin).toDateString():null;
  if(last===today && S.streak>0 && !needsRec()){ toast('Already checked in today.'); return; }
  var y=new Date(Date.now()-864e5).toDateString();
  S.streak=(last===y||last===today)?S.streak+1:1;
  S.lastCheckin=new Date().toISOString(); S.xp+=10; bumpHeat();
  addLog('Check-in · streak '+S.streak+' (+10 XP)');
  render(); toast('Checked in. Streak: '+S.streak);
};
var dangerCb=null;
function askDanger(title, desc, cb){ $('dangerTitle').textContent=title; $('dangerDesc').textContent=desc; dangerCb=cb; $('dangerBack').classList.remove('hidden'); }
$('dangerNo').onclick=function(){ $('dangerBack').classList.add('hidden'); dangerCb=null; };
$('dangerYes').onclick=function(){ $('dangerBack').classList.add('hidden'); var f=dangerCb; dangerCb=null; if(f) f(); };
$('resetBtn').onclick=function(){ askDanger('Burn this arc?', 'XP, streaks, heat, log and boss progress go to zero. Export first if you care.', function(){ store.clear(); S=fresh(); render(); window.scrollTo({top:0,behavior:'smooth'}); }); };
$('exportBtn').onclick=function(){
  var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='yolo-arc-save.json'; a.click();
  toast('Save exported.');
};
$('importBtn').onclick=function(){ $('importFile').click(); };
$('importFile').onchange=function(e){
  var f=e.target.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){ try{ S=JSON.parse(r.result); selCls=S.cls||'knight'; setCls(selCls); render(); toast('Save imported.'); }catch(err){ toast('Bad save file.'); } };
  r.readAsText(f);
};

/* ---------- focus timer ---------- */
function fmt(s){ var m=Math.floor(s/60), r=s%60; return (m<10?'0':'')+m+':'+(r<10?'0':'')+r; }
$('timerBtn').onclick=function(){
  if(timerOn){ clearInterval(timerId); timerOn=false; $('timerBtn').textContent='Start'; return; }
  timerOn=true; $('timerBtn').textContent='Pause';
  timerId=setInterval(function(){ timerSec--; timerElapsed++; if(timerSec<=0){ clearInterval(timerId); timerOn=false; timerSec=25*60; timerElapsed=0; $('timerBtn').textContent='Start'; finishFocus(true);} $('timerTxt').textContent=fmt(timerSec); },1000);
};
$('timerDone').onclick=function(){ finishFocus(false); };
function finishFocus(auto){
  if(!auto&&timerElapsed<60){ toast('Run the timer 60s+ first — no free XP.'); return; }
  timerElapsed=0;
  S.xp+=15; bumpHeat(); S.ach.focused=1; S.stats.foc++;
  addLog('Focus session logged (+15 XP)'+(auto?' · timer completed':' · manual'));
  timerSec=25*60; $('timerTxt').textContent=fmt(timerSec);
  render(); toast('+15 XP for focused work.');
}

/* ---------- fx ---------- */
var toastT=null;
var sfxOn=true, sfxCtx=null;
function sfxUnlock(){
  try{
    var w=(typeof window!=='undefined')?window:null; if(!w) return;
    var AC=w.AudioContext||w.webkitAudioContext; if(!AC) return;
    if(!sfxCtx){ try{ sfxCtx=new AC(); }catch(e){ return; } }
    if(sfxCtx.state==='suspended'){ sfxCtx.resume(); }
  }catch(e){}
}
try{ if(typeof document!=='undefined'&&document.addEventListener){ document.addEventListener('pointerdown', sfxUnlock); } }catch(e){}
function sfx(kind){
  if(!sfxOn) return;
  try{
    sfxUnlock();
    var ctx=sfxCtx; if(!ctx||ctx.state!=='running') return;
    var seq = kind==='boss' ? [523,659,784,1046] : kind==='hit' ? [220,160] : [660,880];
    for(var i=0;i<seq.length;i++){
      (function(f,t){
        var o=ctx.createOscillator(), g=ctx.createGain();
        o.type='square'; o.frequency.value=f;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.05, ctx.currentTime+t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.12);
        o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+0.13);
      })(seq[i], i*0.11);
    }
  }catch(e){}
}
function shakeBoss(){ var b=$('bossCard'); if(!b||!b.classList) return; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
function toast(msg){
  var t=document.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:90;background:#181310;color:#F4EFE2;border:2px solid #181310;border-radius:11px;padding:11px 18px;font-size:14px;font-weight:600;box-shadow:4px 4px 0 #FF4B2D';
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); },2600);
}
function bigtoast(msg){
  var b=$('bigtoast'); b.textContent=msg; b.classList.remove('hidden');
  clearTimeout(toastT); toastT=setTimeout(function(){ b.classList.add('hidden'); },2200);
}

// marquee duplicate for loop
(function(){ var m=$('marquee'); m.textContent=(m.textContent||'').repeat(3); })();
setCls(selCls);
render();

// public bridge for cloud sync (cloud.js) — localStorage stays source of truth offline
try{
  if(typeof window!=='undefined'){
    window.YOLO={ get:function(){ return S; }, set:function(d){ S=d; selCls=S.cls||'knight'; try{ setCls(selCls); }catch(e){} render(); } };
  }
}catch(e){}
