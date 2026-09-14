import { readFile, writeFile } from 'node:fs/promises'
import { participantCreateSchema } from '../../server/utils/validation.js'
const root=new URL('../../',import.meta.url)
const results=[]
function record(id,expected,observed,pass){results.push({id,expected,observed,status:pass?'PASS':'FAIL'});console.log(JSON.stringify(results.at(-1)))}
const participant={name:'QA Synthetic',birthDate:'2000-01-01',gender:'L'}
for(const [label,patch,expected] of [
 ['valid participant',{},true],['impossible birth date',{birthDate:'2000-02-31'},false],
 ['invalid month',{birthDate:'2000-13-01'},false],['future birth date',{birthDate:'2099-01-01'},false],
 ['blank name',{name:'   '},false],['invalid email',{email:'not-an-email'},false],['invalid gender',{gender:'X'},false]
]) {const accepted=participantCreateSchema.safeParse({...participant,...patch}).success;record(label,expected?'accepted':'rejected',accepted?'accepted':'rejected',accepted===expected)}
function stripImports(source){return source.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]\s*;?\r?\n/gm,'')}
const scoreSource=stripImports(await readFile(new URL('server/utils/scoring.js',root),'utf8')).replace('export function calculateScore','function calculateScore')
const calculateScore=new Function('scoreEppsMatrix',scoreSource+'\nreturn calculateScore')(()=>{throw Error('EPPS excluded from this harness')})
const test={questions:[{id:'q1',type:'choice',options:[{id:'a',dimension:'D',weight:0},{id:'b',dimension:'D',weight:1}]}],scoringConfig:{algorithm:'paired_choice',dimensions:[]}}
const zero=calculateScore(test,{q1:'a'});record('zero option weight',0,zero.dimensions.D,zero.dimensions.D===0)
const one=calculateScore(test,{q1:'b'});record('one option weight',1,one.dimensions.D,one.dimensions.D===1)
const iqTest={questions:[{id:'q1',answer:'A',options:[{id:'a',value:'A'}]}],config:{},scoringConfig:{algorithm:'raw_to_iq',maxRawScore:1,dimensions:[]}}
const iq=calculateScore(iqTest,{q1:'a'});record('missing IQ norms','explicit missing-norm status',iq,iq.dimensions.iqScore==null)
const correct=calculateScore({...test,scoringConfig:{algorithm:'correct_count'}},{q1:'b'});record('correct answer count',1,correct.raw.correct,correct.raw.correct===1)
// Handler checks use the unchanged production handler body with an in-memory DB double.
// No requests or writes to a real database are made.
const submitSource=stripImports(await readFile(new URL('server/api/sessions/token/[token]/submit.post.js',root),'utf8')).replace('export default','return')
async function submitCase(id,answers,throwScoring=false){
 const selected=[{id:'synthetic-session',status:'in_progress',testTypeId:'synthetic-test',participantId:'synthetic-person',startedAt:new Date(Date.now()-86400000),answers:{}},{birthDate:'2000-01-01',gender:'L'},{data:null}]
 let saved
 const db={select(){const b={from(){return b},where(){return b},limit(){return Promise.resolve([selected.shift()])}};return b},update(){return {set(value){saved=value;return {where(){return {returning:async()=>[{id:'synthetic-session',...value}]}}}}}}}
 const env={defineEventHandler:f=>f,getRouterParam:()=> 'synthetic-token',readBody:async()=>({answers}),useDB:()=>db,eq:()=>true,sessions:{},participants:{},testTypeNorms:{},getTestById:async()=>({...test,config:{timeLimit:1}}),calculateScore:()=>{if(throwScoring)throw Error('synthetic scoring failure');return {dimensions:{},interpretation:{}}},logSessionEvent:async()=>{},publishSessionEvent:()=>{},getBatteryProgress:async()=>null,createError:o=>Object.assign(new Error(o.message),o)}
 const handler=new Function(...Object.keys(env),submitSource)(...Object.values(env))
 let response;try{response=await handler({})}catch(e){response={error:e.message,statusCode:e.statusCode}}
 record(id,throwScoring?'scoring error surfaced, not successful completion':'reject invalid or expired submission',{response,savedStatus:saved?.status,storedAnswers:saved?.answers},!response?.success)
}
await submitCase('expired submission (24h after start)',{})
await submitCase('string answers accepted','invalid')
await submitCase('unknown question accepted',{unknown_question:'invalid_option'})
await submitCase('scoring failure marked successful',{},true)
await writeFile(new URL('./local-results.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),method:'Production schema/scoring and submit handler with synthetic in-memory dependencies; no real DB writes',results},null,2))
