import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultRateLimitSettings, rateLimitSettingsSchema } from '../utils/rateLimitSettings.js'
import { consumeRateLimit } from '../server/utils/rateLimitWindow.js'

test('rate settings preserve defaults and reject invalid bounds or incomplete payloads', () => {
  const defaults = defaultRateLimitSettings()
  assert.equal(defaults.login.max, 10)
  assert.equal(defaults.invitationClaim.max, 20)
  assert.ok(rateLimitSettingsSchema.safeParse(defaults).success)
  for (const patch of [{max:0},{max:1.5},{max:10001},{windowMinutes:0},{windowMinutes:1441},{enabled:'false'}]) {
    assert.equal(rateLimitSettingsSchema.safeParse({...defaults,login:{...defaults.login,...patch}}).success, false)
  }
  assert.equal(rateLimitSettingsSchema.safeParse({login:defaults.login}).success,false)
})
test('fixed window allows exactly the limit, reports retry delay, and expires at boundary', () => {
  const buckets=new Map(),policy={enabled:true,max:2,windowMinutes:1}
  assert.equal(consumeRateLimit(buckets,'login:ip',policy,0).allowed,true)
  assert.equal(consumeRateLimit(buckets,'login:ip',policy,1000).allowed,true)
  assert.deepEqual(consumeRateLimit(buckets,'login:ip',policy,1001),{allowed:false,retryAfter:59})
  assert.equal(consumeRateLimit(buckets,'login:ip',policy,60000).allowed,true)
})
test('disabled policies, distinct IPs, policies, and configuration revisions are independent', () => {
  const buckets=new Map(),policy={enabled:true,max:1,windowMinutes:15}
  consumeRateLimit(buckets,'r1:login:ip1',policy,0)
  assert.equal(consumeRateLimit(buckets,'r1:login:ip1',policy,0).allowed,false)
  for(const key of ['r2:login:ip1','r1:login:ip2','r1:invitationClaim:ip1']) assert.equal(consumeRateLimit(buckets,key,policy,0).allowed,true)
  assert.equal(consumeRateLimit(buckets,'r1:login:ip1',{...policy,enabled:false},0).allowed,true)
})
