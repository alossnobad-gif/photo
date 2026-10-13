import {gzip} from 'node:zlib';
export function compressJson(req,res,next){
 if(!req.get('accept-encoding')||req.acceptsEncodings('gzip')!=='gzip')return next();
 const original=res.json.bind(res);
 res.json=value=>{const text=JSON.stringify(value);if(Buffer.byteLength(text)<1024)return original(value);res.vary('Accept-Encoding');gzip(text,{level:4},(error,bytes)=>{if(error)return original(value);res.set('Content-Encoding','gzip').type('application/json').send(bytes);});return res;};
 next();
}
