import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 项目页路径：https://270sun.github.io/sanguo/
// 本地开发用 ./，CI 构建（GITHUB_ACTIONS=true）用 /sanguo/
const isCI = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  plugins: [vue()],
  base: isCI ? '/sanguo/' : './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  build: {
    target: 'es2018',
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
