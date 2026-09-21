// CI validates membership in the checksum-pinned remote release. Local runs
// still require real files. Binary-content tests download and hash their inputs.
import {existsSync as localExists,readFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
const remote=process.env.REMOTE_ASSET_TESTS==='1';
const paths=remote?new Set(['_asset-release/manifest.json','_asset-release/tours/manifest.json'].flatMap(path=>JSON.parse(readFileSync(path)).files.map(f=>f.path))):null;
export function existsSync(path){
 const key=relative(resolve('dist'),resolve(path));
 return remote&&/\.(png|webp|jpe?g|svg)$/i.test(key)?paths.has(key):localExists(path);
}
