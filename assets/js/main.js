'use strict';

// Put the most vacancy-relevant case studies first in both the visual and DOM order.
(function(){
  document.querySelectorAll('main > section').forEach(function(section){
    var cases=[].slice.call(section.querySelectorAll(':scope > .case[data-priority]'));
    cases.sort(function(a,b){return Number(a.dataset.priority)-Number(b.dataset.priority)});
    cases.forEach(function(item){section.appendChild(item)});
  });
})();

// Gallery, responsive images and lightbox controls.
(function(){
  var shots=[].slice.call(document.querySelectorAll('.shot'));
  var imageResizeObserver='ResizeObserver' in window?new ResizeObserver(function(entries){
    entries.forEach(function(entry){
      var img=entry.target.querySelector('img');
      if(img) img.sizes=Math.ceil(entry.contentRect.width||600)+'px';
    });
  }):null;
  shots.forEach(function(b,i){
    var img=document.createElement('img'), k=b.dataset.src.replace(/^img\//,'').replace(/\.webp$/,''), set=[];
    (SIZES[k]||[]).forEach(function(w){set.push('img/s/'+k+'-'+w+'.webp '+w+'w');});
    if(set.length){set.push(b.dataset.src+' '+FULL[k]+'w'); img.srcset=set.join(', '); img.sizes=Math.ceil(b.getBoundingClientRect().width||600)+'px';}
    if(b.dataset.c) b.style.backgroundColor=b.dataset.c;
    img.addEventListener('load',function(){img.classList.add('ld')}); img.addEventListener('error',function(){img.classList.add('ld')});
    img.src=b.dataset.src; img.alt=b.dataset.alt||''; img.loading=i<3?'eager':'lazy'; img.decoding='async';
    b.appendChild(img); if(img.complete&&img.naturalWidth) img.classList.add('ld');
    if(imageResizeObserver) imageResizeObserver.observe(b);
    b.addEventListener('click',function(){open(i)});
  });
  var lb=document.getElementById('lb'), stage=document.getElementById('lbStage'), im=document.getElementById('lbImg'),
      cnt=document.getElementById('lbCount'), zBtn=document.getElementById('lbZoom'), cur=0, last=null;
  function show(i){
    cur=(i+shots.length)%shots.length; setZoom(false);
    im.src=shots[cur].dataset.src; im.alt=shots[cur].dataset.alt||''; cnt.textContent=(cur+1)+' / '+shots.length;
    [cur+1,cur-1].forEach(function(k){var p=new Image();p.src=shots[(k+shots.length)%shots.length].dataset.src;});
  }
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function flipFrom(el,dir){ // dir 'in': thumb -> full; 'out': full -> thumb
    var t=el.getBoundingClientRect(), f=im.getBoundingClientRect();
    if(!t.width||!f.width) return false;
    var sc=t.width/f.width, dx=(t.left+t.width/2)-(f.left+f.width/2), dy=(t.top+t.height/2)-(f.top+f.height/2);
    var from='translate('+dx+'px,'+dy+'px) scale('+sc+')';
    im.classList.remove('flip');
    if(dir==='in'){ im.style.transform=from; im.style.borderRadius=(24/sc)+'px'; im.getBoundingClientRect(); im.classList.add('flip'); im.style.transform=''; im.style.borderRadius=''; }
    else { im.classList.add('flip'); im.style.transform=from; im.style.borderRadius=(24/sc)+'px'; }
    return true;
  }
  function open(i,from){
    last=document.activeElement; var b=shots[i], th=(from||b).querySelector('img');
    show(i);
    if(th&&th.currentSrc&&!RM){ // start from the already-loaded thumbnail, swap to full size when ready
      var full=im.src; im.src=th.currentSrc; var pre=new Image(); pre.onload=function(){ if(shots[cur]===b) im.src=full; }; pre.src=full;
    }
    lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    if(!RM) requestAnimationFrame(function(){ flipFrom(from||b,'in'); });
    document.getElementById('lbClose').focus();
  }
  function close(){
    var b=shots[cur], zoomed=lb.classList.contains('zoomed');
    var r=b.getBoundingClientRect(), vis=r.bottom>0&&r.top<innerHeight;
    function done(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; setZoom(false);
      setTimeout(function(){ im.classList.remove('flip'); im.style.transform=''; im.style.borderRadius=''; },220); if(last)last.focus({preventScroll:true}); }
    if(!RM&&!zoomed&&vis&&flipFrom(b,'out')){ lb.classList.add('closing'); setTimeout(function(){ lb.classList.remove('closing'); done(); },300); }
    else done();
  }
  function setZoom(on,e){
    var was=lb.classList.contains('zoomed'); lb.classList.toggle('zoomed',on);
    zBtn.setAttribute('aria-label',on?'Уменьшить':'Увеличить');
    if(on&&!was&&e){ // keep clicked point under cursor
      var r=im.getBoundingClientRect(); var fx=(e.clientX-r.left)/r.width, fy=(e.clientY-r.top)/r.height;
      requestAnimationFrame(function(){stage.scrollLeft=im.offsetWidth*fx-stage.clientWidth/2; stage.scrollTop=im.offsetHeight*fy-stage.clientHeight/2;});
    } else if(on&&!was){requestAnimationFrame(function(){stage.scrollLeft=(im.offsetWidth-stage.clientWidth)/2; stage.scrollTop=(im.offsetHeight-stage.clientHeight)/2;});}
  }
  im.addEventListener('click',function(e){e.stopPropagation(); setZoom(!lb.classList.contains('zoomed'),e);});
  zBtn.onclick=function(){setZoom(!lb.classList.contains('zoomed'));};
  stage.addEventListener('click',function(e){if(e.target===stage&&!lb.classList.contains('zoomed'))close();});
  document.getElementById('lbClose').onclick=close;
  document.getElementById('lbPrev').onclick=function(){show(cur-1)};
  window.tasyaOpen=function(src,from){ for(var k=0;k<shots.length;k++){ if(shots[k].dataset.src===src){ open(k,from); return; } } };
  document.getElementById('lbNext').onclick=function(){show(cur+1)};
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open'))return;
    if(e.key==='Tab'){
      var controls=[].slice.call(lb.querySelectorAll('button:not([disabled])')),
          first=controls[0], lastControl=controls[controls.length-1], active=document.activeElement;
      if(!lb.contains(active)){e.preventDefault();first.focus();}
      else if(e.shiftKey&&active===first){e.preventDefault();lastControl.focus();}
      else if(!e.shiftKey&&active===lastControl){e.preventDefault();first.focus();}
      return;
    }
    if(e.key==='Escape')close(); else if(e.key==='ArrowLeft')show(cur-1); else if(e.key==='ArrowRight')show(cur+1);
  });
  var sx=null,sy=null;
  stage.addEventListener('touchstart',function(e){if(e.touches.length===1&&!lb.classList.contains('zoomed')){sx=e.touches[0].clientX;sy=e.touches[0].clientY;}else sx=null;},{passive:true});
  stage.addEventListener('touchend',function(e){
    if(sx===null||(window.visualViewport&&visualViewport.scale>1.01))return;
    var dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)show(dx<0?cur+1:cur-1);
    else if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.5)close();
    sx=null;
  },{passive:true});
})();

