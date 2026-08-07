// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    // Keep Nuxt 3 defaults; avoids schema crash when `future` is undefined
    compatibilityVersion: 3,
  },
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  app: {
    head: {
      title: 'PsyEngine',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  modules: [

    ['@nuxtjs/tailwindcss', {
      cssPath: '~/assets/css/main.css',
      configPath: 'tailwind.config.js',
    }],
    ['@nuxtjs/color-mode', {
      classSuffix: '',
      preference: 'system',
      fallback: 'light',
    }],
    'shadcn-nuxt',
    'vue-sonner/nuxt',
  ],

  runtimeConfig: {
    public: {
      appName: 'PsyEngine',
      // Always false in builds unless explicitly enabled:
      // NUXT_PUBLIC_DEV_TEST_TOOLS=true
      // UI also allows import.meta.dev (local `pnpm dev` only).
      devTestTools: false,
    },
  },

  experimental: {
    // Avoid Vite cold-start "#app-manifest" resolve race in Nuxt 3.21.x
    appManifest: false,
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
