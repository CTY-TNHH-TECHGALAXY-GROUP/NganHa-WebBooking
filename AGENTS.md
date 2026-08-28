<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project handoff notes

- Deployment work should target the `vercel` branch unless the user explicitly says otherwise.
- Read `README.md` and `DEVELOPMENT_NOTES.md` before making feature changes.
- Keep the homepage default on the video hero, not the book section.
- Reuse `src/lib/flipbook/` for flipbook iframe/message behavior.
- Reuse `src/lib/bookingCartStorage.ts` for cart persistence and updates.
- Do not rewrite the book/Galaxy transition with visual masking; fix stale state, transforms, classes, timers, or animation timelines at the source.
