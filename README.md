# Research Journey

A personal, Netlify-ready research notebook for topics, papers, working notes and published writing.

## Run locally

```sh
npm install
npm run dev
```

Open `/adminzzz` to edit entries. There is intentionally no sign-in or backend: drafts, published entries and revision history are saved in the browser that you use to edit the site.

## Deploy to Netlify

Connect this `research_journey` folder as a Netlify site. The included configuration builds the Vite app with `npm run build` and publishes `dist`.

Important: because this is a static Netlify site without authentication or a database, edits made in `/adminzzz` are private to that browser and do not update the deployed site for other visitors. To publish a shared update, copy the final content into the starter data and redeploy, or later add a content backend (such as Netlify CMS/Decap with Git Gateway).
