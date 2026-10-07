import test from 'node:test'
import assert from 'node:assert/strict'
import { participantCreateSchema } from '../server/utils/validation.js'
import { validateFilterQuery } from '../server/utils/input.js'
import { participantTest } from '../server/utils/participantTest.js'
import { validateAnswers, initialTiming, advanceSubtest, mergeTimedAnswers, progressMetadata, hasUsableScores } from '../server/utils/testIntegrity.js'
import { calculateScore } from '../server/utils/scoring.js'
import { assertRoleEdit } from '../server/utils/rolePolicy.js'
import { getAuthSecret, authCookieOptions } from '../server/utils/authConfig.js'

const person = { name: 'QA Participant', birthDate: '2000-02-29', gender: 'L' }
test('valid participant and leap day accepted', () => assert.equal(participantCreateSchema.safeParse(person).success, true))
for (const birthDate of ['2000-02-31','2001-02-29','2000-13-01','2099-01-01']) test('reject invalid/future birth date '+birthDate, () => assert.equal(participantCreateSchema.safeParse({...person,birthDate}).success,false))
test('reject whitespace name and excessive field length', () => {
  assert.equal(participantCreateSchema.safeParse({...person,name:'   '}).success,false)
  assert.equal(participantCreateSchema.safeParse({...person,phone:'1'.repeat(51)}).success,false)
})
for(const query of [{testTypeId:'bad'},{dateFrom:'not-a-date'},{dateFrom:'2026-02-31'},{dateFrom:'2026-02-02',dateTo:'2026-02-01'}]) test('invalid filters return 400 '+JSON.stringify(query),()=>assert.throws(()=>validateFilterQuery(query),{statusCode:400}))
const fixture = { name:'Synthetic',config:{timeLimit:1},questions:[{id:'q1',type:'choice',answer:'A',options:[{id:'a',value:'A',weight:0,dimension:'D'},{id:'b',value:'B',weight:1,dimension:'D'}]}],scoringConfig:{algorithm:'paired_choice',dimensions:[]}}
test('participant DTO strips keys and scoring metadata', () => {
 const dto=participantTest(fixture)
 assert.equal(dto.scoringConfig,undefined);assert.equal(dto.questions[0].answer,undefined)
 assert.equal(dto.questions[0].options[0].weight,undefined);assert.equal(dto.questions[0].options[0].dimension,undefined)
 assert.equal(dto.questions[0].options[0].id,'a')
 const instructions=participantTest({...fixture,questions:[{type:'instruction',examples:[{number:1,description:'Practice',answer:'A'}]}]})
 assert.equal(instructions.questions[0].examples[0].number,1)
 assert.equal(instructions.questions[0].examples[0].description,'Practice')
})
for(const answers of ['invalid',[],null,{noSuchQuestion:'a'},{q1:'wrong'},{q1:{answer:'a'}}]) test('invalid answer payload '+JSON.stringify(answers),()=>assert.throws(()=>validateAnswers(fixture,answers),{statusCode:400}))
test('valid answers accepted',()=>assert.deepEqual(validateAnswers(fixture,{q1:'a'}),{q1:'a'}))
const now=Date.parse('2026-09-14T00:00:00Z')
test('global deadline rejects late saves and freezes final answers',()=>{
 const session={startedAt:new Date(now),answers:{q1:'a'},metadata:{timing:initialTiming(fixture,now)}}
 assert.throws(()=>mergeTimedAnswers(fixture,session,{q1:'b'},{now:now+60000}),{statusCode:409})
 assert.deepEqual(mergeTimedAnswers(fixture,session,{q1:'b'},{now:now+60000,finalize:true}),{answers:{q1:'a'},discarded:['q1']})
 assert.equal(mergeTimedAnswers(fixture,session,{q1:'b'},{now:now+59999}).answers.q1,'b')
})
test('subtest starts are ordered, idempotent and cannot reopen closed work',()=>{
 const f={...fixture,config:{hasSubtests:true,subtests:[{key:'one',timeLimit:10},{key:'two',timeLimit:20}]}}
 const timing=initialTiming(f,now)
 assert.throws(()=>advanceSubtest(f,timing,'two',now),{statusCode:409})
 const one=advanceSubtest(f,timing,'one',now)
 assert.deepEqual(advanceSubtest(f,one,'one',now+5000),one)
 const two=advanceSubtest(f,one,'two',now+7000)
 assert.ok(two.subtests.one.closedAt)
 assert.throws(()=>advanceSubtest(f,two,'one',now+8000),{statusCode:409})
})
test('client cannot overwrite timing/battery metadata',()=>assert.deepEqual(progressMetadata(fixture,{currentQuestionIndex:0,timing:{},batteryTokens:['forged'],monitoring:{},subtestTimers:{one:999}}),{currentQuestionIndex:0}))
for(const algorithm of ['paired_choice','dimension_sum','likert_average']) test('zero weight preserved '+algorithm,()=>assert.equal(calculateScore({...fixture,scoringConfig:{algorithm}},{q1:'a'}).dimensions.D,0))
test('CFIT without norms fails explicitly; supplied fixture norm used exactly',()=>{
 const f={...fixture,scoringConfig:{algorithm:'raw_to_iq',maxRawScore:1}}
 assert.throws(()=>calculateScore(f,{q1:'a'}),/norms/)
 const norms={adult:{ageMonthsStart:0,ageMonthsEnd:2000,norms:[{rawScore:1,iqScore:101,classification:'QA fixture'}]}}
 assert.equal(calculateScore(f,{q1:'a'},{birthDate:'2000-01-01',assessmentDate:'2026-01-01',norms}).dimensions.iqScore,101)
})
test('failed or empty scores cannot be verified',()=>{
 assert.equal(hasUsableScores({scores:{status:'failed',dimensions:{x:1}}}),false)
 assert.equal(hasUsableScores({scores:{dimensions:{}}}),false)
 assert.equal(hasUsableScores({scores:{status:'scored',dimensions:{x:0}}}),true)
})
test('ordinary RBAC admin cannot grant system rights, self-edit or modify superadmin',()=>{
 for(const [target,keys] of [['operator',['system:manage']],['admin',[]],['superadmin',[]],['operator',['unknown:permission']]]) assert.throws(()=>assertRoleEdit('admin',target,keys,['participants:read']),{statusCode:403})
 assert.doesNotThrow(()=>assertRoleEdit('admin','operator',['participants:read'],['participants:read']))
 assert.doesNotThrow(()=>assertRoleEdit('superadmin','admin',['system:manage'],[]))
})
test('production auth fails closed and LAN/HTTPS cookie modes remain HttpOnly',()=>{
 const saved={node:process.env.NODE_ENV,secret:process.env.JWT_SECRET,secure:process.env.AUTH_COOKIE_SECURE}
 try{
  process.env.NODE_ENV='production';delete process.env.JWT_SECRET
  assert.throws(getAuthSecret,/JWT_SECRET/)
  process.env.JWT_SECRET='psy-engine-secret-key-change-in-production';assert.throws(getAuthSecret,/JWT_SECRET/)
  process.env.JWT_SECRET='replace-with-at-least-32-random-characters';assert.throws(getAuthSecret,/JWT_SECRET/)
  process.env.JWT_SECRET='a'.repeat(48);assert.equal(getAuthSecret().length,48)
  process.env.AUTH_COOKIE_SECURE='false';assert.equal(authCookieOptions().httpOnly,true);assert.equal(authCookieOptions().secure,false)
  process.env.AUTH_COOKIE_SECURE='true';assert.equal(authCookieOptions().secure,true)
 } finally {for(const [key,value] of [['NODE_ENV',saved.node],['JWT_SECRET',saved.secret],['AUTH_COOKIE_SECURE',saved.secure]]){if(value===undefined)delete process.env[key];else process.env[key]=value}}
})
