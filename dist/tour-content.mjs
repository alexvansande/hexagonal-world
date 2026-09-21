// Small, deliberately limited Markdown format: sections, title, paragraphs,
// emphasis, a blockquote note, and a final source link. Never execute raw HTML.
export function parseTourContent(markdown){
 const result={};
 for(const section of markdown.split(/^## /m).slice(1)){
  const [id,...lines]=section.split('\n'),body=lines.join('\n').replace(/<!--[\s\S]*?-->/g,'').trim();
  const title=body.match(/^### (.+)$/m)?.[1]||id.trim();
  const blocks=body.replace(/^### .+$/m,'').trim().split(/\n\s*\n/).filter(Boolean);
  const story={title,paragraphs:[],legend:[],note:'',source:null};
  for(const block of blocks){
   const link=block.match(/^\[([^\]]+)\]\((https:\/\/[^\s)]+|\.\/[a-z0-9-]+\.md)\)$/);
   if(link)story.source={title:link[1],url:link[2]};
   else if(block.split('\n').every(line=>line.startsWith('- ')))story.legend=block.split('\n').map(line=>line.slice(2));
   else if(block.startsWith('> '))story.note=block.replace(/^> ?/gm,'').replace(/\n/g,' ');
   else story.paragraphs.push(block.replace(/\n/g,' '));
  }
  result[id.trim()]=story;
 }
 return result;
}
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
