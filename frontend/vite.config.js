import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false,   // hata overlay'i devre dışı — her JS hatası sayfayı kaplamasın
    },
    watch: {
      // node_modules ve büyük dizinleri izleme
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      // polling yerine native FS olayları (macOS'ta varsayılan, ama netleştiriyoruz)
      usePolling: false,
    },
  },
  build: {
    sourcemap: false,
  },
})
