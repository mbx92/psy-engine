import { writeFile } from 'node:fs/promises'
const base='http://10.100.10.100:8880'
const results=[]
async function probe(path, method='GET', body) {
 const start=performance.now()
 const r=await fetch(base+path,{method,headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000),redirect:'manual'})
 const text=await r.text(); let data; try{data=JSON.parse(text)}catch{}
 const item={path,method,status:r.status,ms:Math.round(performance.now()-start),bytes:Buffer.byteLength(text),headers:Object.fromEntries([...r.headers].filter(([k])=>['content-type','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','strict-transport-security','location'].includes(k))),error:data?.message||data?.statusMessage}
 if(path==='/api/tests' && Array.isArray(data)) item.tests=data.map(t=>({slug:t.slug,type:t.type}))
 if(path.startsWith('/api/tests/') && data?.questions) item.questionExposure={count:data.questions.length,withAnswer:data.questions.filter(q=>q.answer!=null).length,withOptionWeights:data.questions.filter(q=>q.options?.some(o=>o.weight!=null)).length,questionKeys:[...new Set(data.questions.flatMap(q=>Object.keys(q)))],configKeys:Object.keys(data.config||{})}
 results.push(item); console.log(JSON.stringify(item)); return data
}
for(const p of ['/login','/api/health','/api/public/app-settings','/api/auth/me','/api/participants','/api/sessions','/api/admin/users','/api/admin/reports','/api/admin/system/status','/api/tests/qa-nonexistent-20260914','/api/open-invitations/token/qa-nonexistent-20260914','/api/public/psikograms/qa-nonexistent-20260914']) await probe(p)
const tests=await probe('/api/tests')
for(const t of Array.isArray(tests)?tests:[]) await probe('/api/tests/'+encodeURIComponent(t.slug))
await probe('/api/auth/register','POST',{})
await probe('/api/auth/login','POST',{})
for(let i=0;i<5;i++) await probe('/api/health')
await writeFile(new URL('./public-results.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),base,results},null,2))
