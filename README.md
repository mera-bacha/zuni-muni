# Luxury Proposal Website

A self-contained cinematic proposal experience built with HTML5, CSS3 and Vanilla JavaScript. It includes ten story scenes, responsive layouts, ambient animation, an interactive memory book, a playful moving NO button, a full celebration sequence and synthesised romantic audio.

## Quick preview

### Simplest method

Open `index.html` in Chrome, Edge, Firefox or Safari.

### Recommended local server

**Windows:** Double-click `START-WEBSITE.bat`, then open `http://localhost:8080`.

**macOS/Linux:** Run:

```bash
chmod +x start-website.sh
./start-website.sh
```

Then open `http://localhost:8080`.

Python 3 is needed only for the optional local server. The website itself does not need PHP, Node.js or a database.

## Personalise the story

Open:

`assets/js/config.js`

You can change:

- Your name and your partner's name
- Countdown date and caption
- Timeline milestones
- Gallery images and captions
- Ten love reasons
- Memory-book pages
- Love letter and signature
- Funny NO-button messages
- Default audio setting and volume

## Add your photos

1. Copy your images into `assets/images/`.
2. Use compressed JPG, PNG, AVIF or WebP images for best performance.
3. In `assets/js/config.js`, replace paths such as:

```js
image: "assets/images/memory-1.svg"
```

with:

```js
image: "assets/images/our-first-date.webp"
```

Recommended image size: 1600 × 1200 pixels or similar. Keep each image below roughly 500 KB where possible.

## Music

The project uses the browser Web Audio API to generate gentle ambient piano-like notes, so no copyrighted music file is included. Browsers require a user interaction before sound starts. Music begins after the first button click when audio is enabled.

To use your own licensed music, add an audio file to `assets/audio/` and replace the synthesised audio section in `assets/js/app.js` with an HTML Audio element.

## Main features

- Ten cinematic scenes with luxury transitions
- Stars, fireflies, floating hearts and glow particles
- Responsive animated timeline
- Photo gallery with lightbox
- Ten touch-friendly flip cards
- Page-turning memory book
- Live countdown to a configurable date
- Handwritten typewriter love letter
- Sunset proposal preparation scene
- NO button that avoids the pointer and cannot be clicked
- Increasing NO-button speed, rotation, shrinking, jumping and teleporting
- Full-screen confetti, fireworks, rose petals and golden celebration
- Animated ring and couple silhouette
- Midnight night-sky mode from 12:00 a.m. to 5:59 a.m.
- Five-click heart-logo Easter egg
- Keyboard support and reduced-motion support
- Lazy-loaded gallery images
- No framework, database or build step

## Deployment

Upload the complete folder to any static host, shared hosting account or CDN. Ensure `index.html` remains at the root and keep the `assets` folder beside it.

Suitable hosting includes GitHub Pages, Netlify, Cloudflare Pages, cPanel hosting and ordinary web servers.

## Browser support

Designed for current versions of Chrome, Edge, Firefox and Safari. Older browsers that do not support Web Audio or backdrop blur will still display the core story, but some visual or audio effects may be reduced.