// Keep motion opt-in for visitors who prefer reduced motion.
(function(){
  if(!window.matchMedia||!matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.project-video').forEach(function(video){video.autoplay=false;video.controls=true;video.pause();});
})();

// Copy the email address, with a mail link as a last-resort fallback.
(function(){
  var t=document.getElementById('toast'), timer;
  function toast(msg){t.textContent=msg; t.classList.add('show'); clearTimeout(timer); timer=setTimeout(function(){t.classList.remove('show')},1800);}
  function fallback(text){
    var ta=document.createElement('textarea'); ta.value=text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); var ok=false; try{ok=document.execCommand('copy')}catch(e){} document.body.removeChild(ta); return ok;
  }
  document.querySelectorAll('.copy-mail').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault(); var mail=a.textContent.trim(), href=a.href;
      var done=function(){toast('Почта скопирована')}, fail=function(){ if(fallback(mail)) done(); else location.href=href; };
      if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(mail).then(done,fail);} else fail();
    });
  });
})();

/* Figma-style squircle (corner smoothing 60%) for all 24px corners */
(function(){
  var SMOOTH=0.6, rad=function(d){return d*Math.PI/180};
  function corner(R,budget){
    var sm=SMOOTH, p=(1+sm)*R;
    sm=Math.min(sm, budget/R-1); p=Math.min(p,budget);
    var arc=90*(1-sm), L=Math.sin(rad(arc/2))*R*Math.SQRT2, alpha=(90-arc)/2,
        p34=R*Math.tan(rad(alpha/2)), beta=45*sm, c=p34*Math.cos(rad(beta)), d=c*Math.tan(rad(beta)),
        b=(p-L-c-d)/3, a=2*b;
    return {a:a,b:b,c:c,d:d,p:p,L:L,R:R};
  }
  function f(n){return Math.round(n*100)/100}
  function path(w,h,R){
    R=Math.min(R,w/2,h/2); var k=corner(R,Math.min(w,h)/2), a=k.a,b=k.b,c=k.c,d=k.d,p=k.p,L=k.L;
    var A='a '+f(R)+' '+f(R)+' 0 0 1 ';
    return ['M',f(w-p),0,
      'c',f(a),0,f(a+b),0,f(a+b+c),f(d), A+f(L)+' '+f(L), 'c',f(d),f(c),f(d),f(b+c),f(d),f(a+b+c),
      'L',f(w),f(h-p),
      'c',0,f(a),0,f(a+b),f(-d),f(a+b+c), A+f(-L)+' '+f(L), 'c',f(-c),f(d),f(-(b+c)),f(d),f(-(a+b+c)),f(d),
      'L',f(p),f(h),
      'c',f(-a),0,f(-(a+b)),0,f(-(a+b+c)),f(-d), A+f(-L)+' '+f(-L), 'c',f(-d),f(-c),f(-d),f(-(b+c)),f(-d),f(-(a+b+c)),
      'L',0,f(p),
      'c',0,f(-a),0,f(-(a+b)),f(d),f(-(a+b+c)), A+f(L)+' '+f(-L), 'c',f(c),f(-d),f(b+c),f(-d),f(a+b+c),f(-d),
      'Z'].join(' ');
  }
  var els=[].slice.call(document.querySelectorAll('.shot, .avatar, .hcard'));
  if(!els.length||!window.CSS||!CSS.supports('clip-path','path("M0 0Z")'))return;
  function apply(el){
    var r=el.getBoundingClientRect(), R=parseFloat(getComputedStyle(el).borderTopLeftRadius)||24;
    if(r.width&&r.height) el.style.clipPath='path("'+path(r.width,r.height,R)+'")';
  }
  if('ResizeObserver' in window){ var ro=new ResizeObserver(function(es){es.forEach(function(e){apply(e.target)})}); els.forEach(function(el){ro.observe(el)}); }
  else { els.forEach(apply); addEventListener('resize',function(){els.forEach(apply)}); }
})();

