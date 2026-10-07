// Integration test restricted to the local QA application and generated QA accounts.
import { readFile,writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'
const state=JSON.parse(await readFile('.temp/qa-state.json','utf8'))
if(!/^psy_qa_\d+_\d+$/.test(state.name))throw Error('QA state required')
const base='http://127.0.0.1:'+state.port, results=[]
let cookie='',original
async function api(path,method='GET',body,auth=cookie,extra={}) {
 const r=await fetch(base+path,{method,headers:{'content-type':'application/json',cookie:auth,...extra},body:body===undefined?undefined:JSON.stringify(body)})
 return {status:r.status,data:await r.json(),headers:r.headers}
}
const check=(name,ok)=>{results.push({name,status:ok?'PASS':'FAIL'});assert.ok(ok,name)}
try {
 const login=await api('/api/auth/login','POST',{email:'qa-admin@example.test',password:state.password},'')
 assert.equal(login.status,200)
 cookie=login.headers.getSetCookie().filter(x=>x.startsWith('psy-token=')).map(x=>x.split(';')[0]).join('; ')
 original=(await api('/api/admin/rate-limits')).data.settings
 check('Anonymous read blocked',(await api('/api/admin/rate-limits','GET',undefined,'')).status===401)
 const roleName='qa_rate_'+Date.now()
 const role=await api('/api/admin/rbac/roles','POST',{name:roleName,label:'QA rate viewer'})
 assert.equal(role.status,200)
 await api('/api/admin/rbac/roles/'+role.data.role.id,'PUT',{permissionKeys:['settings:read']})
 await api('/api/admin/users','POST',{email:roleName+'@example.test',name:'QA rate viewer',password:state.password,role:roleName})
 const op=await api('/api/auth/login','POST',{email:roleName+'@example.test',password:state.password},'')
 assert.equal(op.status,200)
 const opCookie=op.headers.getSetCookie().filter(x=>x.startsWith('psy-token=')).map(x=>x.split(';')[0]).join('; ')
 check('Read-only settings user can view',(await api('/api/admin/rate-limits','GET',undefined,opCookie)).status===200)
 check('Read-only settings user cannot update',(await api('/api/admin/rate-limits','PUT',original,opCookie)).status===403)
 check('Invalid settings rejected',(await api('/api/admin/rate-limits','PUT',{...original,login:{enabled:true,max:0,windowMinutes:1}})).status===400)
 const edited={login:{enabled:true,max:2,windowMinutes:1},invitationClaim:{enabled:true,max:1,windowMinutes:1}}
 check('Admin saves new settings',(await api('/api/admin/rate-limits','PUT',edited)).status===200)
 check('Settings persist on reload',isDeepStrictEqual((await api('/api/admin/rate-limits')).data.settings,edited))
 for(let i=0;i<2;i++) check('Login attempt '+(i+1)+' allowed',(await api('/api/auth/login','POST',{},'')).status===400)
 const blocked=await api('/api/auth/login','POST',{},'',{'X-Forwarded-For':'203.0.113.77'})
 check('Login blocks at configured threshold; spoofed header does not bypass',blocked.status===429)
 check('429 includes Retry-After',Number(blocked.headers.get('retry-after'))>0&&blocked.data.data.retryAfter>0)
 const claim='/api/open-invitations/token/qa-invalid-token/claim'
 check('Claim uses independent bucket',(await api(claim,'POST',{},'')).status===400)
 check('Claim obeys configured threshold',(await api(claim,'POST',{},'')).status===429)
 await api('/api/admin/rate-limits','PUT',{...edited,login:{...edited.login,enabled:false}})
 check('Disable login takes immediate effect',(await api('/api/auth/login','POST',{},'')).status===400)
 await api('/api/admin/rate-limits','PUT',edited)
 check('Re-enable starts a fresh window',(await api('/api/auth/login','POST',{},'')).status===400)
}catch(e){results.push({name:e.message,status:'FAIL'})}
finally{if(original)await api('/api/admin/rate-limits','PUT',original)}
await writeFile('.temp/rate-limit-integration.json',JSON.stringify(results,null,2))
console.log(JSON.stringify({checks:results.length,failures:results.filter(r=>r.status==='FAIL').length,results},null,2))
if(results.some(r=>r.status==='FAIL'))process.exitCode=1
