export const DESIGN_THEMES = [
  {
    id: 'minimax',
    label: 'Studio',
    description: 'Product-forward surface with pill CTAs and high contrast.',
  },
  {
    id: 'ibm',
    label: 'Corporate',
    description: 'Enterprise psychology surface — square geometry and clinical restraint.',
  },
]

const THEME_IDS = new Set(DESIGN_THEMES.map((t) => t.id))
const STORAGE_KEY = 'psy-design-theme'

function normalizeTheme(value) {
  return THEME_IDS.has(value) ? value : 'minimax'
}

export function useDesignTheme() {
  const theme = useCookie(STORAGE_KEY, {
    default: () => 'minimax',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const current = computed(() => normalizeTheme(theme.value))
  const currentMeta = computed(() => DESIGN_THEMES.find((t) => t.id === current.value) || DESIGN_THEMES[0])

  function setTheme(id) {
    theme.value = normalizeTheme(id)
  }

  useHead(() => ({
    htmlAttrs: {
      'data-theme': current.value,
    },
  }))

  return {
    theme: current,
    currentMeta,
    themes: DESIGN_THEMES,
    setTheme,
  }
}
