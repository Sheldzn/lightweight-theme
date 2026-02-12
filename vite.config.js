import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import cleanPlugin from 'vite-plugin-clean';

const isWatch = process.env.BUILD_WATCH === 'true';

export default defineConfig({
  build: {
    ...(isWatch && {
      watch: {
        exclude: [
          path.resolve(__dirname, 'assets/**/*'),
          path.resolve(__dirname, 'config/**/*'),
          path.resolve(__dirname, 'locales/**/*'),
          path.resolve(__dirname, 'templates/**/*'),
        ],
      },
    }),
    root: './',
    outDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'src/js/app.js'),
        style: path.resolve(__dirname, 'src/styles/app.css'),
      },
      output: {
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
  plugins: [
    tailwindcss(),
    cleanPlugin({
      targetFiles: ['assets/app.css', 'assets/app.js'],
    }),
  ],
});
