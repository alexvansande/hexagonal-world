export const aboutShapes=[
 ['lambert-one','one-hex','One hex'],['lambert-two','two-hexes','Two hexes'],
 ['tetra','tetrahedron','Tetrahedron'],['octa','octahedron','Octahedron'],
 ['rhombic','rhombic-dodecahedron','Rhombic dodecahedron'],['tetrakis','tetrakis-hexahedron','Tetrakis hexahedron']
];
export const aboutMethod=path=>/^\/about\/?$/.test(path)?'rhombic':aboutShapes.find(([,slug])=>path===`/about/${slug}/`||path===`/about/${slug}`)?.[0]||null;
export const isAboutPath=path=>aboutMethod(path)!==null;
export const aboutPath=method=>`/about/${aboutShapes.find(([id])=>id===method)[1]}/`;

// Keep About shareable while preserving the map entry underneath it in browser history.
export function initAboutRoute({dialog,show,win=window,doc=document}){
 const mapTitle=isAboutPath(win.location.pathname)?'Hexagonal Earth — A collection of hexagon based maps':doc.title;
 const sync=()=>{
  const about=isAboutPath(win.location.pathname);
  doc.title=about?(win.location.pathname.replace(/\/$/,'')==='/about'?'About — Hexagonal Earth':`${aboutShapes.find(([id])=>id===aboutMethod(win.location.pathname))[2]} · About — Hexagonal Earth`):mapTitle;
  if(about)show(aboutMethod(win.location.pathname));else if(dialog.open)dialog.close();
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
 open.setProjection=method=>{
  if(!isAboutPath(win.location.pathname))return;
  win.history.replaceState(win.history.state,'',aboutPath(method));sync();
 };
 return open;
}
