import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const githubToken = env.VITE_GITHUB_TOKEN

  return {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/github-api': {
          target: 'https://api.github.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/github-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('User-Agent', 'uptime-assignment')
              if (proxyReq.path?.startsWith('/graphql')) {
                proxyReq.setHeader('Accept', 'application/json')
              } else {
                proxyReq.setHeader('Accept', 'application/vnd.github+json')
                proxyReq.setHeader('X-GitHub-Api-Version', '2022-11-28')
              }
              if (githubToken) {
                proxyReq.setHeader('Authorization', `Bearer ${githubToken}`)
              }
            })
          },
        },
      },
    },
  }
})
