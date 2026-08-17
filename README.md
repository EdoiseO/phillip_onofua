# Phillip Onofua — Developer Portfolio

A responsive personal portfolio showcasing my production web and Windows desktop development work, technical skills, education, and contact information.

[View the live portfolio](https://philliponofua.vercel.app)

![Phillip Onofua portfolio homepage](assets/portfolio-preview.png)

## Overview

This repository contains the source for my portfolio website. It is delivered as a static HTML, CSS, and JavaScript site built to present selected work clearly, load quickly, and remain usable across desktop and mobile devices.

## Technical highlights

- Responsive layouts designed for desktop and mobile
- Animated hero headline with reduced-motion support and screen-reader-friendly text
- Staggered project reveals with restrained interaction motion
- Dedicated project case studies with alternating screenshot-and-explanation layouts
- Inline responsive screenshots and recorded product demos without carousel navigation
- Expandable project details with smooth opening and closing transitions on mobile
- Sticky navigation and a consistent dark-only visual presentation
- Dedicated privacy and terms pages
- Downloadable résumé and direct contact links
- Semantic HTML and keyboard-accessible interactions
- Canonical and social-sharing metadata for consistent link previews
- Self-hosted technology logos with theme-aware presentation

## Featured projects

### Student Market of Toronto

A student-focused marketplace for discovering, listing, saving, and discussing items across Toronto campuses. Its case study documents the responsive marketplace, listing details, buyer–seller messaging, profile management, and protected moderation and report-review workflows. The project uses Next.js, React, Supabase, PostgreSQL, and Tailwind CSS.

**Role:** Team lead and full-stack developer

- [Open the live project](https://student-market-of-toronto.vercel.app)
- [View the source code](https://github.com/EdoiseO/student-market-of-toronto)
- [Read the portfolio case study](student-market.html)

### Overlay Studio

A production Windows desktop application for previewing, customizing, and launching animated OBS overlays. Its case study includes current interface screenshots and a recorded live demo. The source code is private, and the application is actively maintained as the interface and overlay library continue to evolve.

**Status:** Production application; active development

- [Read the portfolio case study](overlay-studio.html)

### Receipt Splitter

A planned mobile app for assigning shared receipt items, tax, and tip to individual people. This project is currently a work in progress.

**Status:** Work in progress

- [Read the product plan](receipt-splitter.html)

## Built with

- HTML5
- CSS3
- Vanilla JavaScript
- Web Animations API
- Vercel

The portfolio has no runtime dependencies or build step; all required static assets are committed with the site.

## Run locally

Clone the repository and start a local static server:

```bash
git clone https://github.com/EdoiseO/phillip_onofua.git
cd phillip_onofua
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Repository structure

```text
.
├── _next/static/media/                # Font assets used by the compiled base styles
├── index.html                         # Page content and interactions
├── student-market.html                # Student Market case study
├── overlay-studio.html                # Overlay Studio case study
├── receipt-splitter.html              # Work-in-progress product plan
├── privacy.html                       # Privacy policy
├── terms.html                         # Terms of use
├── assets/
│   ├── styles.css                     # Base styles
│   ├── overrides.css                  # Responsive layout and visual refinements
│   ├── profile-photo.jpg              # Portfolio profile image
│   ├── portfolio-preview.png          # README portfolio preview
│   ├── student-market-*.png            # Student Market desktop and mobile screenshots
│   ├── overlay-studio-*.png            # Overlay Studio case-study screenshots
│   ├── overlay-studio-demo.webm        # Overlay Studio live product demo
│   ├── tech-logos/                     # Self-hosted technology brand marks
│   └── phillip-onofua-resume.pdf      # Downloadable résumé
└── README.md
```

## Deployment

The production site is deployed on Vercel from the `main` branch.

Technology brand marks are sourced from [Devicon](https://devicon.dev) and [Simple Icons](https://simpleicons.org). All trademarks belong to their respective owners.

## Contact

- [GitHub](https://github.com/EdoiseO)
- [Email Phillip](mailto:philliponofua@gmail.com)
