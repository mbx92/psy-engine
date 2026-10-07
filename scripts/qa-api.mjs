/** Explicit QA run. Creates labelled synthetic participants/sessions on QA_BASE_URL. */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.env.QA_BASE_URL
if(!base||!process.env.QA_EMAIL||!process.env.QA_PASSWORD) throw new Error('QA_BASE_URL, QA_EMAIL and QA_PASSWORD are required')
const legacy=process.env.QA_LEGACY==='true'
const run='QA-'+new Date().toISOString().replace(/[:.]/g,'-')
const results=[],created=[]
let cookie='',bearer=''
async function api(path,method='GET',body,authenticated=true,extra={}){
 const r=await fetch(base+path,{method,headers:{...(body!==undefined?{'content-type':'application/json'}:{}),...(authenticated&&cookie?{cookie}:{}),...(authenticated&&bearer?{Authorization:'Bearer '+bearer}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)})
 let data;try{data=await r.json()}catch{data=null}
 return {status:r.status,data,headers:r.headers}
}
function check(name,ok,detail={}){results.push({name,status:ok?'PASS':'FAIL',...detail});console.log(JSON.stringify(results.at(-1)))}
async function required(path,method='GET',body){const r=await api(path,method,body);assert.equal(r.status,200,path+': '+JSON.stringify(r.data));return r.data}
try{
 const login=await api('/api/auth/login','POST',{email:process.env.QA_EMAIL,password:process.env.QA_PASSWORD},false)
 assert.equal(login.status,200,'Login failed: '+login.data?.message)
 cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).filter(c=>c.startsWith('psy-token=')).join('; ')
 bearer=legacy?login.data.token:''
 check('Admin login',true,{role:login.data.user.role})
 if(!legacy){
  check('HttpOnly session; token not returned to JS',login.headers.getSetCookie().some(c=>c.includes('HttpOnly'))&&!login.data.token)
  check('Public test list blocked',(await api('/api/tests','GET',undefined,false)).status===401)
  check('Public registration disabled',(await api('/api/auth/register','POST',{},false)).status===403)
  check('Cross-origin mutation rejected',(await api('/api/auth/logout','POST',{},true,{Origin:'https://untrusted.example'})).status===403)
  check('HTML security headers',(await fetch(base+'/login')).headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
  for(const path of ['/api/participants/not-a-uuid','/api/sessions?testTypeId=bad','/api/sessions?dateFrom=bad'])check('Invalid query/ID '+path,(await api(path)).status===400)
  check('System management denied for admin',(await api('/api/admin/system/status')).status===403)
  const roles=(await required('/api/admin/rbac/roles')).roles
  const admin=roles.find(r=>r.name==='admin'),operator=roles.find(r=>r.name==='operator'),god=roles.find(r=>r.name==='superadmin')
  for(const [role,body] of [[admin,{permissionKeys:admin.permissionKeys}],[operator,{permissionKeys:['system:manage']}],[god,{label:god.label}]]) check('RBAC restricted '+role.name,(await api('/api/admin/rbac/roles/'+role.id,'PUT',body)).status===403)
 }
 const types=(await required('/api/admin/test-types')).testTypes
 for(const slug of ['cfit-scale-2','papi-kostick','epps']){
  const summary=types.find(t=>t.slug===slug);assert.ok(summary,slug)
  const definition=(await required('/api/admin/test-types/'+summary.id)).testType
  const participant=(await required('/api/participants','POST',{name:run+' '+slug+' SYNTHETIC',birthDate:'2000-01-15',gender:'L',email:'qa-synthetic@example.test'})).participant
  const session=(await required('/api/sessions','POST',{participantId:participant.id,testTypeId:summary.id})).session
  created.push({slug,participantId:participant.id,sessionId:session.id,name:participant.name})
  const path='/api/sessions/token/'+session.token
  const view=await api(path,'GET',undefined,false)
  check(slug+' participant link',view.status===200)
  if(!legacy){
   const questions=view.data.session.testType.questions
   check(slug+' no scoring secrets',!view.data.session.testType.scoringConfig&&questions.every(q=>q.type==='instruction'||(!Object.hasOwn(q,'answer')&&q.options.every(o=>!Object.hasOwn(o,'weight')&&!Object.hasOwn(o,'dimension')))))
  }
  assert.equal((await api(path+'/start','PATCH',undefined,false)).status,200)
  const qs=definition.questions.filter(q=>q.type!=='instruction')
  const answerMap=Object.fromEntries(qs.map((q,index)=>{
    let opt=q.options[index%q.options.length]
    if(slug==='cfit-scale-2') opt=q.options.find(o=>index<30 ? String(o.value||o.label).toUpperCase()===String(q.answer).toUpperCase() : String(o.value||o.label).toUpperCase()!==String(q.answer).toUpperCase())
    assert.ok(opt,'option fixture '+q.id)
    return [q.id,opt.id]
  }))
  if(!legacy){
   check(slug+' rejects string answers',(await api(path+'/submit','POST',{answers:'invalid'},false)).status===400)
   check(slug+' rejects unknown answers',(await api(path+'/answers','PATCH',{answers:{qa_unknown:'bad'}},false)).status===400)
  }
  const groups=(definition.config.hasSubtests||definition.config.subtestTimeLimit)?definition.config.subtests:[]
  if(groups.length&&!legacy){
   for(const group of groups){
    const code=group.key||group.code
    const started=await api(path+'/subtest','PATCH',{code},false);assert.equal(started.status,200)
    const subset=Object.fromEntries(qs.filter(q=>(q.subtestKey||q.subtest)===code).map(q=>[q.id,answerMap[q.id]]))
    assert.equal((await api(path+'/answers','PATCH',{answers:subset},false)).status,200)
   }
  }else assert.equal((await api(path+'/answers','PATCH',{answers:answerMap},false)).status,200)
  const restored=(await api(path,'GET',undefined,false)).data.session
  check(slug+' autosave/resume',Object.keys(restored.answers).length===qs.length,{answered:Object.keys(restored.answers).length,expected:qs.length})
  const submission=await api(path+'/submit','POST',{answers:answerMap},false)
  check(slug+' submit',submission.status===200&&(legacy?submission.data.success:submission.data.answersSaved))
  const detail=(await required('/api/sessions/'+session.id)).session
  const raw=detail.scores?.raw||{},dims=detail.scores?.dimensions||{}
  if(slug==='cfit-scale-2')check(slug+' raw score and adult IQ',raw.rawScore===30&&(legacy||dims.iqScore===96),{rawScore:raw.rawScore,iqScore:dims.iqScore,scoringStatus:detail.scores?.status||'legacy'})
  if(slug==='papi-kostick')check(slug+' 90 choices counted',Object.values(raw).reduce((sum,n)=>sum+(typeof n==='number'?n:0),0)===90,{dimensionCount:Object.keys(dims).length})
  if(slug==='epps')check(slug+' score structure',Object.keys(dims).length===15&&!raw.error,{dimensionCount:Object.keys(dims).length,rawKeys:Object.keys(raw)})
  if(!legacy){
   const again=await api(path+'/submit','POST',{answers:answerMap},false)
   check(slug+' duplicate submit idempotent',again.status===200&&again.data.answersSaved)
   check(slug+' completed session cannot save',(await api(path+'/answers','PATCH',{answers:{}},false)).status===409)
  }
  if(detail.scores?.status!=='failed'){
   check(slug+' admin verification',(await api('/api/sessions/'+session.id+'/status','PATCH',{status:'verified',notes:'Synthetic QA only; not a psychological assessment.'})).status===200)
  }
 }
 check('Reports query after synthetic sessions',(await api('/api/admin/reports')).status===200)
 check('Monitoring after completed sessions',(await api('/api/sessions/monitoring')).status===200)
 if(!legacy){
  const originalCookie=cookie
  check('Logout',(await api('/api/auth/logout','POST')).status===200)
  check('Revoked cookie replay rejected',(await api('/api/auth/me','GET',undefined,true,{cookie:originalCookie})).status===401)
 }
}catch(error){check('Run aborted',false,{error:error.message})}
await mkdir('reports/qa-fixes-2026-09-14',{recursive:true})
await writeFile('reports/qa-fixes-2026-09-14/'+(legacy?'server-baseline':'local-integration')+'.json',JSON.stringify({at:new Date().toISOString(),base,legacy,created,results},null,2))
if(results.some(r=>r.status==='FAIL'))process.exitCode=1
