import {assetBaseURL} from './asset-config.mjs';
export function assetURL(path,base=assetBaseURL){
 if(!base||/^(?:[a-z]+:|\/\/)/i.test(path))return path;
 return base.replace(/\/$/,'')+'/'+path.replace(/^\.?\//,'');
}
