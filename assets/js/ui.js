'use strict';

// Shared cursor, paw trail and viewport reveals for the portfolio and CV.
(function(){
  var root=document.documentElement;
  var media=window.matchMedia?matchMedia('(hover:hover) and (pointer:fine)'):null;
  var reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(media&&media.matches){
    var cursor=document.getElementById('cur');
    var x=-100,y=-100,cx=x,cy=y,frame=null,lastX=null,lastY=null,side=1;
    var interactive='a,button,[role="button"],input,select,textarea,summary,label';
    var paw='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="16" rx="5.2" ry="4.4"/><ellipse cx="5.2" cy="10.2" rx="2.2" ry="2.9" transform="rotate(-20 5.2 10.2)"/><ellipse cx="9.3" cy="6" rx="2.2" ry="3" transform="rotate(-6 9.3 6)"/><ellipse cx="14.7" cy="6" rx="2.2" ry="3" transform="rotate(6 14.7 6)"/><ellipse cx="18.8" cy="10.2" rx="2.2" ry="2.9" transform="rotate(20 18.8 10.2)"/></svg>';
    cursor.innerHTML='<span class="cur-icon">'+paw+'</span><span class="cur-text"></span>';
    var cursorText=cursor.querySelector('.cur-text');

    function closest(target,selector){return target&&target.closest?target.closest(selector):null}
    function labelFor(target){
      var el=closest(target,'[data-cursor]');
      if(el)return el.dataset.cursor;
      if(closest(target,'.copy-mail'))return 'Скопировать';
      if(closest(target,'.hcard'))return 'Перетащить';
      if(closest(target,'.shot'))return 'Разглядеть';
      if(closest(target,'.theme'))return 'Сменить тему';
      if(closest(target,'.cv-back,a[href="index.html"]'))return 'В портфолио';
      if(closest(target,'a[download]'))return 'Скачать';
      if(closest(target,'.cv-link'))return 'Открыть CV';
      if(closest(target,'.lb-close'))return 'Закрыть';
      if(closest(target,'.lb-prev'))return 'Назад';
      if(closest(target,'.lb-next'))return 'Вперёд';
      if(closest(target,'.lb-zoom'))return closest(target,'.lb-zoom').getAttribute('aria-label')||'Увеличить';
      if(closest(target,'#toTop'))return 'Наверх';
      if(closest(target,'.step'))return 'Показать';
      if(closest(target,'.snav a'))return 'К разделу';
      if(closest(target,'a[target="_blank"]'))return 'Перейти ↗';
      if(closest(target,'a'))return 'Перейти';
      if(closest(target,'button'))return 'Нажать';
      return '';
    }
    function loop(){
      cx+=(x-cx)*.32;cy+=(y-cy)*.32;
      if(Math.abs(x-cx)<.1&&Math.abs(y-cy)<.1){cx=x;cy=y;frame=null}else frame=requestAnimationFrame(loop);
      cursor.style.translate=cx+'px '+cy+'px';
    }
    function addPaw(event){
      if(reduced||closest(event.target,'.lb.open')){lastX=null;return}
      if(lastX===null){lastX=event.clientX;lastY=event.clientY;return}
      var dx=event.clientX-lastX,dy=event.clientY-lastY,distance=Math.hypot(dx,dy);
      if(distance<52)return;
      var angle=Math.atan2(dy,dx),normalX=-Math.sin(angle),normalY=Math.cos(angle);side=-side;
      var print=document.createElement('span');
      print.className='paw'+(closest(event.target,'#s-doggo')?' paw-doggo':closest(event.target,'#s-bashnya')?' paw-bashnya':'');
      print.innerHTML=paw;
      print.style.translate=(event.clientX+normalX*9*side)+'px '+(event.clientY+normalY*9*side)+'px';
      print.style.rotate=(angle*180/Math.PI+90)+'deg';
      document.body.appendChild(print);
      setTimeout(function(){print.remove()},1350);
      lastX=event.clientX;lastY=event.clientY;
    }

    root.classList.add('has-cur');
    addEventListener('pointermove',function(event){
      if(event.pointerType!=='mouse')return;
      x=event.clientX;y=event.clientY;
      var label=labelFor(event.target);
      cursorText.textContent=label;
      cursor.classList.toggle('label',!!label);
      cursor.classList.toggle('hover',!label&&!!closest(event.target,interactive));
      if(reduced){cx=x;cy=y;cursor.style.translate=x+'px '+y+'px'}else if(!frame)frame=requestAnimationFrame(loop);
      cursor.classList.add('on');
      addPaw(event);
    },{passive:true});
    document.addEventListener('pointerdown',function(){cursor.classList.add('down')});
    document.addEventListener('pointerup',function(){cursor.classList.remove('down')});
    document.addEventListener('mouseleave',function(){lastX=null;cursorText.textContent='';cursor.classList.remove('on','hover','label')});
    document.addEventListener('mouseenter',function(){cursor.classList.add('on')});
  }

  if(reduced||!('IntersectionObserver' in window))return;
  var items=[].slice.call(document.querySelectorAll('.case,main > section > .sec-head,.foot-cta,.cv-hero,.cv-section'));
  if(!items.length)return;
  root.classList.add('reveal-pre');
  items.forEach(function(item){item.classList.add('reveal-item')});
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('reveal-in');observer.unobserve(entry.target)}});
  },{rootMargin:'0px 0px -8% 0px',threshold:.06});
  requestAnimationFrame(function(){items.forEach(function(item){observer.observe(item)})});
})();
