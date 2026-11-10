import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
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

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), comicCollection],
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
