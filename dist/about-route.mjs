export const isAboutPath=path=>/^\/about\/?$/.test(path);

// Keep About shareable while preserving the map entry underneath it in browser history.
export function initAboutRoute({dialog,show,win=window,doc=document}){
 const mapTitle=isAboutPath(win.location.pathname)?'Hexagonal Earth — A collection of hexagon based maps':doc.title;
 const sync=()=>{
  const about=isAboutPath(win.location.pathname);
  doc.title=about?'About — Hexagonal Earth':mapTitle;
  if(about)show();else if(dialog.open)dialog.close();
 };
 const open=()=>{
  if(!isAboutPath(win.location.pathname))win.history.pushState({aboutReturnUrl:win.location.pathname+win.location.search+win.location.hash},'', '/about/');
  sync();
 };
 dialog.addEventListener('close',()=>{
  if(!isAboutPath(win.location.pathname))return;
  if(win.history.state?.aboutReturnUrl)win.history.back();
  else {win.history.replaceState(null,'','/');sync();}
 });
 win.addEventListener('popstate',sync);
 sync();
 return open;
}
