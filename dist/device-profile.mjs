// Keep phone GPU allocations bounded, including short landscape viewports.
export const mobileQuery='(max-width:700px), (max-width:1000px) and (max-height:500px)';
export const compactDevice=typeof matchMedia==='function'&&matchMedia(mobileQuery).matches;
export const mobileShadows={off:'none',gentle:'drop-shadow(0px 3px 3px #16344230)',sculpted:'drop-shadow(1px 6px 4px #16344250)',dramatic:'drop-shadow(3px 10px 5px #16344270)'};
export function mobileFitRect(width,height,titleBottom,panelTop,panelRight=width*.4){
 const top=Math.min(height-120,Math.max(100,titleBottom+20));
 if(width>height)return {left:Math.min(width-100,panelRight+16),right:width-16,top,bottom:height-16};
 return {left:16,right:width-16,top,bottom:Math.max(top+40,Math.min(height-16,panelTop-18))};
}
