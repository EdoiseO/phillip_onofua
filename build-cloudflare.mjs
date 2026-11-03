import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

// Publish only website files, never repository metadata or build tooling.
const root = new URL('./', import.meta.url);
const output = new URL('./dist/', root);
await mkdir(output, { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    await cp(new URL(entry.name, root), new URL(entry.name, output));
  }
}
for (const directory of ['assets', '_next', 'off-the-clock']) {
  await cp(new URL(directory, root), new URL(directory, output), {
    recursive: true,
    filter: path => !/\.(?:md|test\.mjs)$/.test(path),
  });
}
const config = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
const headers = config.headers.find(rule => rule.source === '/(.*)').headers;
await writeFile(new URL('_headers', output), '/*\n' + headers.map(({ key, value }) => `  ${key}: ${value}`).join('\n') + '\n');
// A top-level 404 prevents Pages from treating this multi-page site as an SPA.
await writeFile(new URL('404.html', output), '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>Page not found</h1><p><a href="/">Return to portfolio</a></p></html>\n');
console.log('Cloudflare Pages files ready in dist/');
