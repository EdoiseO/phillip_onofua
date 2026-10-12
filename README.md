# Phillip Onofua | Full-Stack Developer Portfolio

A responsive portfolio presenting my full-stack web, Windows desktop, and product-development work.

[View the live portfolio](https://philliponofua.vercel.app) · [Download my résumé](https://philliponofua.vercel.app/assets/phillip-onofua-resume.pdf)

![Phillip Onofua’s dark developer portfolio and featured work](assets/portfolio-preview.jpg)

## Overview

This repository contains the source for my personal portfolio. The homepage pairs a letter-by-letter animated headline with real product previews, direct résumé access, and two featured projects. Each project links to a dedicated case study with implementation details, real interface captures, and clear status information; the Receipt Splitter concept appears separately as work in exploration.

The portfolio is intentionally lightweight: it uses static HTML, CSS, and JavaScript, has no runtime dependencies, and deploys directly from the `main` branch.

## Featured work

### Student Market of Toronto

An end-to-end student marketplace connecting catalogue discovery, listing management, messaging, profiles, media storage, and protected moderation workflows.

The case study opens with the working interface, a summary of the problem and my contribution, and grouped galleries covering marketplace, messaging, profiles, administration, mobile interfaces, and the data model. The engineering sections explain request-scoped authentication, bounded server-rendered queries, recoverable listing writes, realtime communication, and auditable report review. An expandable technical-notes section preserves the deeper implementation detail.

- **Role:** Team lead and full-stack developer
- **Stack:** Next.js, React, Supabase, PostgreSQL, Tailwind CSS, and Vercel
- [Open the live project](https://student-market-of-toronto.vercel.app)
- [View the source code](https://github.com/EdoiseO/student-market-of-toronto)
- [Read the engineering case study](https://philliponofua.vercel.app/student-market.html)

### Overlay Studio

A Windows desktop application for managing reusable overlay instances, customizing their appearance, previewing live data, and preparing browser-source URLs for OBS.

The case study shows the instance library, live customizers, Windows media integration, grouped social overlays, persistent settings, and a recorded product demonstration.

- **Role:** Product designer and developer
- **Stack:** Python, JavaScript, aiohttp, WebSockets, WebView2, and OBS Studio
- **Status:** Working production application in active development
- [Explore how Overlay Studio works](https://philliponofua.vercel.app/overlay-studio.html)

### Receipt Splitter

A work-in-progress mobile product concept for assigning shared receipt items, tax, and tip and producing clear totals for each person.

The project page separates the concept from finished work and documents the problem, proposed verification flow, open technical decisions, and next development milestones.

- **Status:** Concept and workflow definition
- [Review the Receipt Splitter plan](https://philliponofua.vercel.app/receipt-splitter.html)

## Portfolio features

- Dark-only, responsive editorial layout with clear navigation
- Original letter-by-letter hero animation, product previews, and prominent résumé access
- Animation pause control, reduced-motion support, and a readable fallback without JavaScript
- Two featured projects using real product captures, with concepts presented separately
- Dedicated case-study pages with project-specific metadata and social previews
- Product-first Student Market case study with expandable technical notes
- Student Market workflow galleries with thumbnails, image zoom, and full-size viewing
- Overlay Studio screenshots and an embedded product demo
- Semantic HTML, skip links on the refreshed pages, visible keyboard focus, descriptive alternative text, and reduced-motion support
- Downloadable résumé, direct contact links, privacy policy, and terms of use

## Built with

- HTML5
- CSS3
- Vanilla JavaScript
- HTML Dialog API
- Vercel

There is no package installation or build step. All required fonts, images, logos, scripts, and media are committed with the site.

## Run locally

```bash
git clone https://github.com/EdoiseO/phillip_onofua.git
cd phillip_onofua
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## Repository structure

```text
.
├── index.html                         # Portfolio homepage
├── student-market.html                # Student Market engineering case study
├── overlay-studio.html                # Overlay Studio product case study
├── receipt-splitter.html              # Work-in-progress product plan
├── privacy.html                       # Privacy policy
├── terms.html                         # Terms of use
├── assets/
│   ├── styles.css                     # Base presentation styles
│   ├── overrides.css                  # Shared case-study and supporting-page styles
│   ├── home.css                       # Self-contained responsive homepage styles
│   ├── hero-motion.js                 # Letter animation and motion preferences
│   ├── case-study-refresh.css         # Student Market product-first layout and technical notes
│   ├── student-market-gallery.js      # Student Market gallery and zoom interactions
│   ├── student-market-*.{png,jpg}     # Desktop, mobile, admin, and data-model captures
│   ├── overlay-studio-*.png           # Overlay Studio interface captures
│   ├── overlay-studio-demo.webm       # Recorded Overlay Studio demonstration
│   ├── tech-logos/                    # Self-hosted technology brand marks
│   ├── portfolio-preview.jpg          # README and social preview image
│   └── phillip-onofua-resume.pdf      # Downloadable résumé
└── README.md
```

## Deployment

Vercel deploys the production site from the `main` branch.

Technology brand marks are sourced from [Devicon](https://devicon.dev) and [Simple Icons](https://simpleicons.org). The document and external-link symbols are from [Bootstrap Icons](https://icons.getbootstrap.com). All trademarks belong to their respective owners.

## Contact

- [GitHub](https://github.com/EdoiseO)
- [Email](mailto:philliponofua@gmail.com)
