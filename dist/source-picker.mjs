// Keep the source/palette pair used by older map links behind one visible picker.
export const continentChoices=[
 ['continents-night','Continents - Blue & Navy','night'],
 ['continents-atlas','Continents - Ink & Ice','atlas'],
 ['continents-original','Continents - Gray','original']
];
export const sourceChoice=(source,palette)=>source==='continents'?(continentChoices.find(([, ,p])=>p===palette)||continentChoices[1])[0]:source;
export function sourcePair(choice,palette='atlas'){
 const match=continentChoices.find(([id])=>id===choice);
 return match?{source:'continents',palette:match[2]}:{source:choice,palette};
}
export function initSourcePicker({source,palette,choice}){
 for(const option of source.options){
  if(option.value==='continents'){
   for(const [value,label] of continentChoices){const item=document.createElement('option');item.value=value;item.textContent=label;choice.append(item);}
  }else choice.append(option.cloneNode(true));
 }
 const sync=()=>{choice.value=sourceChoice(source.value,palette.value);};
 choice.addEventListener('change',()=>{
  const next=sourcePair(choice.value,palette.value);source.value=next.source;palette.value=next.palette;
  source.dispatchEvent(new Event('change',{bubbles:true}));
 });
 sync();return sync;
}
