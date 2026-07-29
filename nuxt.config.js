// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: true },

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
    'shadcn-nuxt',
    'vue-sonner/nuxt',
  ],

  runtimeConfig: {
    public: {
      appName: 'PsyEngine',
      devTestTools: process.env.NODE_ENV !== 'production',
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
