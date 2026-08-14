# Phillip Onofua — Developer Portfolio

A responsive personal portfolio showcasing Phillip Onofua's full-stack and desktop development work, technical focus, education, and contact information.

**Live site:** [philliponofua.vercel.app](https://philliponofua.vercel.app)

## Highlights

- Responsive layouts designed for desktop and mobile
- Animated hero headline with reduced-motion support and screen-reader-friendly text
- Three featured project cards with live links, source code, demos, and honest project status
- Expandable project details with smooth opening and closing transitions on mobile
- Sticky navigation and light/dark theme selection with saved preferences
- Downloadable résumé and direct contact links
- Built with semantic HTML and accessibility-conscious interactions

## Featured projects

### Student Market of Toronto

A student-focused marketplace for discovering, listing, saving, and discussing items across Toronto campuses. The project uses Next.js, React, Supabase, PostgreSQL, and Tailwind CSS.

- [Open the live project](https://student-market-of-toronto.vercel.app)
- [View the source code](https://github.com/EdoiseO/student-market-of-toronto)

### Overlay Studio

A Windows desktop application for previewing, customizing, and launching animated OBS overlays. The portfolio includes a recorded product demo; the application is currently developed in a private repository.

### Receipt Splitter

A mobile app for assigning shared receipt items, tax, and tip to individual people. This project is currently a work in progress.

## Portfolio stack

- HTML5
- CSS3
- Vanilla JavaScript
- Web Animations API
- Vercel

The site is intentionally framework-free and runs as a static website with no build step.

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
├── index.html                         # Page content and interactions
├── assets/
│   ├── styles.css                     # Base styles
│   ├── overrides.css                  # Responsive layout and visual refinements
│   ├── profile-photo.jpg              # Portfolio profile image
│   ├── student-market-placeholder.png # Student Market project artwork
│   ├── overlay-studio-demo.webm       # Overlay Studio product demo
│   └── phillip-onofua-resume.pdf      # Downloadable résumé
└── README.md
```

## Deployment

The production site is deployed on Vercel from the `main` branch.

## Contact

- [GitHub](https://github.com/EdoiseO)
- [Email Phillip](mailto:philliponofua@gmail.com)
