// Small, deliberately limited Markdown: paragraphs, emphasis, HTTPS links, a
// legend list, a blockquote note and a final source link. Never raw HTML.
export function appendMarkdown(element,text){
 const tokens=text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https:\/\/[^\s)]+\))/g);
 for(const token of tokens){
  let child;
  const link=token.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/);
  if(link){child=document.createElement('a');child.textContent=link[1];child.href=link[2];child.target='_blank';child.rel='noreferrer';}
  else if(token.startsWith('**')&&token.endsWith('**')){child=document.createElement('strong');child.textContent=token.slice(2,-2);}
  else if(token.startsWith('*')&&token.endsWith('*')){child=document.createElement('em');child.textContent=token.slice(1,-1);}
  else child=document.createTextNode(token);
  element.append(child);
 }
}

// Period Markdown (dist/history/<period>.md): an H1 "Title · date", intro
// paragraphs, then one `## story-id` section per spot with `### Title`,
// `spot: lat, lon`, `view: fit` (or `view: lat,lon → lat,lon`), `site:`/`area:`
// label lines, paragraphs,
// legend lines `- wave: text`, a `>` caveat and a final source link.
export function parsePeriod(markdown){
 const clean=markdown.replace(/<!--[\s\S]*?-->/g,'');
 const [head,...rest]=clean.split(/^## /m);
 const title=head.match(/^# (.+)$/m)?.[1]?.trim()||'';
 const intro=blocks(head.replace(/^# .+$/m,''));
 const spots={};
 for(const section of rest){
  const [id,...lines]=section.split('\n');let body=lines.join('\n');
  const spotTitle=body.match(/^### (.+)$/m)?.[1]?.trim()||id.trim();body=body.replace(/^### .+$/m,'');
  const spot=body.match(/^spot:\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/m),view=body.match(/^view:\s*(.+)$/m);
  // Map labels: `site: Name · lat, lon` (a black circle and an all-caps name) and
  // `area: Name · lat, lon` (an italic name for a region, range or sea).
  const labels=[...body.matchAll(/^(site|area):\s*(.+?)\s*·\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/gm)].map(m=>({kind:m[1],text:m[2],latitude:+m[3],longitude:+m[4]}));
  body=body.replace(/^(spot|view|site|area):.*$/gm,'');
  const parsed=blocks(body);
  spots[id.trim()]={id:id.trim(),title:spotTitle,spot:spot?[+spot[1],+spot[2]]:null,view:view?.[1].trim()||'fit',labels,...parsed};
 }
 return {title,intro,spots};
}
function blocks(text){
 const story={paragraphs:[],legend:[],waves:[],note:'',source:null};
 for(const block of text.trim().split(/\n\s*\n/).filter(Boolean)){
  const link=block.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+|\.\/[a-z0-9-]+\.md)\)$/);
  if(link)story.source={title:link[1],url:link[2]};
  else if(block.split('\n').every(line=>line.startsWith('- '))){
   for(const line of block.split('\n')){const m=line.slice(2).match(/^([a-z][a-z0-9-]*):\s*(.+)$/);if(m){story.waves.push(m[1]);story.legend.push(m[2]);}else{story.legend.push(line.slice(2));story.waves.push('');}}
  }
  else if(block.startsWith('> '))story.note=block.replace(/^> ?/gm,'').replace(/\n/g,' ');
  else story.paragraphs.push(block.replace(/\n/g,' '));
 }
 return story;
}
