(() => {
 const header=document.querySelector('[data-header]');
 if(!header)return;
 let frame=0,last='';
 const heroSelector='.hero,.kiln-hero,.mentorias-hero,.collective-hero,.agenda-hero,.blog-hero,.encuentro-hero';
 const update=()=>{
  frame=0;
  if(document.body.classList.contains('menu-open')||document.querySelector('dialog[open]'))return;
  if(window.scrollY<48){header.removeAttribute('data-scroll-theme');last='';return;}
  const y=Math.min(innerHeight-1,header.getBoundingClientRect().bottom+2);
  const hit=document.elementsFromPoint(innerWidth/2,y).find(el=>!el.closest('header,.whatsapp-float')&&el.closest('main,footer'));
  if(!hit)return;
  const section=hit.closest('section,footer')||hit.closest('main');
  if(!section)return;
  const hero=section.matches(heroSelector);
  let color='rgb(245, 238, 229)',node=section;
  if(!hero){
   while(node){
    const candidate=getComputedStyle(node).backgroundColor;
    const rgba=candidate.match(/[\d.]+/g)?.map(Number);
    if(rgba&&rgba.length>=3&&(rgba.length<4||rgba[3]>.5)){color=candidate;break;}
    node=node.parentElement;
   }
  }
  const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number);
  const linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
  const luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];
  const dark=hero||luminance<.3;
  const key=hero?'hero':color+'-'+dark;
  if(key===last)return;
  last=key;
  header.style.setProperty('--scroll-header-bg',hero?'transparent':color);
  header.style.setProperty('--scroll-header-ink',dark?'#f5eee5':'#233754');
  header.dataset.scrollTheme=dark?'dark':'light';
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule);
 addEventListener('load',schedule);
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
 schedule();
})();
