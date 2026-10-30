'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const board = $('#board'), ctx = board.getContext('2d');
  const audio = $('#soundtrack'), config = window.BWBWBW;
  const size = 18, cell = 16;
  const heartPixels = ['01100110','11111111','11111111','01111110','00111100','00011000'];
  const directions = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  let snake, direction, queued, food, state, lastStep = 0, score = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let musicEnabled = true, track = 0, letterTimer, typingTimer;
  let particles = [], glowUntil = 0;
  let typingAudio = null;
  let responseTimer, floodTimer, sinkingTimer;
  const effectTimers=new Set();
  let motionListening=false, motionFrame=null, waterAngle=0;
  let touchStart = null;
  ctx.imageSmoothingEnabled = false;
  function heart(x,y,scale,color) {
    ctx.fillStyle = color;
    heartPixels.forEach((row,dy) => [...row].forEach((pixel,dx) => {
      if(pixel === '1') ctx.fillRect(x+dx*scale,y+dy*scale,scale,scale);
    }));
  }
  function draw(now = performance.now()) {
    ctx.fillStyle = '#ffe5ee';ctx.fillRect(0,0,288,288);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
      ctx.fillStyle = (x+y)%2 ? '#ffe2ec' : '#ffe7ef';
      ctx.fillRect(x*cell,y*cell,cell,cell);
    }
    if(food) {
      if(food.special) {
        ctx.fillStyle='#fff1db';ctx.fillRect((food.x-1)*cell,food.y*cell,48,16);
        const letters={Z:['11111','00001','00010','00100','01000','10000','11111'],Y:['10001','10001','01010','00100','00100','00100','00100']};
        for(const [letter,offset] of [['Z',-1],['Y',1]]) {
          ctx.fillStyle='#95365e';
          letters[letter].forEach((row,dy)=>[...row].forEach((pixel,dx)=>{
            if(pixel==='1')ctx.fillRect((food.x+offset)*cell+3+dx*2,food.y*cell+1+dy*2,2,2);
          }));
        }
      }
      heart(food.x*cell,food.y*cell+2,2,'#ba3d70');
      ctx.fillStyle = '#ffb8d5';ctx.fillRect(food.x*cell+3,food.y*cell+4,3,2);
    }
    snake.forEach((part,i) => {
      const x=part.x*cell,y=part.y*cell;
      const glowing = now < glowUntil;
      ctx.fillStyle = glowing ? (i===0?'#e984b1':'#f49fc4') : (i===0?'#a94070':'#c65a88');ctx.fillRect(x+1,y+1,14,14);
      ctx.fillStyle = '#e78eaf';ctx.fillRect(x+3,y+2,10,3);
      ctx.fillStyle = '#ac3d6d';ctx.fillRect(x+3,y+13,10,2);
      if(i===0) {
        const d=direction;
        const eyes=d.x ? [[x+(d.x>0?10:3),y+4],[x+(d.x>0?10:3),y+10]] : [[x+4,y+(d.y>0?10:3)],[x+10,y+(d.y>0?10:3)]];
        eyes.forEach(([ex,ey])=>{ctx.fillStyle='#fff1f6';ctx.fillRect(ex-1,ey-1,4,4);ctx.fillStyle='#52243b';ctx.fillRect(ex,ey,2,2);});
        // Tiny pixel ribbon, kept above the eyes.
        ctx.fillStyle='#8a3157';ctx.fillRect(x+1,y-1,4,5);ctx.fillRect(x+8,y-1,4,5);ctx.fillRect(x+5,y,3,3);
        ctx.fillStyle='#f98bb9';ctx.fillRect(x+2,y,2,3);ctx.fillRect(x+9,y,2,3);
        ctx.fillStyle='#ffe0ee';ctx.fillRect(x+5,y+1,3,2);
      }
    });
    particles = particles.filter(p => now-p.born < p.life);
    for(const particle of particles) {
      const age=(now-particle.born)/1000;
      ctx.globalAlpha=Math.max(0,1-(now-particle.born)/particle.life);
      heart(Math.round(particle.x+particle.vx*age),Math.round(particle.y+particle.vy*age+45*age*age),1,particle.color);
    }
    ctx.globalAlpha=1;
  }
  function heartBurst(position) {
    if(reducedMotion)return;
    const now=performance.now();
    glowUntil=now+450;
    for(let i=0;i<8;i++) {
      const angle=i*Math.PI/4;
      particles.push({x:position.x*cell+4,y:position.y*cell+4,vx:Math.cos(angle)*36,vy:Math.sin(angle)*36-25,born:now,life:700,color:i%2?'#d2548a':'#ff98c0'});
    }
  }
  function newFood(special=false) {
    const empty=[];
    for(let y=0;y<size;y++) for(let x=special?1:0;x<(special?size-1:size);x++) {
      if(!snake.some(p=>p.y===y&&Math.abs(p.x-x)<=(special?1:0)))empty.push({x,y,special});
    }
    return empty.length ? empty[Math.floor(Math.random()*empty.length)] : null;
  }
  function reset() {
    clearTimeout(letterTimer);
    clearTimeout(typingTimer);
    clearResponse();
    particles=[];glowUntil=0;
    snake=[{x:7,y:9},{x:6,y:9},{x:5,y:9},{x:4,y:9}];
    direction={...directions.right};queued=null;score=0;
    food={x:11,y:9};state='ready';
    $('#letter-layer').hidden=true;$('#letter-layer').classList.remove('open');
    $('#open-envelope').disabled=true;
    $('#letter-typed').textContent='';
    $('.message-space').textContent=config.message;
    $('#letter-accessible').textContent=config.message;
    $('#letter-heading').textContent=config.heading;
    $('#letter-paper').scrollTop=0;
    $('.game').inert=false;
    $('#start-screen').hidden=false;$('#pause').hidden=true;
    $('#start').setAttribute('aria-label','Oyunu başlat');
    $('#start use').setAttribute('href','#play');
    draw();
  }
  function startMusic() {
    if(!musicEnabled)return;
    if(!audio.src)audio.src=config.songs[track].src;
    audio.volume=.45;
    audio.play().catch(()=>{
      musicEnabled=false;
      updateMusicButton();
    });
  }
  function updateMusicButton() {
    $('#music').setAttribute('aria-pressed',String(musicEnabled));
    $('#music').setAttribute('aria-label',musicEnabled?'Müziği kapat':'Müziği aç');
    $('#music use').setAttribute('href',musicEnabled?'#note':'#mute');
  }
  function start() {
    if(state==='over')return;
    if(state==='crashed')reset();
    state='playing';lastStep=performance.now();
    $('#start-screen').hidden=true;$('#pause').hidden=false;
    startMusic();
  }
  function pause() {
    if(state!=='playing')return;
    state='paused';queued=null;audio.pause();
    $('#start-screen').hidden=false;$('#pause').hidden=true;
    $('#start').setAttribute('aria-label','Oyuna devam et');
  }
  function turn(name) {
    if(state==='over')return;
    const next=directions[name];
    if(!next)return;
    if(state==='ready'||state==='paused'||state==='crashed')start();
    if(queued||next.x===-direction.x&&next.y===-direction.y)return;
    queued={...next};
  }
  function endGame() {
    state='over';queued=null;
    $('#pause').hidden=true;
    $('#letter-layer').hidden=false;
    $('.game').inert=true;
    letterTimer=setTimeout(()=>{
      $('#open-envelope').disabled=false;
      $('#open-envelope').focus({preventScroll:true});
    },reducedMotion?0:1200);
  }
  function lose() {
    state='crashed';queued=null;audio.pause();
    $('#pause').hidden=true;$('#start-screen').hidden=false;
    $('#start').setAttribute('aria-label','Yeniden dene');
    $('#start use').setAttribute('href','#retry');
    $('#start').focus({preventScroll:true});
  }
  function finishTyping() {
    clearTimeout(typingTimer);
    $('#letter-typed').textContent=config.message;
  }
  function prepareTypingSound() {
    if(!musicEnabled)return;
    try {
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return;
      if(!typingAudio)typingAudio=new AudioContext();
      if(typingAudio.state==='suspended')typingAudio.resume().catch(()=>{});
    }catch { typingAudio=null; }
  }
  function typingSound(character,index) {
    if(!musicEnabled||document.hidden||!typingAudio||typingAudio.state!=='running'||!/[\p{L}\p{N}]/u.test(character))return;
    try {
      const now=typingAudio.currentTime;
      const note=typingAudio.createOscillator(),volume=typingAudio.createGain();
      note.type='triangle';
      const pitch=[880,1046.5,1174.7,1046.5][index%4];
      note.frequency.setValueAtTime(pitch,now);
      note.frequency.exponentialRampToValueAtTime(pitch*1.08,now+.035);
      volume.gain.setValueAtTime(.0001,now);
      volume.gain.exponentialRampToValueAtTime(.022,now+.005);
      volume.gain.exponentialRampToValueAtTime(.0001,now+.048);
      note.connect(volume);volume.connect(typingAudio.destination);
      note.onended=()=>{note.disconnect();volume.disconnect();};
      note.start(now);note.stop(now+.05);
    }catch { /* Text keeps working if audio is unavailable. */ }
  }
  function openLetter() {
    if($('#letter-layer').classList.contains('open')||$('#open-envelope').disabled)return;
    $('#letter-layer').classList.add('open');
    $('#letter-paper').focus({preventScroll:true});
    if(reducedMotion){finishTyping();return;}
    prepareTypingSound();
    const characters=Array.from(config.message);
    let count=0;
    function typeNext() {
      count=Math.min(characters.length,count+(characters.length>600?3:1));
      $('#letter-typed').textContent=characters.slice(0,count).join('');
      typingSound(characters[count-1],count-1);
      if(count<characters.length)typingTimer=setTimeout(typeNext,42);
    }
    typingTimer=setTimeout(typeNext,350);
  }
  function clearResponse() {
    clearInterval(responseTimer);clearTimeout(floodTimer);
    clearTimeout(sinkingTimer);
    effectTimers.forEach(clearTimeout);effectTimers.clear();
    $('#response-effects').replaceChildren();
    $('#letter-layer').classList.remove('happy','crying','flooded','sinking');
    document.querySelectorAll('.couple-bunny use').forEach(use=>use.setAttribute('href','#pixel-bunny'));
    $('#forgive').setAttribute('aria-pressed','false');
    $('#not-forgive').setAttribute('aria-pressed','false');
    window.removeEventListener('deviceorientation',tiltWater);
    motionListening=false;
    if(motionFrame!==null)cancelAnimationFrame(motionFrame);
    motionFrame=null;waterAngle=0;
    $('#water').style.setProperty('--water-tilt','0deg');
  }
  function tiltWater(event) {
    if(typeof event.gamma!=='number'||!Number.isFinite(event.gamma))return;
    let roll=event.gamma;
    const angle=window.screen?.orientation?.angle??window.orientation??0;
    if(Math.abs(angle)===90&&typeof event.beta==='number'&&Number.isFinite(event.beta))roll=event.beta*(angle===90?-1:1);
    waterAngle=Math.max(-14,Math.min(14,-roll*.45));
    if(motionFrame!==null)return;
    motionFrame=requestAnimationFrame(()=>{
      $('#water').style.setProperty('--water-tilt',`${waterAngle}deg`);
      motionFrame=null;
    });
  }
  function enableWaterTilt() {
    const Orientation=window.DeviceOrientationEvent;
    if(!Orientation)return;
    function listen() {
      if(motionListening||!$('#letter-layer').classList.contains('crying'))return;
      window.addEventListener('deviceorientation',tiltWater,{passive:true});motionListening=true;
    }
    try {
      if(typeof Orientation.requestPermission==='function') {
        Orientation.requestPermission().then(permission=>{if(permission==='granted')listen();}).catch(()=>{});
      }else listen();
    }catch { /* Flat water remains available when motion is not permitted. */ }
  }
  function effectNode(className) {
    const node=document.createElement('span');node.className=className;
    $('#response-effects').append(node);
    const timer=setTimeout(()=>{node.remove();effectTimers.delete(timer);},5000);
    effectTimers.add(timer);return node;
  }
  function celebrateLove() {
    clearResponse();finishTyping();
    $('#letter-layer').classList.add('happy');
    document.querySelectorAll('.couple-bunny use').forEach((use,index)=>use.setAttribute('href',index===0?'#hug-bunny-left':'#hug-bunny-right'));
    $('#forgive').setAttribute('aria-pressed','true');
    $('#letter-paper').scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'});
    const count=reducedMotion?16:80;
    for(let i=0;i<count;i++) {
      const node=effectNode('love-burst');
      const side=i%4;
      const x=side===0?0:side===1?innerWidth:Math.random()*innerWidth;
      const y=side===2?0:side===3?innerHeight:Math.random()*innerHeight;
      node.style.left=`${x}px`;node.style.top=`${y}px`;
      node.style.setProperty('--dx',`${innerWidth*(.15+Math.random()*.7)-x}px`);
      node.style.setProperty('--dy',`${innerHeight*(.1+Math.random()*.8)-y}px`);
      node.style.setProperty('--delay',`${Math.random()*.9}s`);
      node.style.setProperty('--heart-color',['#f08bb8','#e64c83','#ffb7d7','#d5416f'][i%4]);
      node.style.width=`${16+Math.random()*28}px`;
      node.innerHTML='<svg viewBox="0 0 9 8"><use href="#heart"/></svg>';
    }
  }
  function shedTears() {
    if(document.hidden)return;
    const paperRect=$('#letter-paper').getBoundingClientRect();
    document.querySelectorAll('.couple-bunny').forEach(bunny=>{
      const rect=bunny.getBoundingClientRect();
      if(rect.bottom<paperRect.top||rect.top>paperRect.bottom)return;
      for(const eye of [8,16]) {
        const drop=effectNode('bunny-tear');
        const y=rect.top+rect.height*16/28;
        drop.style.left=`${rect.left+rect.width*eye/24}px`;drop.style.top=`${y}px`;
        drop.style.setProperty('--fall',`${innerHeight-y+12}px`);
      }
    });
  }
  function sadBunnies() {
    clearResponse();finishTyping();
    $('#letter-layer').classList.add('crying');
    enableWaterTilt();
    $('#not-forgive').setAttribute('aria-pressed','true');
    document.querySelectorAll('.couple-bunny use').forEach(use=>use.setAttribute('href','#sad-bunny'));
    $('#letter-paper').scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'});
    if(reducedMotion){$('#letter-layer').classList.add('flooded');return;}
    floodTimer=setTimeout(()=>{
      shedTears();responseTimer=setInterval(shedTears,420);
      $('#letter-layer').classList.add('flooded');
      sinkingTimer=setTimeout(sinkBunnies,8500);
    },650);
  }
  function sinkBunnies() {
    if(!$('#letter-layer').classList.contains('crying'))return;
    clearInterval(responseTimer);
    const surface=Math.max(innerHeight*.63,Math.min(innerHeight*.9,$('#water').getBoundingClientRect().top+20));
    document.querySelectorAll('.couple-bunny').forEach((bunny,index)=>{
      const rect=bunny.getBoundingClientRect();
      const x=rect.left,y=Math.max(20,rect.top);
      const falling=effectNode('sinking-bunny');
      falling.style.left=`${x}px`;falling.style.top=`${y}px`;
      falling.style.width=`${rect.width}px`;falling.style.height=`${rect.height}px`;
      falling.style.setProperty('--sink-x',`${index===0?-24:24}px`);
      falling.style.setProperty('--surface-y',`${Math.max(0,surface-y)}px`);
      falling.style.setProperty('--sink-y',`${innerHeight*.98-y}px`);
      falling.style.setProperty('--sink-turn',`${index===0?-75:75}deg`);
      if(index===1)falling.style.setProperty('--bunny-coat','#f4e5ff');
      falling.innerHTML='<svg viewBox="0 0 24 28"><use href="#sad-bunny"/></svg>';
    });
    $('#letter-layer').classList.add('sinking');
  }
  function step() {
    if(queued){direction=queued;queued=null;}
    const head={x:snake[0].x+direction.x,y:snake[0].y+direction.y};
    const eating=food&&head.y===food.y&&Math.abs(head.x-food.x)<=(food.special?1:0);
    const body=eating?snake:snake.slice(0,-1);
    if(head.x<0||head.y<0||head.x>=size||head.y>=size||body.some(p=>p.x===head.x&&p.y===head.y)){lose();return;}
    snake.unshift(head);
    if(eating){
      heartBurst(food);
      if(food.special){food=null;draw();endGame();return;}
      score++;food=newFood(score>=10);
    }else snake.pop();
    draw();
    if(!food)lose();
  }
  function frame(now) {
    if(state==='playing'&&now-lastStep>=Math.max(190,330-score*3)) {lastStep=now;step();}
    if(particles.length||now<glowUntil)draw(now);
    requestAnimationFrame(frame);
  }
  $('#start').addEventListener('click',start);
  $('#pause').addEventListener('click',pause);
  $('#replay').addEventListener('click',()=>{reset();$('#start').focus({preventScroll:true});});
  $('#open-envelope').addEventListener('click',openLetter);
  $('#letter-message').addEventListener('click',finishTyping);
  $('#show-all').addEventListener('click',finishTyping);
  $('#forgive').addEventListener('click',celebrateLove);
  $('#not-forgive').addEventListener('click',sadBunnies);
  document.querySelectorAll('[data-direction]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();turn(button.dataset.direction);});
    button.addEventListener('click',event=>{if(event.detail===0)turn(button.dataset.direction);});
  });
  document.addEventListener('keydown',event=>{
    if(state==='over'){
      if(event.key==='Tab') {
        const open=$('#letter-layer').classList.contains('open');
        const controls=open?[...$('#letter-paper').querySelectorAll('button:not(:disabled)')]:[$('#open-envelope')];
        const index=controls.indexOf(document.activeElement);
        event.preventDefault();controls[(index+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();
      }
      return;
    }
    const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
    if(keys[event.key]){event.preventDefault();turn(keys[event.key]);}
    if(event.code==='Space'&&event.target===document.body){event.preventDefault();state==='playing'?pause():start();}
  });
  board.addEventListener('pointerdown',event=>{touchStart={x:event.clientX,y:event.clientY};board.setPointerCapture(event.pointerId);});
  board.addEventListener('pointermove',event=>{
    if(!touchStart)return;
    const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<15)return;
    turn(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
    touchStart={x:event.clientX,y:event.clientY};
  });
  board.addEventListener('pointerup',()=>{touchStart=null;});
  board.addEventListener('pointercancel',()=>{touchStart=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio.pause();}});
  $('#music').addEventListener('click',()=>{musicEnabled=!musicEnabled;updateMusicButton();if(musicEnabled)startMusic();else audio.pause();});
  $('#track').addEventListener('click',()=>{
    track=(track+1)%config.songs.length;
    audio.src=config.songs[track].src;
    $('#track').setAttribute('aria-label',`${config.songs[(track+1)%config.songs.length].name} şarkısına geç`);
    if(musicEnabled)startMusic();
  });
  audio.addEventListener('error',()=>{musicEnabled=false;updateMusicButton();});
  reset();requestAnimationFrame(frame);
})();
