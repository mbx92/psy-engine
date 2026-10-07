import { writeFile } from 'node:fs/promises'
const base='http://10.100.10.100:8880'
const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:process.env.QA_EMAIL,password:process.env.QA_PASSWORD}),signal:AbortSignal.timeout(15000)})
const login=await response.json()
if(!login.token){console.log(JSON.stringify({loginStatus:response.status,message:login.message}));process.exitCode=1}
else {
 const results=[]
 console.log(JSON.stringify({loginStatus:response.status,role:login.user.role,permissions:login.user.permissions}))
 for(const [path,expected] of [
 ['/api/auth/me',200],['/api/participants?page=1&limit=5',200],['/api/participants?page=1&limit=5&search=QA-NONEXISTENT-20260914',200],
 ['/api/sessions?page=1&limit=5',200],['/api/sessions?page=1&limit=5&tab=active',200],['/api/sessions/monitoring',200],
 ['/api/admin/test-types',200],['/api/admin/open-invitations',200],['/api/admin/psikograms',200],['/api/admin/reports',200],
 ['/api/admin/users',null],['/api/admin/rbac/roles',null],['/api/admin/system/status',403],['/api/admin/activity-logs?page=1&limit=5',null],
 ['/api/participants/not-a-uuid',400],['/api/sessions?page=1&limit=5&testTypeId=not-a-uuid',400],['/api/sessions?page=1&limit=5&dateFrom=not-a-date',400]
 ]){
  const start=performance.now();try{
   const r=await fetch(base+path,{headers:{Authorization:`Bearer ${login.token}`},signal:AbortSignal.timeout(20000)})
   const text=await r.text();let data;try{data=JSON.parse(text)}catch{}
   const item={path,status:r.status,expected,ms:Math.round(performance.now()-start),bytes:Buffer.byteLength(text),keys:data?Object.keys(data):[],counts:data?Object.fromEntries(Object.entries(data).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])):{},pagination:data?.pagination,error:r.status>=400?(data?.message||data?.statusMessage):undefined}
   results.push(item);console.log(JSON.stringify(item))
  }catch(e){const item={path,error:e.message};results.push(item);console.log(JSON.stringify(item))}
 }
 await writeFile(new URL('./admin-results.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),role:login.user.role,permissions:login.user.permissions,results},null,2))
}
