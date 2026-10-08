import { instructionDisplayFields, isInstructionQuestion } from '~~/utils/question'

// Allowlist the participant DTO: scoring keys must never leave staff endpoints.
const pick = (value, keys) => Object.fromEntries(keys.filter(k => value?.[k] !== undefined).map(k => [k, value[k]]))
export function questionOptions(q) {
  if (q.options?.length) return q.options.map((o, i) => typeof o === 'string'
    ? { id: `${q.id}_${o}`, text: o, label: o, value: o }
    : { ...o, id: o.id ?? `${q.id}_${o.value || o.label || i}` })
  if (q.pair?.A && q.pair?.B) return ['A','B'].map(k => ({ id: `${q.id}_${k}`, text: q.pair[k].text || q.pair[k], value: k, label: k }))
  if (q.textA && q.textB) return ['A','B'].map(k => ({ id: `${q.id}_${k}`, text: q[`text${k}`], value: k, label: k }))
  return []
}
export function participantTest(test) {
  const config = pick(test.config, ['allowBack','allowNext','allowSkip','randomize','randomizeQuestions','timeLimit','hasSubtests','requiresAge','requiresBirthDate','showProgress','totalQuestions','instructionText','instructions','questionsPerPage','subtestTimeLimit','subtestProtection','autoSubmitOnTimeout'])
  config.subtests = (test.config?.subtests || []).map(s => pick(s, ['key','code','name','label','title','description','questionCount','timeLimit']))
  return {
    ...pick(test, ['id','name','slug','type','description']), config,
    questions: (test.questions || []).map(q => {
      const instruction = isInstructionQuestion(q)
      const display = instruction ? instructionDisplayFields(q) : null
      return {
        ...pick(q, ['id','type','text','number','imagePath','subtestKey','subtest','title','subtitle','instruction','timeLimit','rules','warnings']),
        type: instruction ? 'instruction' : q.type,
        ...(instruction ? {
          title: display.title || q.title,
          subtitle: display.subtitle || q.subtitle,
          instruction: display.instruction || q.instruction,
          timeLimit: display.timeLimit ?? q.timeLimit,
          rules: display.rules,
          warnings: display.warnings,
          imagePath: display.imagePath || q.imagePath,
          examples: display.examples.map(e => pick(e, ['number','description','text','imagePath','answer','explanation','title'])),
        } : {}),
        options: instruction ? [] : questionOptions(q).map(o => pick(o, ['id','text','label','value','imagePath'])),
      }
    }),
  }
}
