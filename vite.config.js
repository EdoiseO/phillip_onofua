import { cp } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
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
      return html.replace(outlet, () => renderStaticPage(basename(filename)));
    },
  },
};

// The scene owns its module graph and loads assets by URL. Ship it as a
// separate static page so its import map, cache keys and lazy imports survive.
const comicCollection = {
  name: 'portfolio-comic-collection',
  async writeBundle({ dir }) {
    await cp(resolve(root, 'off-the-clock'), resolve(dir, 'off-the-clock'), {
      recursive: true,
      filter: source => !source.endsWith('.test.mjs'),
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