// Reveal marker highlights when their content enters the viewport.
(function(){
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els=[].slice.call(document.querySelectorAll('.hl,.sub h3 span,.stats b span'));
  var R=document.documentElement; R.classList.add('mk-pre'); R.getBoundingClientRect(); requestAnimationFrame(function(){R.classList.add('mk-ready')});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){ var el=e.target, d=el.dataset.d||0; setTimeout(function(){el.classList.add('mk-in')},d); io.unobserve(el);} });},{rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.stats').forEach(function(ul){ [].forEach.call(ul.querySelectorAll('b span'),function(sp,i){sp.dataset.d=i*140}); });
  els.forEach(function(el){io.observe(el)});
})();

// Persist the explicitly selected color theme.
(function(){
  var R=document.documentElement, btn=document.getElementById('themeBtn'), K='tasya-theme', mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  try{ var saved=localStorage.getItem(K); if(saved==='dark'||saved==='light') R.setAttribute('data-theme',saved); }catch(e){}
  function isDark(){ var t=R.getAttribute('data-theme'); return t?t==='dark':!!(mq&&mq.matches); }
  function sync(){ var d=isDark(); R.classList.toggle('is-dark',d); btn.setAttribute('aria-label',d?'Включить светлую тему':'Включить тёмную тему'); btn.title=btn.getAttribute('aria-label'); }
  btn.addEventListener('click',function(){ var n=isDark()?'light':'dark'; R.setAttribute('data-theme',n); try{localStorage.setItem(K,n)}catch(e){} sync(); });
  if(mq&&mq.addEventListener) mq.addEventListener('change',sync);
  new MutationObserver(sync).observe(R,{attributes:true,attributeFilter:['data-theme']});
  sync();
})();

