'use strict';

(function(){
  var root=document.documentElement, button=document.getElementById('themeBtn'), key='tasya-theme';
  var media=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  try{var saved=localStorage.getItem(key);if(saved==='dark'||saved==='light')root.setAttribute('data-theme',saved)}catch(e){}
  function dark(){var theme=root.getAttribute('data-theme');return theme?theme==='dark':!!(media&&media.matches)}
  function sync(){var value=dark();root.classList.toggle('is-dark',value);button.setAttribute('aria-label',value?'Включить светлую тему':'Включить тёмную тему')}
  button.addEventListener('click',function(){var next=dark()?'light':'dark';root.setAttribute('data-theme',next);try{localStorage.setItem(key,next)}catch(e){}sync()});
  if(media&&media.addEventListener)media.addEventListener('change',sync);
  sync();
})();

(function(){
  var link=document.querySelector('.copy-mail'),toast=document.getElementById('toast'),timer;
  if(!link||!toast)return;
  function show(){toast.textContent='Почта скопирована';toast.classList.add('show');clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove('show')},1800)}
  function fallback(text){var area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(area);return ok}
  link.addEventListener('click',function(event){
    event.preventDefault();var mail=link.textContent.trim(),href=link.href;
    var done=function(){show()},fail=function(){if(fallback(mail))done();else location.href=href};
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(mail).then(done,fail);else fail();
  });
})();
