// Destructive fault injection is restricted to the isolated psy_qa_ database and loopback app.
import postgres from 'postgres'
import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const state=JSON.parse(await readFile('.temp/qa-state.json','utf8'))
if(!/^psy_qa_\d+_\d+$/.test(state.name))throw Error('Isolated QA database required')
const url=new URL(process.env.DATABASE_URL);url.pathname='/'+state.name
const sql=postgres(url.toString(),{max:3}),base='http://127.0.0.1:'+state.port,results=[]
let cookie=''
async function api(path,method='GET',body,auth=cookie){const r=await fetch(base+path,{method,headers:{'content-type':'application/json',cookie:auth},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),headers:r.headers}}
async function login(role,password=state.password){const r=await api('/api/auth/login','POST',{email:'qa-'+role+'@example.test',password},'');assert.equal(r.status,200);return r.headers.getSetCookie().filter(x=>x.startsWith('psy-token=')).map(x=>x.split(';')[0]).join('; ')}
function check(name,ok){results.push({name,status:ok?'PASS':'FAIL'});console.log(JSON.stringify(results.at(-1)))}
async function create(test){const p=await api('/api/participants','POST',{name:'QA integrity SYNTHETIC '+Date.now(),birthDate:'2000-01-15',gender:'L'});assert.equal(p.status,200);const s=await api('/api/sessions','POST',{testTypeId:test.id,participantId:p.data.participant.id});assert.equal(s.status,200);return {...s.data.session,path:'/api/sessions/token/'+s.data.session.token}}
try{
 cookie=await login('admin')
 const [operator]=await sql`SELECT * FROM users WHERE email='qa-operator@example.test'`
 let other=await login('operator')
 check('Deactivate account',(await api('/api/admin/users/'+operator.id,'PUT',{isActive:false})).status===200)
 check('Disabled account cookie rejected',(await api('/api/auth/me','GET',undefined,other)).status===401)
 await api('/api/admin/users/'+operator.id,'PUT',{isActive:true})
 check('Reactivation does not restore old cookie',(await api('/api/auth/me','GET',undefined,other)).status===401)
 other=await login('operator')
 await api('/api/admin/users/'+operator.id,'PUT',{role:'admin'})
 check('Role update revokes prior session',(await api('/api/auth/me','GET',undefined,other)).status===401)
 await api('/api/admin/users/'+operator.id,'PUT',{role:'operator'})
 other=await login('operator');const other2=await login('operator')
 const changed=await api('/api/auth/password','PUT',{currentPassword:state.password,newPassword:state.password+'New'},other)
 check('Password change requires login',changed.status===200&&changed.data.requiresLogin)
 check('Password change revokes all devices',(await api('/api/auth/me','GET',undefined,other2)).status===401)
 await sql`UPDATE users SET password_hash=${operator.password_hash} WHERE id=${operator.id}`
 const types=await sql`SELECT * FROM test_types`
 const cfit=types.find(t=>t.slug==='cfit-scale-2'),papi=types.find(t=>t.slug==='papi-kostick')
 for(const body of [{name:'   ',birthDate:'2000-01-01'},{name:'QA invalid',birthDate:'2026-02-30'},{name:'QA future',birthDate:'2999-01-01'}])check('Invalid biodata '+JSON.stringify(body),(await api('/api/participants','POST',{...body,gender:'L'})).status===400)
 const invitation=await api('/api/admin/open-invitations','POST',{testTypeIds:[cfit.id,papi.id],maxUses:1,label:'QA concurrent quota SYNTHETIC'})
 assert.equal(invitation.status,200)
 const claims=await Promise.all(Array.from({length:5},(_,i)=>api('/api/open-invitations/token/'+invitation.data.invitation.token+'/claim','POST',{name:'QA quota SYNTHETIC '+i,birthDate:'2000-01-15',gender:'L'},'')))
 check('Concurrent invitation quota: 1 winner, 4 rejected',claims.filter(r=>r.status===200).length===1&&claims.filter(r=>r.status===410).length===4)
 const [count]=await sql`SELECT use_count FROM open_invitations WHERE id=${invitation.data.invitation.id}`
 check('Quota increment and two battery sessions consistent',count.use_count===1&&(await sql`SELECT id FROM sessions WHERE metadata->>'openInvitationId'=${invitation.data.invitation.id}`).length===2)
 const global=await create(papi);await api(global.path+'/start','PATCH',undefined,'')
 const pq=papi.questions.find(q=>q.type!=='instruction')
 await api(global.path+'/answers','PATCH',{answers:{[pq.id]:pq.options[0].id}},'')
 const [globalRow]=await sql`SELECT metadata FROM sessions WHERE id=${global.id}`
 globalRow.metadata.timing.deadlineAt=new Date(Date.now()-1000).toISOString()
 await sql`UPDATE sessions SET metadata=${sql.json(globalRow.metadata)} WHERE id=${global.id}`
 check('Global deadline rejects late save',(await api(global.path+'/answers','PATCH',{answers:{[pq.id]:pq.options[1].id}},'')).status===409)
 const globalSubmit=await api(global.path+'/submit','POST',{answers:{[pq.id]:pq.options[1].id}},'')
 check('Global deadline discards late final answer',globalSubmit.status===200&&globalSubmit.data.discardedLateAnswerCount===1)
 const s=await create(cfit);await api(s.path+'/start','PATCH',undefined,'')
 const codes=cfit.config.subtests.map(t=>t.key||t.code)
 check('Cannot skip first subtest',(await api(s.path+'/subtest','PATCH',{code:codes[1]},'')).status===409)
 const started=await api(s.path+'/subtest','PATCH',{code:codes[0]},'')
 const repeated=await api(s.path+'/subtest','PATCH',{code:codes[0]},'')
 check('Subtest restart cannot extend deadline',JSON.stringify(started.data.timing)===JSON.stringify(repeated.data.timing))
 const q=cfit.questions.find(q=>q.type!=='instruction'&&(q.subtestKey||q.subtest)===codes[0])
 const answer={ [q.id]:q.options[0].id }
 await api(s.path+'/answers','PATCH',{answers:answer,metadata:{timing:{deadlineAt:'2999-01-01'},batteryTokens:['forged']}},'')
 const [row]=await sql`SELECT metadata FROM sessions WHERE id=${s.id}`
 check('Forged metadata does not overwrite server timing',row.metadata.timing.subtests[codes[0]].deadlineAt===started.data.timing.subtests[codes[0]].deadlineAt&&!row.metadata.batteryTokens)
 row.metadata.timing.subtests[codes[0]].deadlineAt=new Date(Date.now()-1000).toISOString()
 await sql`UPDATE sessions SET metadata=${sql.json(row.metadata)} WHERE id=${s.id}`
 const late={ [q.id]:q.options[1].id }
 check('Expired subtest rejects changed answer',(await api(s.path+'/answers','PATCH',{answers:late},'')).status===409)
 const submitted=await api(s.path+'/submit','POST',{answers:late},'')
 check('Late submit preserves answers and marks missing norm for review',submitted.status===200&&submitted.data.answersSaved&&submitted.data.scoringStatus==='failed'&&submitted.data.discardedLateAnswerCount===1)
 const [saved]=await sql`SELECT answers FROM sessions WHERE id=${s.id}`
 check('Late answer never overwrites saved choice',saved.answers[q.id]===answer[q.id])
 check('Failed score cannot be verified',(await api('/api/sessions/'+s.id+'/status','PATCH',{status:'verified'})).status===409)
 // Scoring exception with complete persisted answers: remove only QA norm temporarily.
 const good=(await sql`SELECT * FROM sessions WHERE test_type_id=${cfit.id} AND scores->>'status'='scored'`).find(r=>Object.keys(r.answers).length===46)
 assert.ok(good)
 const recovery=await create(cfit)
 await sql`UPDATE sessions SET status='in_progress',answers=${sql.json(good.answers)},started_at=now() WHERE id=${recovery.id}`
 const norms=await sql`SELECT * FROM test_type_norms WHERE test_type_id=${cfit.id}`
 try {
  await sql`UPDATE test_type_norms SET data='{}'::jsonb WHERE test_type_id=${cfit.id}`
  const failed=await api(recovery.path+'/submit','POST',{answers:good.answers},'')
  check('Scoring failure explicitly reports saved answers without success',failed.data.answersSaved===true&&failed.data.success===false&&failed.data.scoringStatus==='failed')
 }finally{for(const n of norms)await sql`UPDATE test_type_norms SET data=${sql.json(n.data)} WHERE id=${n.id}`}
 const rescored=await api('/api/sessions/'+recovery.id+'/rescore','POST',{})
 check('Admin rescore succeeds after restoring norm',rescored.status===200)
 check('Recovered scoring can be verified',(await api('/api/sessions/'+recovery.id+'/status','PATCH',{status:'verified'})).status===200)
}catch(e){check('Run aborted: '+e.message,false)}finally{await sql.end()}
await writeFile('reports/qa-fixes-2026-09-14/local-integrity.json',JSON.stringify({at:new Date().toISOString(),base,results},null,2))
if(results.some(r=>r.status==='FAIL'))process.exitCode=1
