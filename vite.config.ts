// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [
        svelte(),
        viteStaticCopy({
            targets: [
                {
                    src: 'manifest.json',
                    dest: '.' // copies to the root of the outDir
                },
                // (Optional) If you have a styles.css file, you can copy it too
                // {
                //   src: 'styles.css',
                //   dest: '.'
                // }
            ]
        })
    ],

    build: {
        // Set the output directory to 'dist'
        outDir: 'dist',

        // This is for demonstration purposes. In a real-world scenario,
        // you might want to use a more sophisticated approach.
        // See the 'Development Workflow' section below.
        // emptyOutDir: false, // Keep this false to prevent Vite from deleting your manifest.json on rebuilds

        // Tell Vite to build a library
        lib: {
            entry: 'main.ts', // Your plugin's entry point
            formats: ['cjs'],     // OBLIGATORY: Compile to CommonJS for Obsidian
            fileName: () => 'main.js', // OBLIGATORY: The output file name must be 'main.js'
        },

        // Minify the code in production builds
        minify: isProduction,

        // Generate source maps in development for easier debugging
        sourcemap: !isProduction ? 'inline' : false,

        rollupOptions: {
            // OBLIGATORY: Don't bundle Obsidian's API
            external: ['obsidian'],
        },
    },
});