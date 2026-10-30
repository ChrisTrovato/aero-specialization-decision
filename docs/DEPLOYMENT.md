# Deployment

The atlas is a standalone static application integrated into the existing `christrovato` Next.js project on Vercel.

1. Run `node check.mjs` and complete browser checks.
2. Copy the contents of `dist/` to the portfolio's `public/aero_specialization_decision/` directory.
3. Preserve all current routes and append this rewrite to `next.config.ts`:

```js
{ source: '/aero_specialization_decision', destination: '/aero_specialization_decision/index.html' }
```

4. Verify the current production baseline and intended Vercel project before release.
5. Build and deploy the complete portfolio source, not only the atlas directory. Confirm the release is READY and check the requested route and existing pages.

The existing apex-to-www redirect remains. The requested URL `https://christrovato.com/aero_specialization_decision` therefore resolves to `https://www.christrovato.com/aero_specialization_decision`.

This repository tracks the atlas as a focused project. It is not the source of the unrelated portfolio pages and should not be configured as a replacement for the entire domain. Future changes must be integrated into the current portfolio checkout before deployment.

There are no application secrets, database migrations, or server-side data services in the atlas. Avoid committing provider credentials, `.vercel`, `.openai`, private source documents, or local browser notes.
