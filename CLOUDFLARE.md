# Cloudflare Pages

Connect this repository in Cloudflare Workers & Pages using **Create application > Pages > Import an existing Git repository**.

- Framework preset: None
- Production branch: main (use the migration branch for the first preview)
- Build command: `node build-cloudflare.mjs`
- Build output directory: `dist`
- Root directory: repository root
- Environment variables: none

The build copies only website assets and converts the existing Vercel security headers to Cloudflare's `_headers` format. It includes a real 404 page to disable Pages' default SPA fallback.

Before cutover, verify all project pages, the off-the-clock interactive scene, images, downloads, CSP response headers, and a missing-page 404 on the preview. Update canonical/social URLs and links to Student Market after the final hostnames are known. Vercel-owned `vercel.app` addresses cannot be moved to Cloudflare; use the assigned `pages.dev` address or a domain you own.

Keep the Vercel deployment available until the Cloudflare site passes checks. Removing a project does not itself cancel a paid Vercel team subscription.
