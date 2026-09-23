import {appendMarkdown} from './tour-content.mjs?v=history-3';

// The story card in the sidebar. It renders whatever spot text the timeline hands
// it (paragraphs, a wave legend, a caveat and a source link); it fetches nothing.
export function createTourStory(controls,onClose){
 const card=document.createElement('section');card.id='tour-story';card.hidden=true;
 card.setAttribute('aria-labelledby','tour-story-title');
 card.innerHTML='<button id="tour-story-close" type="button" aria-label="Close story">×</button><h2 id="tour-story-title"></h2><div class="tour-story-body"></div><nav class="tour-story-nav" aria-label="Other spots of this period" hidden><button type="button" class="tour-story-prev" aria-label="Previous spot">‹</button><output></output><button type="button" class="tour-story-next" aria-label="Next spot">›</button></nav>';
 const button=card.querySelector('#tour-story-close'),title=card.querySelector('h2'),body=card.querySelector('.tour-story-body'),nav=card.querySelector('.tour-story-nav'),counter=nav.querySelector('output');
 // Arrows at the bottom cycle through the period's spots (wrapping around).
 let cycle=null;
 nav.querySelector('.tour-story-prev').onclick=()=>cycle?.step(-1);nav.querySelector('.tour-story-next').onclick=()=>cycle?.step(1);
 document.addEventListener('keydown',event=>{if(card.hidden||!cycle||event.altKey||event.ctrlKey||event.metaKey||/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName))return;if(event.key==='ArrowRight'){event.preventDefault();cycle.step(1);}else if(event.key==='ArrowLeft'){event.preventDefault();cycle.step(-1);}});
 controls.append(card);button.onclick=onClose;
 document.addEventListener('keydown',event=>{if(!card.hidden&&event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();onClose();}});
 const render=(location,story)=>{
  title.textContent=story?.title||location.title;button.setAttribute('aria-label',`Close ${location.title} story`);body.replaceChildren();
  if(!story){const p=document.createElement('p');p.textContent='Story text is unavailable.';body.append(p);return;}
  for(const text of story.paragraphs){const p=document.createElement('p');appendMarkdown(p,text);body.append(p);}
  if(story.legend?.length){const key=document.createElement('ul');key.className='tour-route-key';
   story.legend.forEach((text,i)=>{const item=document.createElement('li');item.dataset.wave=story.waves?.[i]||'';appendMarkdown(item,text);key.append(item);});body.append(key);}
  if(story.note){const note=document.createElement('p');note.className='tour-story-note';appendMarkdown(note,story.note);body.append(note);}
  if(story.source){const a=document.createElement('a');a.className='tour-story-source';a.textContent=story.source.title;a.href=new URL(story.source.url,import.meta.url).href;a.target='_blank';a.rel='noreferrer';body.append(a);}
 };
 // Phones: every spot of the period as a card in a horizontal strip, native scroll
 // snapping so a thumb drag has weight and the next card peeks in from the right.
 let strip=null,stripActive=null,stripSelect=null,settleTimer=0;
 const stripCards=()=>strip?[...strip.querySelectorAll('.tour-story-card')]:[];
 const nearestCard=()=>{const cards=stripCards();if(!cards.length)return null;const left=strip.scrollLeft+parseFloat(getComputedStyle(strip).scrollPaddingLeft||'0');return cards.reduce((best,card)=>Math.abs(card.offsetLeft-left)<Math.abs(best.offsetLeft-left)?card:best,cards[0]);};
 const settled=()=>{const card=nearestCard();if(!card)return;for(const c of stripCards())c.classList.toggle('active',c===card);if(card.dataset.spot!==stripActive){stripActive=card.dataset.spot;stripSelect?.(stripActive);}};
 const renderCard=(card,item,onClose)=>{
  card.replaceChildren();const close=document.createElement('button');close.type='button';close.className='tour-card-close round-button';close.setAttribute('aria-label','Close story');close.textContent='×';close.onclick=()=>onClose?.();card.append(close);
  const h=document.createElement('h2');h.textContent=item.story?.title||item.title;card.append(h);
  const inner=document.createElement('div');inner.className='tour-story-body';card.append(inner);
  const story=item.story;if(!story){const p=document.createElement('p');p.textContent='Story text is unavailable.';inner.append(p);return;}
  for(const text of story.paragraphs){const p=document.createElement('p');appendMarkdown(p,text);inner.append(p);}
  if(story.legend?.length){const key=document.createElement('ul');key.className='tour-route-key';story.legend.forEach((text,i)=>{const li=document.createElement('li');li.dataset.wave=story.waves?.[i]||'';appendMarkdown(li,text);key.append(li);});inner.append(key);}
  if(story.note){const note=document.createElement('p');note.className='tour-story-note';appendMarkdown(note,story.note);inner.append(note);}
  if(story.source){const a=document.createElement('a');a.className='tour-story-source';a.textContent=story.source.title;a.href=new URL(story.source.url,import.meta.url).href;a.target='_blank';a.rel='noreferrer';inner.append(a);}
 };
 return {
  strip(items,activeId,onSelect,onCloseStrip=null){
   stripSelect=onSelect;
   const same=strip&&stripCards().map(c=>c.dataset.spot).join()===items.map(i=>i.id).join();
   if(!same){
    strip?.remove();strip=document.createElement('div');strip.id='tour-story-strip';strip.setAttribute('role','region');strip.setAttribute('aria-label','Stories of this period');
    for(const item of items){const card=document.createElement('section');card.className='tour-story-card';card.dataset.spot=item.id;renderCard(card,item,onCloseStrip);strip.append(card);}
    controls.append(strip);
    strip.addEventListener('scroll',()=>{clearTimeout(settleTimer);settleTimer=setTimeout(settled,120);},{passive:true});
    strip.addEventListener('scrollend',()=>{clearTimeout(settleTimer);settled();});
   }
   controls.classList.add('tour-story-open');card.hidden=true;
   const target=stripCards().find(c=>c.dataset.spot===activeId);
   for(const c of stripCards())c.classList.toggle('active',c===target);
   if(target&&stripActive!==activeId){const first=stripActive===null;stripActive=activeId;strip.scrollTo({left:target.offsetLeft-parseFloat(getComputedStyle(strip).scrollPaddingLeft||'0'),behavior:first||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  },
  show(location,story,spots=null){
   render(location,story);cycle=spots&&spots.count>1?spots:null;nav.hidden=!cycle;
   if(cycle)counter.textContent=`${cycle.index+1} / ${cycle.count}`;
   if(!card.hidden)return;
   controls.style.setProperty('--tour-card-height',`${controls.getBoundingClientRect().height}px`);
   controls.classList.add('tour-story-open');card.hidden=false;button.focus({preventScroll:true});
  },
  close(){cycle=null;card.hidden=true;strip?.remove();strip=null;stripActive=null;stripSelect=null;controls.classList.remove('tour-story-open');controls.style.removeProperty('--tour-card-height');},
 };
}
