import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
fs.writeFileSync(new URL('../dist/tests/wave-preview.html',import.meta.url),source.replace('<head>','<head><base href="/">'));
console.log('Wave preview now uses the production Lifezones app.');
