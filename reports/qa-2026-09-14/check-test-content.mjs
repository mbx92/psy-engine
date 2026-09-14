import {writeFile} from 'node:fs/promises'
const base='http://10.100.10.100:8880'
const tests=await (await fetch(base+'/api/tests')).json()
const results=[]
for(const entry of tests){
 const test=await (await fetch(base+'/api/tests/'+encodeURIComponent(entry.slug))).json()
 const qs=(test.questions||[]).filter(q=>q.type!=='instruction')
 const ids=qs.map(q=>q.id)
 const item={slug:entry.slug,questionCount:qs.length,duplicateIds:ids.length-new Set(ids).size,missingIds:ids.filter(id=>id==null||id==='').length,missingOptions:qs.filter(q=>!Array.isArray(q.options)||!q.options.length).length,duplicateOptionIds:qs.filter(q=>Array.isArray(q.options)&&new Set(q.options.map(o=>o.id)).size!==q.options.length).length,assetChecks:[]}
 const paths=[...new Set(qs.map(q=>q.imagePath).filter(Boolean))].slice(0,3)
 for(const p of paths){const url=new URL(p,base);if(url.origin!==new URL(base).origin)continue;const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(10000)});item.assetChecks.push({path:url.pathname,status:r.status,type:r.headers.get('content-type')})}
 results.push(item);console.log(JSON.stringify(item))
}
await writeFile(new URL('./content-results.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),results},null,2))
