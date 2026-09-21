import {parseTourContent,appendMarkdown} from './tour-content.mjs?v=migrations-1';

export function createTourStory(controls,onClose,onMotionChange=()=>{},onPeriodChange=()=>{}){
 const card=document.createElement('section');card.id='tour-story';card.hidden=true;
 card.setAttribute('aria-labelledby','tour-story-title');
 card.innerHTML='<button id="tour-story-close" type="button" aria-label="Close story">×</button><h2 id="tour-story-title"></h2><div class="tour-story-body"></div>';
 const button=card.querySelector('button'),title=card.querySelector('h2'),body=card.querySelector('.tour-story-body');
 const timeline=document.createElement('div');timeline.className='tour-timeline';timeline.hidden=true;
 timeline.innerHTML='<div class="tour-period-heading"><label for="tour-period">Trade through time</label><output for="tour-period"></output></div><input id="tour-period" type="range" min="0" max="3" step="1" value="1" aria-label="Trade period"><div class="tour-period-labels"></div>';
 title.after(timeline);
 const slider=timeline.querySelector('input'),date=timeline.querySelector('output'),labels=timeline.querySelector('.tour-period-labels');
 let periods=[],period=null;
 const syncPeriod=()=>{timeline.hidden=!periods.length;if(!period)return;slider.value=periods.indexOf(period);slider.setAttribute('aria-valuetext',`${period.label}, ${period.date}`);date.textContent=period.date;for(const b of labels.children)b.setAttribute('aria-pressed',String(b.dataset.period===period.id));};
 const choose=index=>{const next=periods[index];if(!next||next===period)return;onPeriodChange(next.id);};
 slider.addEventListener('input',()=>choose(+slider.value));
 let selected=null,content=null;
 let paused=false;
 const display=()=>{
  if(!selected)return;
  const story=content?.[selected.storyId||selected.id];title.textContent=story?.title||selected.title;
  button.setAttribute('aria-label',`Close ${selected.title} story`);body.replaceChildren();
  if(!story){const p=document.createElement('p');p.textContent=content?'Story text is unavailable.':'Loading story…';body.append(p);return;}
  for(const text of story.paragraphs){const p=document.createElement('p');appendMarkdown(p,text);body.append(p);}
  if(story.legend?.length){const key=document.createElement('ul');key.className='tour-route-key';
   story.legend.forEach((text,i)=>{const item=document.createElement('li');item.dataset.wave=selected.waves?.[i]||'';appendMarkdown(item,text);key.append(item);});body.append(key);}
  if(story.note){const note=document.createElement('p');note.className='tour-story-note';appendMarkdown(note,story.note);body.append(note);}
  if(selected.animated){const toggle=document.createElement('button');toggle.type='button';toggle.className='tour-flow-toggle';
   const update=()=>{toggle.textContent=paused?'Resume flow':'Pause flow';toggle.setAttribute('aria-pressed',String(paused));};
   toggle.onclick=()=>{paused=!paused;update();onMotionChange(paused);};update();body.append(toggle);}
  if(story.source){const a=document.createElement('a');a.className='tour-story-source';a.textContent=story.source.title;a.href=new URL(story.source.url,import.meta.url).href;a.target='_blank';a.rel='noreferrer';body.append(a);}
 };
 let loading;
 const load=()=>loading||=fetch(new URL('./tour-stories.md',import.meta.url),{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Story text unavailable');return response.text();}).then(text=>{content=parseTourContent(text);display();}).catch(error=>{loading=null;content=null;throw error;});
 controls.append(card);button.onclick=onClose;
 document.addEventListener('keydown',event=>{if(!card.hidden&&event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();onClose();}});
 return {get ready(){return load();},setPeriods(choices,current){
  periods=choices;period=choices.find(p=>p.id===current)||null;labels.replaceChildren();
  for(const [i,p] of choices.entries()){const b=document.createElement('button');b.type='button';b.textContent=p.label;b.dataset.period=p.id;b.onclick=()=>choose(i);labels.append(b);}syncPeriod();
 },update(location){selected=location;period=periods.find(p=>p.id===location.periodId)||null;syncPeriod();display();},error(retry){body.replaceChildren();const p=document.createElement('p');p.textContent='Could not load this story. Please try again.';const b=document.createElement('button');b.type='button';b.textContent='Retry';b.onclick=retry;body.append(p,b);},open(location){
  periods=[];period=null;syncPeriod();
  selected=location;paused=false;onMotionChange(false);display();
  controls.style.setProperty('--tour-card-height',`${controls.getBoundingClientRect().height}px`);
  controls.classList.add('tour-story-open');card.hidden=false;button.focus({preventScroll:true});
 },close(){selected=null;card.hidden=true;controls.classList.remove('tour-story-open');controls.style.removeProperty('--tour-card-height');}};
}
