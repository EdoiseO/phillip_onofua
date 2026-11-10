import { cp } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vercel from './vercel.json' with { type: 'json' };

const root = import.meta.dirname;
const pages = [
  'index.html',
  'student-market.html',
  'receipt-splitter.html',
  'overlay-studio.html',
  'privacy.html',
  'terms.html',
  'off-the-clock/index.html',
];

const staticReactPages = {
  name: 'portfolio-static-react-pages',
  transformIndexHtml: {
    order: 'post',
    async handler(html, { filename, server }) {
      const outlet = '<!--react-page-->';
      if (!html.includes(outlet)) return html;

      const { renderStaticPage } = server
        ? await server.ssrLoadModule('/src/render-static.jsx')
        : await import(pathToFileURL(resolve(root, '.static-renderer/render-static.js')).href);
      const page = relative(root, filename).split(sep).join('/');
      return html.replace(outlet, () => renderStaticPage(page));
    },
  },
};

// The browser loads the scene's module graph through its import map. Keep
// those modules and assets at the paths warmed by the homepage.
const comicCollection = {
  name: 'portfolio-comic-collection',
  async writeBundle({ dir }) {
    await cp(resolve(root, 'off-the-clock'), resolve(dir, 'off-the-clock'), {
      recursive: true,
      filter: source => source !== resolve(root, 'off-the-clock/index.html') && !source.endsWith('.test.mjs'),
    });
  },
};

export default defineConfig(({ isSsrBuild }) => isSsrBuild ? {
  plugins: [react()],
  build: { copyPublicDir: false },
} : {
  appType: 'mpa',
  plugins: [react(), staticReactPages, comicCollection],
  resolve: {
    alias: [
      { find: /^three\/addons\//, replacement: resolve(root, 'off-the-clock/vendor/addons') + '/' },
      { find: /^three$/, replacement: resolve(root, 'off-the-clock/vendor/three.module.js') },
    ],
  },
  build: {
    assetsDir: 'bundles',
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: pages.map(page => resolve(root, page)),
    },
  },
  preview: {
    headers: Object.fromEntries(vercel.headers
      .find(rule => rule.source === '/(.*)').headers
      .map(({ key, value }) => [key, value])),
  },
});
