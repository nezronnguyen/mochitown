/* Mochi Town cinematic motion engine. Canvas makes genuine moving aurora, stars and meteor trails.
   Decorative only: does not intercept scrolling, buttons, forms, links, Discord or LAUNCHER requests. */
(() => {
 'use strict';
 const start = () => {
   const reduce = matchMedia('(prefers-reduced-motion: reduce)');
   const progress = document.querySelector('.scroll-progress');
   let scrollFrame = 0;
   function updateProgress() {
     scrollFrame = 0;
     const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
     if (progress) progress.style.transform = `scaleX(${Math.min(1, scrollY / max)})`;
     document.documentElement.style.setProperty('--gummy-scroll-shift', `${Math.min(45,scrollY * .04)}px`);
   }
   window.addEventListener('scroll', () => {if (!scrollFrame) scrollFrame = requestAnimationFrame(updateProgress);}, {passive:true});
   window.addEventListener('resize', updateProgress, {passive:true});
   updateProgress();

   // Respect OS reduced motion, while always leaving all actual website functions intact.
   if (reduce.matches) return;
   document.querySelectorAll('.highlights-grid,.features-grid,.news-grid,.join-steps,.events-grid,.testimonial-grid').forEach(grid => {
     [...grid.children].forEach((child,i) => {if(child.classList.contains('reveal')) child.style.setProperty('--reveal-delay', `${(i%5)*65}ms`);});
   });

   // Pointer tilt is opt-in for existing cards and does not steal clicks.
   if (matchMedia('(pointer:fine)').matches) {
     document.querySelectorAll('.holo-card,.highlight-card,.feature-card,.news-card,.step-card,.event-card').forEach(card => {
       let frame = 0;
       card.addEventListener('pointermove', event => {
         if(frame) return;
         const rect = card.getBoundingClientRect();
         const x = (event.clientX - rect.left)/Math.max(1,rect.width) - .5;
         const y = (event.clientY - rect.top)/Math.max(1,rect.height) - .5;
         frame = requestAnimationFrame(() => {
           card.style.setProperty('--tilt-x', `${(-y*4).toFixed(2)}deg`);
           card.style.setProperty('--tilt-y', `${(x*4).toFixed(2)}deg`);
           frame=0;
         });
       }, {passive:true});
       card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
     });
   }

   // Night-sky renderer. Single canvas = no 180 independent DOM animations fighting CSS.
   const canvas = document.createElement('canvas');
   canvas.id = 'cinematicCanvas';
   canvas.setAttribute('aria-hidden','true');
   document.body.appendChild(canvas);
   const ctx = canvas.getContext('2d',{alpha:true,desynchronized:true});
   if (!ctx) return;
   let W=0,H=0,dpr=1,frameId=0,previous=0,lastScroll=scrollY,burst=0;
   let mouse={x:-1000,y:-1000},stars=[],meteors=[],sparks=[];
   const random=(a,b)=>a+Math.random()*(b-a);
   function resize(){
     dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;
     canvas.width=Math.ceil(W*dpr);canvas.height=Math.ceil(H*dpr);
     ctx.setTransform(dpr,0,0,dpr,0,0);
     stars=Array.from({length:W<600?140:310},()=>({x:random(0,W),y:random(0,H),r:random(.45,2.2),a:random(.25,.9),p:random(0,6.28),v:random(.1,.7),h:Math.random()>.78?278:329}));
   }
   function meteor(force=false){
     const angle=random(.46,1.02),speed=random(7,17)*(force?1.2:1);
     meteors.push({x:random(-W*.2,W*1.04),y:random(-H*.3,H*.55),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,length:random(80,260),age:0,life:random(35,75),width:random(1.1,2.9),hue:Math.random()>.28?325:272});
   }
   const bloom=(x,y,r,col,alpha=1)=>{
     const g=ctx.createRadialGradient(x,y,0,x,y,r);
     g.addColorStop(0,`hsla(${col},90%,68%,${.22*alpha})`);
     g.addColorStop(.38,`hsla(${col},92%,51%,${.10*alpha})`);
     g.addColorStop(1,`hsla(${col},92%,50%,0)`);
     ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
   };
   function draw(t){
     frameId=requestAnimationFrame(draw);
     if(document.hidden){previous=t;return;}
     const dt=Math.min(2,(t-previous||16)/16.66);previous=t;
     ctx.clearRect(0,0,W,H);
     const phase=t*.0001;
     ctx.globalCompositeOperation='screen';
     // Moving aurora clouds, brighter on scroll.
     const scrollBoost=Math.min(.8,burst*.018);
     bloom(W*(.18+Math.sin(phase*.65)*.13),H*(.2+Math.cos(phase*.53)*.16),Math.max(W,H)*.55,328,1.4+scrollBoost);
     bloom(W*(.76+Math.cos(phase*.58)*.15),H*(.72+Math.sin(phase*.9)*.13),Math.max(W,H)*.5,279,1.2+scrollBoost);
     bloom(W*(.56+Math.sin(phase*.31)*.13),H*(.46+Math.cos(phase*.47)*.12),Math.max(W,H)*.36,340,.95+scrollBoost);
     // Pulsing diagonal light bands visibly sweep across the background.
     ctx.save();ctx.translate(W/2,H/2);ctx.rotate(-.36+Math.sin(phase*.24)*.18);
     for(let j=0;j<4;j++){
       const x=((t*.025+j*W*.5)%(W*2))-W;
       const g=ctx.createLinearGradient(x-85,0,x+85,0);
       g.addColorStop(0,'rgba(255,90,196,0)');g.addColorStop(.5,'rgba(255,90,196,.045)');g.addColorStop(1,'rgba(255,90,196,0)');
       ctx.fillStyle=g;ctx.fillRect(x-85,-H*2,170,H*4);
     }ctx.restore();
     // Dense, moving, twinkling starfield with mouse parallax.
     for(const star of stars){
       star.p+=.018*dt; star.y+=star.v*dt; star.x+=Math.sin(phase+star.p)*.08*dt;
       if(star.y>H+8){star.y=-8;star.x=random(0,W)}
       const x=star.x+(mouse.x-W/2)*star.r*.016, y=star.y+(mouse.y-H/2)*star.r*.012;
       const a=star.a*(.7+.3*Math.sin(star.p));
       ctx.fillStyle=`hsla(${star.h},95%,87%,${Math.max(.1,a)})`;
       ctx.beginPath();ctx.arc(x,y,star.r*(.85+.2*Math.sin(star.p)),0,6.283);ctx.fill();
       if(star.r>1.8&&Math.sin(star.p)>.6){ctx.strokeStyle=`rgba(255,174,227,${a*.55})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x+6,y);ctx.moveTo(x,y-6);ctx.lineTo(x,y+6);ctx.stroke();}
     }
     // Shooting stars with long straight neon trails.
     if(Math.random()<.034*dt+Math.min(.025,burst*.0006))meteor();
     for(let i=meteors.length-1;i>=0;i--){
       const m=meteors[i];m.x+=m.vx*dt;m.y+=m.vy*dt;m.age+=dt;
       if(m.age>m.life||m.y>H+260){meteors.splice(i,1);continue;}
       const tail=Math.min(1,m.age/12)*Math.min(1,(m.life-m.age)/12),len=m.length;
       const dx=m.vx/Math.hypot(m.vx,m.vy)*len,dy=m.vy/Math.hypot(m.vx,m.vy)*len;
       const g=ctx.createLinearGradient(m.x-dx,m.y-dy,m.x,m.y);
       g.addColorStop(0,`hsla(${m.hue},100%,68%,0)`);g.addColorStop(.7,`hsla(${m.hue},100%,72%,${.25*tail})`);g.addColorStop(1,`rgba(255,240,252,${.96*tail})`);
       ctx.strokeStyle=g;ctx.lineWidth=m.width*tail;ctx.shadowColor=`hsl(${m.hue},100%,68%)`;ctx.shadowBlur=14;
       ctx.beginPath();ctx.moveTo(m.x-dx,m.y-dy);ctx.lineTo(m.x,m.y);ctx.stroke();ctx.shadowBlur=0;
     }
     // Visible tiny sparks following pointer movement and mouse clicks.
     for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.985;s.vy*=.985;s.life-=dt;
       if(s.life<=0){sparks.splice(i,1);continue;}
       ctx.fillStyle=`rgba(255,${Math.round(s.g)},220,${Math.min(1,s.life/22)})`;
       ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill();}
     ctx.globalCompositeOperation='source-over';burst*=.91;
   }
   function spark(x,y,n){for(let i=0;i<n;i++)sparks.push({x,y,vx:random(-4,4),vy:random(-4,4),life:random(15,35),r:random(.8,2.4),g:random(120,220)});if(sparks.length>220)sparks.splice(0,sparks.length-220);}
   window.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;if(Math.random()<.55)spark(e.clientX,e.clientY,1);},{passive:true});
   window.addEventListener('pointerdown',e=>spark(e.clientX,e.clientY,24),{passive:true});
   window.addEventListener('scroll',()=>{const change=Math.abs(scrollY-lastScroll);lastScroll=scrollY;burst=Math.min(70,burst+change*.28);if(change>45){meteor(true);meteor(true)}},{passive:true});
   window.addEventListener('resize',resize,{passive:true});
   resize();for(let i=0;i<6;i++)meteor(true);frameId=requestAnimationFrame(draw);
   reduce.addEventListener?.('change',e=>{if(e.matches){cancelAnimationFrame(frameId);canvas.remove();}});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
