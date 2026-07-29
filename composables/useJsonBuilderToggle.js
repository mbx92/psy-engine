import { ref } from 'vue'

/**
 * Builder/Raw-JSON toggle for a v-model field. `getValue`/`setValue` read and
 * write the field on the owning component's prop+emit (no internal cloning —
 * the builder UI mutates the prop directly via computed get/set).
 */
export function useJsonBuilderToggle(getValue, setValue, options = {}) {
  const { isArray = false } = options
  const emptyValue = isArray ? [] : {}

  const mode = ref('builder')
  const jsonText = ref('')
  const jsonError = ref('')

  function showJson() {
    jsonText.value = JSON.stringify(getValue() ?? emptyValue, null, 2)
    jsonError.value = ''
    mode.value = 'json'
  }

  function showBuilder() {
    try {
      const parsed = JSON.parse(jsonText.value)
      if (isArray && !Array.isArray(parsed)) throw new Error('Expected a JSON array')
      if (!isArray && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) {
        throw new Error('Expected a JSON object')
      }
      setValue(parsed)
      jsonError.value = ''
      mode.value = 'builder'
    } catch (err) {
      jsonError.value = `Invalid JSON — ${err.message}`
    }
  }

  return { mode, jsonText, jsonError, showJson, showBuilder }
}
