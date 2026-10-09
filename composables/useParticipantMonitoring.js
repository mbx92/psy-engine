import { isAnswerableQuestion, isInstructionQuestion } from '~~/utils/question'

export function useParticipantMonitoring({ token, status, currentIndex, currentQuestion, questions, saveState, onEnded }) {
  let timer, debounce
  let busy = false
  let stopped = false

  async function report() {
    if (stopped || busy || !['pending', 'in_progress'].includes(status.value)) return
    busy = true
    try {
      const result = await $fetch(`/api/sessions/token/${unref(token)}/heartbeat`, {
        method: 'POST', timeout: 10000, retry: 0,
        body: {
          currentQuestionIndex: status.value === 'in_progress' ? currentIndex.value : null,
          questionId: currentQuestion.value?.id == null ? null : String(currentQuestion.value.id),
          questionNumber: currentQuestion.value && isAnswerableQuestion(currentQuestion.value)
            ? questions.value.filter(isAnswerableQuestion).findIndex(q => q.id === currentQuestion.value.id) + 1 : null,
          instruction: isInstructionQuestion(currentQuestion.value),
          subtest: String(currentQuestion.value?.subtestKey || currentQuestion.value?.subtest || '').slice(0, 100),
          visibility: document.visibilityState === 'hidden' ? 'hidden' : 'visible',
          saveState: saveState.value,
        },
      })
      if (result.ended) {
        stopped = true
        onEnded?.()
      }
    } catch { /* The next heartbeat retries without interrupting the assessment. */ }
    finally { busy = false }
  }

  function schedule() {
    clearTimeout(debounce)
    debounce = setTimeout(report, 300)
  }
  watch([status, currentIndex, saveState], schedule)
  onMounted(() => {
    timer = setInterval(report, 15000)
    document.addEventListener('visibilitychange', schedule)
    window.addEventListener('online', schedule)
    report()
  })
  onBeforeUnmount(() => {
    stopped = true
    clearInterval(timer)
    clearTimeout(debounce)
    document.removeEventListener('visibilitychange', schedule)
    window.removeEventListener('online', schedule)
  })
}
