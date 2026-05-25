import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {spawn} from 'child_process';

export default defineConfig(() => {
  // Automatically spawn the backend Express API server on port 3001 for development
  if (process.env.NODE_ENV !== 'production') {
    console.log("⚙️  Spawning backend API Express server on port 3001...");
    const apiServer = spawn('npx', ['tsx', 'server.ts'], {
      env: { ...process.env, PORT: '3001', NODE_ENV: 'development' },
      stdio: 'inherit',
      shell: true
    });
    
    process.on('exit', () => {
      try {
        apiServer.kill();
      } catch (e) {}
    });
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
