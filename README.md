# Phillip Onofua | Full-Stack Developer Portfolio

A responsive portfolio presenting my full-stack web, Windows desktop, and product-development work.

[View the live portfolio](https://philliponofua.vercel.app) · [Download my résumé](https://philliponofua.vercel.app/assets/phillip-onofua-resume.pdf)

![Phillip Onofua’s dark developer portfolio and featured work](public/assets/portfolio-preview.jpg)

## Overview

This repository contains the source for my personal portfolio. The homepage pairs a letter-by-letter animated headline and skills-focused introduction with product previews, direct résumé access, two detailed case studies, an Android prototype, and a live interactive 3D collection.

Vite renders the React pages to static HTML at build time. Off the clock is the only page that runs React in the browser, where it mounts the Three.js scene. The homepage animation and Student Market gallery use standalone JavaScript.

## Featured work

### Student Market of Toronto

An end-to-end student marketplace connecting catalogue discovery, listing management, messaging, profiles, media storage, and protected moderation workflows.

The case study opens with the working interface, a summary of the problem and my contribution, and grouped galleries covering marketplace, messaging, profiles, administration, mobile interfaces, and the data model. The engineering sections explain request-scoped authentication, bounded server-rendered queries, recoverable listing writes, realtime communication, and auditable report review. An expandable technical-notes section preserves the deeper implementation detail.

- **Role:** Team lead of a five-person team and full-stack developer
- **Stack:** Next.js, React, Supabase, PostgreSQL, and Tailwind CSS
- **Demo hosting:** Vercel
- [Open the live project](https://student-market-of-toronto.vercel.app)
- [View the source code](https://github.com/EdoiseO/student-market-of-toronto)
- [Read the engineering case study](https://philliponofua.vercel.app/student-market.html)
- [Read current deployment limitations](https://github.com/EdoiseO/student-market-of-toronto/blob/main/docs/deployment.md)

### Overlay Studio

A Windows desktop application for managing reusable overlay instances, customizing their appearance, previewing live data, and preparing browser-source URLs for OBS.

The case study covers the twelve-overlay library, audio-reactive animation, request pacing, local-server security, privacy, and packaging. It includes a recorded demonstration and code highlights showing how draft previews stay separate from saved output.

- **Role:** Product designer and developer
- **Stack:** Python, JavaScript, aiohttp, WebSockets, WebView2, and OBS Studio
- **Status:** Working desktop application in active development
- [Explore how Overlay Studio works](https://philliponofua.vercel.app/overlay-studio.html)
- [Watch the demonstration](https://philliponofua.vercel.app/overlay-studio.html#overlay-demo)

### Restaurant Guide

An Android team prototype built with Kotlin and Jetpack Compose for browsing restaurant details, photos, ratings, and visit notes. Its records currently use session and saved UI state; durable storage is planned.

- **Role:** Lead developer
- **Stack:** Kotlin, Jetpack Compose, and Android
- [View the source](https://github.com/EdoiseO/COMP3074-RestaurantGuide)

### Off the clock

A 3D comic collection you can open and browse. Slide a comic out of its sleeve for a closer look, tear open a Ben 10 mystery bag and file its three pulls, or switch to the DC Compact Comics shelf. The sticker studio lets you decorate the box and saves your layout on the current device.

- **Stack:** React, JavaScript, and Three.js
- [Explore the collection](https://philliponofua.vercel.app/off-the-clock/)

The [Receipt Splitter concept](https://philliponofua.vercel.app/receipt-splitter.html) remains available separately as work in exploration.

## Portfolio features

- Dark-only, responsive editorial layout with clear navigation
- Letter-by-letter headline animation, product previews, and prominent résumé access
- Quick links to web, desktop, mobile, and 3D projects, plus grouped language skills
- Homepage animation pause control and keyboard and reduced-motion support for the 3D collection
- Restaurant Guide design gallery and a compact row of smaller builds
- Dedicated case-study pages with project-specific metadata and social previews
- Product-first Student Market case study with expandable technical notes
- Student Market workflow galleries with thumbnails, image zoom, and full-size viewing
- Overlay Studio screenshots and a recorded product demo near the top of its case study
- Semantic HTML, skip links on the refreshed pages, visible keyboard focus, and descriptive alternative text
- Downloadable résumé, direct contact links, privacy policy, and terms of use

## Run locally

Use Node.js 22.12 or later with npm.

```bash
git clone https://github.com/EdoiseO/phillip_onofua.git
cd phillip_onofua
npm ci
npm run dev
```

Open the URL Vite prints, usually [http://localhost:5173](http://localhost:5173).

Build and test the production output locally with these commands.

```bash
npm run build
npm test
npm run preview
```

The preview serves `dist/` with the security headers from `vercel.json`. Run the build before the tests so they also check the generated HTML.

## Repository structure

```text
.
├── src/
│   ├── pages/                         # React pages and page-specific components
│   ├── components/                    # Shared React layouts
│   ├── render-static.jsx              # Build-time page rendering
│   └── off-the-clock-entry.jsx        # Browser entry for the 3D collection
├── index.html                         # Homepage HTML template
├── off-the-clock/                     # Collection HTML, Three.js scene, and assets
├── student-market.html                # Student Market engineering case study
├── overlay-studio.html                # Overlay Studio product case study
├── receipt-splitter.html              # Work-in-progress product plan
├── privacy.html                       # Privacy policy
├── terms.html                         # Terms of use
├── public/assets/
│   ├── styles.css                     # Base presentation styles
│   ├── overrides.css                  # Shared case-study and supporting-page styles
│   ├── home.css                       # Self-contained responsive homepage styles
│   ├── hero-motion.js                 # Letter animation and motion preferences
│   ├── case-study-refresh.css         # Student Market product-first layout and technical notes
│   ├── student-market-gallery.js      # Student Market gallery and zoom interactions
│   ├── student-market-*.{png,jpg}     # Desktop, mobile, admin, and data-model captures
│   ├── overlay-studio-*.png           # Overlay Studio interface captures
│   ├── overlay-studio-demo.webm       # Recorded Overlay Studio demonstration
│   ├── restaurant-guide/              # Replaceable Restaurant Guide design screenshots
│   ├── tech-logos/                    # Self-hosted technology brand marks
│   ├── portfolio-preview.jpg          # README and social preview image
│   └── phillip-onofua-resume.pdf      # Downloadable résumé
├── tests/                             # Browser regressions for the 3D collection
├── vite.config.js                     # Site build and preview configuration
└── vercel.json                        # Deployment, headers, and redirects
```

## Deployment

Vercel runs `npm run build` and deploys `dist/` from the `main` branch. The build preserves the separate page URLs and serves `public/assets/` at `/assets/`. Vercel redirects `/off-the-clock` to `/off-the-clock/` so the scene’s relative asset URLs resolve correctly.

### Browser security

`vercel.json` applies a Content Security Policy, MIME-sniffing and framing protection, a referrer policy, and restrictions on unused browser permissions to every route. Vercel supplies HSTS. Scripts, styles, fonts, media, and connections are same-origin; image textures may also use data/blob URLs. The sole inline script is the hash-approved Three.js import map. If that map changes, update its SHA-256 in the policy. No `unsafe-inline` or `unsafe-eval` exception is required. Browser styling uses CSSOM properties rather than inline style blocks.

The October 22, 2026 advisory check found no GitHub advisory matches for the vendored Three.js `0.186.0` (r186). [CVE-2020-28496](https://github.com/advisories/GHSA-fq6p-x6j3-cmmq) affects versions below `0.125.0`; [CVE-2022-0177](https://github.com/advisories/GHSA-7vvq-7r29-5vg3) is withdrawn and listed versions below `0.137.0`. This is a point-in-time advisory check, not a guarantee against undisclosed vulnerabilities. The vendored files are not covered by npm audit; recheck advisories when updating them.

Technology brand marks are sourced from [Devicon](https://devicon.dev) and [Simple Icons](https://simpleicons.org). The document and external-link symbols are from [Bootstrap Icons](https://icons.getbootstrap.com). All trademarks belong to their respective owners.

## Contact

- [GitHub](https://github.com/EdoiseO)
- [Email](mailto:phillip.onofua@gmail.com)

## Off the clock

The scene grew out of the Short Box prototype. The box starts with 30 entries, including two Ben 10 mystery bags. Compacts has a separate shelf for *Static: Season One* and *Green Arrow: Year One*.

The homepage can prefetch the files needed to show the box on a suitable connection. The box appears before comic artwork starts downloading, and the paperback scene and textures load when visitors select Compacts. Both scenes share the same copy of Three.js through the import map.

Collection metadata and artwork credits are in [`off-the-clock/comics.js`](off-the-clock/comics.js). The vendored library includes the [Three.js license](off-the-clock/vendor/THREE-LICENSE.txt).

## How I built this

I designed and built this portfolio with AI coding assistants (ChatGPT/Codex and Claude) to speed up implementation and review; I am responsible for the architecture and can walk through the code.
