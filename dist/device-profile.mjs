// Keep phone GPU allocations bounded, including short landscape viewports.
export const mobileQuery='(max-width:700px), (max-width:1000px) and (max-height:500px)';
export const compactDevice=typeof matchMedia==='function'&&matchMedia(mobileQuery).matches;
// A typical desktop fit is about 220 CSS pixels per map unit. Smaller
// viewports need a larger multiplier to reach that same 12× close-up.
export function maximumZoom(scale){return 12*Math.max(1,220/Math.max(1,scale));}
export function mobileFitRect(width,height,titleBottom,panelTop,panelRight=width*.4){
 const top=Math.min(height-120,Math.max(100,titleBottom+20));
 if(width>height)return {left:Math.min(width-100,panelRight+16),right:width-16,top,bottom:height-16};
 return {left:16,right:width-16,top,bottom:Math.max(top+40,Math.min(height-16,panelTop-18))};
}
