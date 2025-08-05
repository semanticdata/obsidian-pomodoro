// vite.config.ts
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command, mode }) => {
    const isProduction = mode === 'production';
    const outDir = isProduction ? 'dist' : '.';

    // Only use viteStaticCopy in production
    const plugins = [];
    if (isProduction) {
        plugins.push(
            viteStaticCopy({
                targets: [
                    { src: 'manifest.json', dest: '.' },
                    { src: 'styles.css', dest: '.' }
                ]
            })
        );
    }

    return {
        plugins,
        build: {
            outDir,
            lib: {
                entry: 'src/main.ts',
                formats: ['cjs'],
                fileName: () => 'main.js',
            },
            minify: isProduction,
            sourcemap: !isProduction ? 'inline' : false,
            rollupOptions: {
                external: ['obsidian'],
            },
            emptyOutDir: outDir !== '.',
        },
    };
});