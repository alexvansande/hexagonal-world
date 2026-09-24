// Local preview: serves dist/ and, like the published site's 404 page, answers
// any address without a file with the app, so download links work locally.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize,resolve} from 'node:path';
const root=resolve(process.argv[2]||'dist'),port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/markdown; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.pdf':'application/pdf','.zip':'application/zip'};
createServer(async(request,response)=>{
 try{
  let path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';
  const file=normalize(join(root,path));
  if(!file.startsWith(root)){response.writeHead(403);response.end();return;}
  try{if((await stat(file)).isFile()){response.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});response.end(await readFile(file));return;}}catch{}
  response.writeHead(404,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});response.end(await readFile(join(root,'index.html')));
 }catch(error){response.writeHead(500);response.end(String(error));}
}).listen(port,'127.0.0.1',()=>console.log(`Serving ${root} on http://127.0.0.1:${port}/`));
