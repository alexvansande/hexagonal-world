import * as config from './asset-config.mjs';
export function assetURL(path,base=config.assetBaseURL,overrides=config.assetOverrides||[]){
 if(!base||/^(?:[a-z]+:|\/\/)/i.test(path))return path;
 const key=path.replace(/^\.?\//,'');
 const override=overrides.find(entry=>key.startsWith(entry.prefix));
 return (override?.baseURL||base).replace(/\/$/,'')+'/'+key;
}
