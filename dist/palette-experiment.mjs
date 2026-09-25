import {landLegends,oceanLegend,setExperimentPalette} from './map-layers.mjs?v=eras-1';

export function validatePalette(value){
 if(!value||typeof value!=='object')throw Error('Paste a palette object with land and ocean lists.');
 const result={};
 for(const [key,count] of [['land',10],['ocean',6]]){
  if(!Array.isArray(value[key])||value[key].length!==count)throw Error(`Expected ${count} ${key} colors.`);
  result[key]=value[key].map(entry=>{const color=typeof entry==='string'?entry:entry?.color;if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Use six-digit hex colors, such as #5143e8.');return color.toLowerCase();});
 }
 if(value.shadows!==undefined&&typeof value.shadows!=='boolean')throw Error('Shadows must be true or false.');
 result.shadows=value.shadows??true;return result;
}

export function mountPaletteExperiment({apply,shadows,setShadows,exit}){
 const defaults={land:landLegends[10].map(c=>c.color),ocean:oceanLegend(6).map(c=>c.color),shadows:shadows()};
 const names={land:landLegends[10].map(c=>c.name),ocean:oceanLegend(6).map(c=>c.name)};
 let palette=structuredClone(defaults),timer;
 try{const saved=sessionStorage.getItem('hex-palette-experiment');if(saved)palette=validatePalette(JSON.parse(saved));}catch{}
 const style=document.createElement('style');style.textContent=`
 body.palette-experiment #controls,body.palette-experiment #customize{display:none!important}
 #palette-experiment{position:fixed;z-index:30;top:20px;left:20px;width:320px;max-height:calc(100dvh - 40px);overflow:auto;box-sizing:border-box;background:#fffffff5;color:#193c49;border-radius:16px;padding:20px;box-shadow:0 4px 20px #0002;font:13px/1.4 sans-serif}
 #palette-experiment h2{font:24px Georgia,serif;margin:0 0 8px}#palette-experiment h3{font-size:14px;margin:18px 0 8px}
 #palette-experiment .swatch{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;margin:8px 0}
 #palette-experiment input[type=color]{width:38px;height:30px;padding:0;border:0;background:transparent;cursor:pointer}
 #palette-experiment input[type=checkbox]{width:auto}#palette-experiment button{cursor:pointer;padding:7px 10px;margin:4px 4px 4px 0;border:1px solid #aac0c5;border-radius:6px;background:white;color:#193c49}
 #palette-experiment textarea{box-sizing:border-box;width:100%;height:105px;font:11px monospace;resize:vertical}#palette-experiment .status{min-height:18px;font-size:12px}
 @media(max-width:600px){#palette-experiment{left:10px;top:auto;bottom:65px;width:calc(100% - 20px);max-height:45dvh}}
 `;document.head.append(style);document.body.classList.add('palette-experiment');
 const panel=document.createElement('section');panel.id='palette-experiment';panel.setAttribute('aria-label','Temporary palette experiment');
 panel.innerHTML='<h2>Palette experiment</h2><p>Try colors on the map. Rivers stay on. This editor only appears in this experiment.</p><label><input type="checkbox" id="palette-shadows"> Shadows</label><div id="palette-swatches"></div><h3>Copy / paste all values</h3><textarea id="palette-values" aria-label="Complete palette JSON" spellcheck="false"></textarea><div><button id="palette-copy">Copy values</button><button id="palette-paste">Apply pasted values</button><button id="palette-reset">Reset colors</button><button id="palette-exit">Exit experiment</button></div><p class="status" role="status" id="palette-status"></p>';
 document.body.append(panel);const $=id=>panel.querySelector('#'+id),inputs=[];
 for(const key of ['ocean','land']){
  const title=document.createElement('h3');title.textContent=key==='ocean'?'6 seas · gentle → rough':'10 lifezones · arid → humid';$('palette-swatches').append(title);
  palette[key].forEach((color,i)=>{const label=document.createElement('label');label.className='swatch';const input=document.createElement('input');input.type='color';input.value=color;input.setAttribute('aria-label',names[key][i]);const caption=document.createElement('span');caption.textContent=names[key][i];label.append(input,caption);$('palette-swatches').append(label);inputs.push({input,key,i});input.oninput=()=>{palette[key][i]=input.value;refresh();clearTimeout(timer);timer=setTimeout(commit,100);};});
 }
 function refresh(){for(const {input,key,i} of inputs)input.value=palette[key][i];$('palette-shadows').checked=palette.shadows;$('palette-values').value=JSON.stringify({land:palette.land.map((color,i)=>({name:names.land[i],color})),ocean:palette.ocean.map((color,i)=>({name:names.ocean[i],color})),shadows:palette.shadows},null,2);try{sessionStorage.setItem('hex-palette-experiment',JSON.stringify(palette));}catch{}}
 function commit(){setExperimentPalette(palette);setShadows(palette.shadows);apply();}
 $('palette-shadows').onchange=()=>{palette.shadows=$('palette-shadows').checked;refresh();setShadows(palette.shadows);};
 $('palette-paste').onclick=()=>{try{const next=validatePalette(JSON.parse($('palette-values').value));clearTimeout(timer);palette=next;refresh();commit();$('palette-status').textContent='Palette applied.';}catch(error){$('palette-status').textContent=error instanceof SyntaxError?'Invalid JSON. Paste the complete copied palette.':error.message;}};
 $('palette-copy').onclick=async()=>{refresh();$('palette-values').select();try{await navigator.clipboard.writeText($('palette-values').value);$('palette-status').textContent='All 16 colors and the shadows setting copied.';}catch{$('palette-status').textContent='Values selected. Press ⌘C or Ctrl+C to copy.';}};
 $('palette-reset').onclick=()=>{clearTimeout(timer);palette={...structuredClone(defaults),shadows:palette.shadows};refresh();commit();$('palette-status').textContent='Original colors restored.';};
 $('palette-exit').onclick=()=>{clearTimeout(timer);exit();};
 refresh();commit();
}
