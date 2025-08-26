import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                // Cache API responses by URL without auth headers
                const url = new URL(request.url)
                return url.pathname + url.search
              },
            },
          },
          {
            urlPattern: /^https:\/\/eutils\.ncbi\.nlm\.nih\.gov\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pubmed-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      manifest: {
        name: 'MedResearch AI - Clinical Trial & Drug Research Assistant',
        short_name: 'MedResearch AI',
        description: 'AI-powered medical research assistant for clinical trials and drug research',
        theme_color: '#0ea5e9',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['medical', 'education', 'research', 'productivity'],
        lang: 'en',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-1.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Research paper analysis interface',
          },
          {
            src: '/screenshots/mobile-1.png',
            sizes: '375x812',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile chat interface',
          },
        ],
        shortcuts: [
          {
            name: 'New Research Query',
            short_name: 'Research',
            description: 'Start a new medical research query',
            url: '/?action=research',
            icons: [{ src: '/icons/shortcut-research.png', sizes: '96x96' }],
          },
          {
            name: 'Clinical Trials',
            short_name: 'Trials',
            description: 'Search clinical trials database',
            url: '/?action=trials',
            icons: [{ src: '/icons/shortcut-trials.png', sizes: '96x96' }],
          },
          {
            name: 'Bookmarks',
            short_name: 'Saved',
            description: 'View saved research papers',
            url: '/?action=bookmarks',
            icons: [{ src: '/icons/shortcut-bookmarks.png', sizes: '96x96' }],
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          agents: [
            './src/agents/BaseAgent',
            './src/agents/OrchestratorAgent',
            './src/agents/ErrorHandlingAgent',
            './src/agents/CachingAgent',
            './src/agents/DataSourcingAgent',
            './src/agents/ValidationAgent',
            './src/agents/AgentManager',
          ],
          'ui-vendor': ['tailwindcss'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['vue', 'vue-router'],
  },
})
