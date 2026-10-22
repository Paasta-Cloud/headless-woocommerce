import test from 'node:test';import assert from 'node:assert/strict';import {createServer} from 'node:http';
import {avinaIdentity,nativeCookieProof,nativeLogin} from '../lib/native-auth.js';
test('native identity uses the existing Avina mobile/email/username contract',()=>{
 assert.deepEqual(avinaIdentity('۰۹۱۲۳۴۵۶۷۸۹'),{login:'09123456789',type:'mobile'});assert.equal(avinaIdentity('buyer@example.test').type,'email');assert.equal(avinaIdentity('customer_1').type,'username');assert.equal(avinaIdentity('<script>'),null);
 assert.equal(nativeCookieProof(new Response('',{headers:{'Set-Cookie':'wordpress_logged_in_abc=buyer%7Cproof; HttpOnly'}})),'buyer|proof');
 assert.equal(nativeCookieProof(new Response('',{headers:{'Set-Cookie':'unrelated=value'}})),null);
});
test('native login delegates to installed theme, exchanges signed cookie privately and never retries',async()=>{
 const seen=[];let vendorOK=true;
 const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;seen.push({path:req.url,body});res.setHeader('Content-Type','application/json');
 if(req.url.includes('native-auth-guard'))return res.end('{}');
 if(req.url==='/account/'){res.setHeader('Content-Type','text/html');res.end('<form class="with_password"><input name="avina_auth_nonce" value="nonce12345"></form>');return;}
 if(req.url==='/avi_ajax/static_pass_check/'){if(vendorOK)res.setHeader('Set-Cookie','wordpress_logged_in_abc=buyer%7Csignedproof; HttpOnly');res.end(JSON.stringify({status:vendorOK}));return;}
 if(req.url.includes('native-session'))return res.end(JSON.stringify({token:'a'.repeat(64)}));res.statusCode=404;res.end('{}');});
 await new Promise(r=>server.listen(0,r));const previous=process.env.WOOCOMMERCE_URL;process.env.WOOCOMMERCE_URL=`http://localhost:${server.address().port}`;
 try{const result=await nativeLogin('09123456789','private-password');assert.equal(result.data.token,'a'.repeat(64));const form=new URLSearchParams(seen.find(x=>x.path.includes('static_pass')).body);assert.equal(form.get('email'),'09123456789');assert.equal(form.get('type'),'mobile');assert.equal(form.get('pass'),'private-password');assert.equal(form.get('nonce'),'nonce12345');assert.equal(JSON.parse(seen.at(-1).body).cookie,'buyer|signedproof');assert.ok(seen.every(x=>!x.path.includes('private-password')&&!x.path.includes('signedproof')));
 vendorOK=false;seen.length=0;assert.equal((await nativeLogin('09123456789','wrong')).status,401);assert.equal(seen.filter(x=>x.path.includes('static_pass')).length,1);assert.equal(seen.some(x=>x.path.includes('native-session')),false);
 }finally{if(previous===undefined)delete process.env.WOOCOMMERCE_URL;else process.env.WOOCOMMERCE_URL=previous;await new Promise(r=>server.close(r));}
});
