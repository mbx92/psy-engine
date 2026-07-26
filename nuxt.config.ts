// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },

  modules: [

    ['@nuxtjs/tailwindcss', {
      cssPath: '~/assets/css/main.css',
      configPath: 'tailwind.config.js',
    }],
    'shadcn-nuxt',
  ],

  runtimeConfig: {
    public: {
      appName: 'PsyEngine',
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
