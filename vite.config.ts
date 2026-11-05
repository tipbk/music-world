import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes every file path relative, so the site works on
// GitHub Pages at https://<user>.github.io/<repo>/ whatever the repo is called.
export default defineConfig({
  base: './',
  plugins: [react()],
});
