'use strict';
/* Adapted from the starter's observer / video / panel / dot orchestration. */
(() => {
 const root=document.documentElement;
 const scenes=[...document.querySelectorAll('.scene')];
 const videos=scenes.map(s=>s.querySelector('video'));
 const panels=scenes.map(s=>s.querySelector('.panel'));
 const dotsWrap=document.getElementById('dots');
 const muteBtn=document.getElementById('muteBtn');
 const pauseBtn=document.getElementById('pauseAllBtn');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let muted=true,paused=false,active=0;
 const dots=scenes.map((section,index)=>{
   const button=document.createElement('button');button.type='button';button.className='dot';
   button.title=section.getAttribute('aria-label');button.setAttribute('aria-label',`Go to scene ${index+1}: ${section.getAttribute('aria-label')}`);
   button.addEventListener('click',()=>section.scrollIntoView({behavior:media.matches?'auto':'smooth'}));
   dotsWrap.append(button);return button;
 });
 videos.forEach(v=>{v.muted=true;if(media.matches){v.autoplay=false;v.pause();}});
 async function playVideo(index,manual=false){
   const v=videos[index];if(!v||paused||index!==active||(media.matches&&!manual))return;
   v.muted=muted;
   try{await v.play();if(paused||index!==active)v.pause();}catch(_){/* Playback can require a user gesture; the poster remains visible. */}
 }
 function activate(index){
   active=index;
   scenes.forEach((s,i)=>{
     s.classList.toggle('active',i===index);dots[i].classList.toggle('active',i===index);
     if(i===index)dots[i].setAttribute('aria-current','step');else dots[i].removeAttribute('aria-current');
     if(i!==index)videos[i].pause();
   });
   panels[index].classList.remove('pending');playVideo(index);
 }
 let scheduled=false;
 function nearest(){
   scheduled=false;
   let best=0,distance=Infinity;
   scenes.forEach((s,i)=>{const r=s.getBoundingClientRect(),d=Math.abs((r.top+r.bottom)/2-innerHeight/2);if(d<distance){distance=d;best=i;}});
   if(best!==active)activate(best);
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(nearest);}}
 // Visible baseline. Only opt into pending after both observers exist.
 if('IntersectionObserver' in window){
   try{
     const sceneIO=new IntersectionObserver(schedule,{threshold:[0,.3,.5,.7,1]});
     const panelIO=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pending');panelIO.unobserve(e.target);}}),{threshold:.15});
     scenes.forEach(s=>sceneIO.observe(s));
     root.classList.add('enhanced');
     panels.forEach(p=>{panelIO.observe(p);if(p.getBoundingClientRect().top>innerHeight&&!media.matches)p.classList.add('pending');});
   }catch(_){panels.forEach(p=>p.classList.remove('pending'));}
 }
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
 panels.forEach(p=>p.addEventListener('focusin',()=>p.classList.remove('pending')));
 muteBtn.addEventListener('click',()=>{
   muted=!muted;videos.forEach(v=>v.muted=muted);
   muteBtn.textContent=muted?'Muted':'Sound On';muteBtn.setAttribute('aria-pressed',String(muted));
   document.getElementById('storyStatus').textContent=muted?'Story sound muted.':'Story sound on.';
   playVideo(active);
 });
 pauseBtn.addEventListener('click',()=>{
   paused=!paused;root.classList.toggle('paused',paused);pauseBtn.textContent=paused?'Resume':'Pause All';pauseBtn.setAttribute('aria-pressed',String(paused));
   if(paused){videos.forEach(v=>v.pause());panels.forEach(p=>p.classList.remove('pending'));}else playVideo(active,true);
 });
 const manualButtons=scenes.map((s,index)=>{
   const b=document.createElement('button');b.type='button';b.className='btn scene-play';b.textContent='Play scene';b.hidden=!media.matches;
   b.addEventListener('click',()=>{if(paused){document.getElementById('storyStatus').textContent='Select Resume first to play the scene.';return;}if(videos[index].paused){active=index;playVideo(index,true);}else videos[index].pause();});
   videos[index].addEventListener('play',()=>b.textContent='Pause scene');videos[index].addEventListener('pause',()=>b.textContent='Play scene');s.querySelector('.panel').append(b);return b;
 });
 media.addEventListener('change',()=>{
   if(media.matches){videos.forEach(v=>{v.autoplay=false;v.pause();});panels.forEach(p=>p.classList.remove('pending'));}
   manualButtons.forEach(b=>b.hidden=!media.matches);
   if(!media.matches)playVideo(active);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause());else playVideo(active);});
 activate(0);nearest();
})();
