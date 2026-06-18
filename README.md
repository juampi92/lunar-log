# 🌙 Lunar Log

A daily journal of the moon. Take or pick a photo each day, crop it to the moon, and build a visual calendar of the moon's phases over time. Lunar Log is a **fully client-side Progressive Web App** — all data lives in your browser (IndexedDB), and once installed it works completely offline.

## Features

- Calendar view of your moon log
- Take a picture with the camera or pick from the gallery
- Crop the image to focus on the moon
- Mark a day as "Not seen"
- Installable on desktop and mobile home screens
- Runs fully offline after first load

## Getting Started

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. The service worker is enabled in dev, so you can test the install prompt locally (Chrome/Edge only — over HTTPS or localhost).

### Production build & preview

```bash
npm run build
npm run preview
```

`npm run build` runs `tsc --noEmit` (typecheck) followed by `vite build`, emitting `dist/` with `sw.js`, `manifest.webmanifest`, and the precached app shell. `npm run preview` serves the production build locally.

## Installing the app

**Android (Chrome/Edge):** open the site → the in-app install banner appears, or use the menu → **Install app**.

**iOS (Safari):** open the site → tap **Share** → **Add to Home Screen**. Lunar Log shows an in-app banner with these instructions on first visit.

**Desktop (Chrome/Edge):** click the install icon in the address bar.

Once installed, Lunar Log launches in its own standalone window and works in airplane mode — all assets and entries are stored on-device.

## Sub-path deployment

By default the app is served from the domain root. To host from a sub-path, set `VITE_BASE_PATH` at build time:

```bash
VITE_BASE_PATH=/lunar-log/ npm run build
```

> Note: the manifest's `start_url` and `scope` are set to `/`. For sub-path hosting you may need to adjust these in `vite.config.ts` to match `VITE_BASE_PATH`.

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the service worker / manifest
- [idb](https://github.com/jakearchibald/idb) for IndexedDB storage
- [react-easy-crop](https://github.com/ValentineFournier/react-easy-crop) for image cropping
- [lucide-react](https://lucide.dev/) for icons

## Contributing

Feel free to contribute! If your additions diverge from the motivation below, you are free to fork it and keep your own version.

## Motivation

One of my main life philosophies is to learn how to pay attention to mundane things and learn how to get joy and awe out of them. To use mundane things as a reason to be mindful and thankful about our existence, and the moon is a great example of that.

In an age where we use watches to perfectly measure time and calendars to absolutely keep track of our days, we still fail to keep track of something as simple as the moon phases. I realized that I had no idea when the moon was going to be full until it was too late, and perhaps I would even miss it because I either forgot to look at the sky or it was a cloudy day and I wasn't even aware that I was missing a full moon due to the clouds.

Because of that, I wanted to have a more consistent way to keep track of it and potentially collect these attention moments into a very simple app that would only keep the track of a very simple representation of how the moon was that day. The goal is not to be a perfect photographer of the moon; the goal is to maybe ground the moment of attention into a collectible that will help you see the overall appearance of the moon throughout its phases.

My goal is to also expose the days that I forget to look at the moon, or the days that I simply can't because the moon is not showing or is showing very late in the night and leaves very early in the morning, and to also show the days that it is cloudy so I can't see it. The goal of this is not to have a perfect score but is just to increase awareness, and by increasing awareness we create a deeper connection with the cycles of our universe.
