import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import cloudflare from '@astrojs/cloudflare'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [react(), tailwind()],
  vite: {
    define: {
      'process.env.PUBLIC_SUPABASE_URL': JSON.stringify(process.env.PUBLIC_SUPABASE_URL),
      'process.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.PUBLIC_SUPABASE_ANON_KEY),
      'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY),
      'process.env.KEX_APP_KEY': JSON.stringify(process.env.KEX_APP_KEY),
      'process.env.KEX_APP_ID': JSON.stringify(process.env.KEX_APP_ID),
      'process.env.KEX_MERCHANT_ID': JSON.stringify(process.env.KEX_MERCHANT_ID),
      'process.env.KEX_ENV': JSON.stringify(process.env.KEX_ENV),
    }
  }
})
