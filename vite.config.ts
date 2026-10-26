import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

// assets are built into public/build, templates load them through the manifest (see ViteExtension)
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    base: '/build/',
    publicDir: false,
    build: {
        outDir: fileURLToPath(new URL('./public/build', import.meta.url)),
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: { app: fileURLToPath(new URL('./assets/app.ts', import.meta.url)) },
        },
    },
    test: {
        environment: 'happy-dom',
        include: ['assets/**/*.test.ts'],
    },
});
