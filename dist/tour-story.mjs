import {appendMarkdown} from './tour-content.mjs?v=history-1';

// The story card in the sidebar. It renders whatever spot text the timeline hands
// it (paragraphs, a wave legend, a caveat and a source link); it fetches nothing.
export function createTourStory(controls,onClose){
 const card=document.createElement('section');card.id='tour-story';card.hidden=true;
 card.setAttribute('aria-labelledby','tour-story-title');
 card.innerHTML='<button id="tour-story-close" type="button" aria-label="Close story">×</button><h2 id="tour-story-title"></h2><div class="tour-story-body"></div>';
 const button=card.querySelector('button'),title=card.querySelector('h2'),body=card.querySelector('.tour-story-body');
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
 return {
  show(location,story){
   render(location,story);
   if(!card.hidden)return;
   controls.style.setProperty('--tour-card-height',`${controls.getBoundingClientRect().height}px`);
   controls.classList.add('tour-story-open');card.hidden=false;button.focus({preventScroll:true});
  },
  close(){card.hidden=true;controls.classList.remove('tour-story-open');controls.style.removeProperty('--tour-card-height');},
 };
}
