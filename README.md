# North Star Santa Website

React/Vite website for North Star Santa with Sanity-backed testimonials, gallery photos, booking requests, and admin approval in Sanity Studio.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/Radix UI components
- Sanity CMS
- Vercel deployment

## Local App Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Required app environment variables:

```txt
VITE_SANITY_PROJECT_ID=your_sanity_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2025-01-01
VITE_SANITY_STUDIO_URL=https://your-studio-host.sanity.studio
SANITY_WRITE_TOKEN=your_server_side_sanity_write_token
```

Only the `VITE_` values are exposed to browser code. `SANITY_WRITE_TOKEN` is used only by Vercel serverless functions in `api/` and must not be committed.

## Sanity Studio

The Studio lives in `studio/` so the existing Vite app does not need to become a Next.js app or a Sanity Studio app.

```bash
cd studio
npm install
SANITY_STUDIO_PROJECT_ID=your_sanity_project_id SANITY_STUDIO_DATASET=production npm run dev
```

Schemas included:

- `testimonial`
- `galleryPhoto`
- `bookingRequest`
- `siteSettings`

Visitor submissions are created with `approved: false`. Public pages only query approved testimonials and gallery photos. Booking requests are created with status `New`; update them in Studio to `Contacted`, `Booked`, or `Declined`.

## Vercel

Vercel should use the root project:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add the same environment variables from `.env.example` in Vercel Project Settings. `vercel.json` rewrites non-API routes to `index.html` so direct refreshes work for React Router.

## Build

```bash
npm run build
```