// Sticky section navigation.
(function(){
  var nav=document.getElementById('snav'), head=document.querySelector('header'), links=[].slice.call(nav.querySelectorAll('a'));
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onScroll(){
    var show=head.getBoundingClientRect().bottom<0; nav.classList.toggle('show',show);
    var mid=innerHeight*0.35, cur=null;
    links.forEach(function(a){ var el=document.getElementById(a.dataset.s); if(el&&el.getBoundingClientRect().top<=mid) cur=a; });
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4) cur=links[links.length-1];
    links.forEach(function(a){ a.classList.toggle('act',a===cur); if(a===cur) a.setAttribute('aria-current','true'); else a.removeAttribute('aria-current'); });
  }
  addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();
  links.forEach(function(a){ a.addEventListener('click',function(e){ var el=document.getElementById(a.dataset.s); if(!el)return; e.preventDefault();
    el.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}); history.replaceState&&history.replaceState(null,'','#'+a.dataset.s); }); });
})();

// Case-study micro-interactions for pointer and touch devices.
(function(){
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  /* 4. morph */
  var mo=document.getElementById('morph');
  if(mo){
    var steps=[].slice.call(mo.querySelectorAll('.step')), stage=mo.querySelector('.morph-stage'), timer=null;
    function set(k){ mo.classList.toggle('is-b',k==='b'); steps.forEach(function(b){ var on=b.dataset.k===k; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); }); }
    steps.forEach(function(b){ b.addEventListener('click',function(){ stopAuto(); set(b.dataset.k); }); });
    if(FINE){ stage.addEventListener('mouseenter',function(){set('b')}); stage.addEventListener('mouseleave',function(){set('a')}); }
    function stopAuto(){ if(timer){clearInterval(timer); timer=null;} }
    if(!FINE&&!RM&&'IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting&&!timer){ timer=setInterval(function(){ set(mo.classList.contains('is-b')?'a':'b'); },2600);} else if(!e.isIntersecting) stopAuto(); }); },{threshold:.5}).observe(stage);
    }
    set('a');
  }
  if(!FINE||RM) return;
  /* 3. tilt on every project card */
  [].forEach.call(document.querySelectorAll('.shot'),function(el){
    el.classList.add('tilt');
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      el.classList.add('tilting');
      el.style.transform='perspective(1000px) rotateY('+((px-.5)*7)+'deg) rotateX('+((.5-py)*7)+'deg) scale(1.01) translateZ(0)';
      el.style.setProperty('--gx',(px*100)+'%'); el.style.setProperty('--gy',(py*100)+'%');
    });
    function reset(){ el.classList.remove('tilting'); el.style.transform=''; }
    el.addEventListener('pointerleave',reset); el.addEventListener('pointerdown',reset);
  });
})();

