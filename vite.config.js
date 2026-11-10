import { defineConfig } from 'vite';
export default defineConfig({build:{rollupOptions:{input:{store:'index.html',account:'account.html',admin:'admin.html'}}}});