// Return-to-top control.
(function(){ var b=document.getElementById('toTop'); if(!b)return;
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.addEventListener('click',function(){ scrollTo({top:0,behavior:RM?'auto':'smooth'}); var a=document.querySelector('header .links a'); if(a) setTimeout(function(){a.focus({preventScroll:true})},RM?0:600); });
})();

// Hero collage and local time.
(function(){
  /* Drag a featured work across the page; a short press still opens it. */
  var collage=document.getElementById('collage'), topLayer=9;
  if(collage){
    [].forEach.call(collage.querySelectorAll('.hcard'),function(c){
      var pointerId=null, startX=0, startY=0, startScrollY=0, startLeft=0, startTop=0,
          lastX=0, lastY=0, dragging=false, ignoreClick=false, scrollFrame=null;
      c.addEventListener('pointerdown',function(e){
        if(e.pointerType==='mouse'&&e.button!==0)return;
        pointerId=e.pointerId; startX=e.clientX; startY=e.clientY;
        startScrollY=scrollY; lastX=e.clientX; lastY=e.clientY;
        startLeft=parseFloat(getComputedStyle(c).left)||0; startTop=parseFloat(getComputedStyle(c).top)||0;
        dragging=false; ignoreClick=false; c.setPointerCapture(pointerId);
      });
      function place(clientX,clientY){
        var dx=clientX-startX, dy=clientY-startY+(scrollY-startScrollY);
        if(!dragging&&Math.hypot(dx,dy)<6)return;
        if(!dragging){dragging=true; c.classList.add('is-dragging'); c.style.zIndex=++topLayer; autoScroll();}
        var collageRect=collage.getBoundingClientRect(), page=document.querySelector('.page'), pageRect=page.getBoundingClientRect(),
            collageLeft=collageRect.left+scrollX, collageTop=collageRect.top+scrollY,
            minLeft=-collageLeft, maxLeft=document.documentElement.clientWidth-collageLeft-c.offsetWidth,
            minTop=-collageTop, maxTop=pageRect.bottom+scrollY-collageTop-c.offsetHeight,
            left=Math.min(maxLeft,Math.max(minLeft,startLeft+dx)), top=Math.min(maxTop,Math.max(minTop,startTop+dy));
        c.style.left=left+'px'; c.style.top=top+'px';
      }
      function autoScroll(){
        if(!dragging||pointerId===null){scrollFrame=null;return;}
        var edge=Math.min(100,innerHeight*.18), speed=0;
        if(lastY<edge)speed=-Math.ceil((edge-lastY)/edge*18);
        else if(lastY>innerHeight-edge)speed=Math.ceil((lastY-innerHeight+edge)/edge*18);
        if(speed){var before=scrollY; scrollBy(0,speed); if(scrollY!==before)place(lastX,lastY);}
        scrollFrame=requestAnimationFrame(autoScroll);
      }
      c.addEventListener('pointermove',function(e){
        if(e.pointerId!==pointerId)return;
        lastX=e.clientX; lastY=e.clientY; place(lastX,lastY);
        if(dragging)e.preventDefault();
      });
      function finish(e){
        if(e.pointerId!==pointerId)return;
        ignoreClick=dragging&&e.type==='pointerup'; dragging=false; pointerId=null; c.classList.remove('is-dragging');
        if(scrollFrame){cancelAnimationFrame(scrollFrame); scrollFrame=null;}
      }
      c.addEventListener('pointerup',finish);
      c.addEventListener('pointercancel',finish);
      c.addEventListener('click',function(e){
        if(ignoreClick){ignoreClick=false; e.preventDefault(); e.stopPropagation(); return;}
        window.tasyaOpen&&window.tasyaOpen(c.dataset.open,c);
      });
    });
  }
  /* Tasya's local time */
  var clocks=[].slice.call(document.querySelectorAll('.clock'));
  try{
    var fmt=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Yekaterinburg'});
    var tick=function(){ var t=fmt.format(new Date()); clocks.forEach(function(c){c.textContent=t; c.parentNode.hidden=false;}); };
    tick(); setInterval(tick,1000);
  }catch(e){}
})();
