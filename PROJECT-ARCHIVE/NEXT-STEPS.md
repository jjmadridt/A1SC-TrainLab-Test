# A1SC Train Lab — Resume Here

**Updated:** 2026-11-05 (project-local date)  
**Current work:** Swim first implementation; resume at **Step 190**.  
**Branch:** `cycle-development-v2` — do not merge into `trainlab-update-06` yet.

## Immediate objective

Reconcile the initial uploaded `disciplines/swim.js` with the **original approved Swim specification**, then prepare and test an integrated interface without changing working disciplines.

## Original Swim specification to preserve

- Pool and open-water selection.
- Three workout categories; **13 workouts** (exact original workout labels and details should be checked against the original conversation or design assets before coding; prior assistant recollections are not authoritative).
- Six approved male/female swimmer illustrations; verify actual asset filenames and artwork before integration.
- Pool sizes: 25 m, 50 m, 25 yd, 50 yd, custom.
- Recurring weekly workout planning.
- English and Spanish.
- **Logging and history are a later step**, after interface testing.

## Next engineering actions

1. Inspect the current development-branch `index.html`, `disciplines/swim.js`, `sw.js`, and available swimmer images. Compare against the supplied baseline ZIP; avoid guessing asset paths.
2. Identify the minimum changed files required to connect a `swim-builder` to the existing navigation while preserving Run/Cycle/Total Body and the shared athlete profile.
3. Replace the simplified Swim design with the approved interface and verify the full 13-workout catalog and illustrations.
4. Package **only modified files** with correct relative paths; syntax-check before delivery.
5. Upload to development, commit, then test at https://cycle-development-v2.a1sc-trainlab.pages.dev/ (not the GitHub Pages URL).
6. Test both languages, weekly persistence, pool/open-water UI, illustrations, and regressions. Confirm PWA cache updates as needed.
7. Add activity logging/history only after interface approval. Merge to production only after QA and diff review.

## Important known issue

GitHub screenshot confirmed Swim commit `16e525f`, but the app screenshot still showed `En desarrollo`. The supplied `index.html` loads the Swim script yet does not render a Swim builder in its `show()` handler. The screenshot was from a GitHub Pages URL, **not** the designated Cloudflare preview, so verify the actual development deployment before drawing conclusions about Cloudflare.

## Links

- [GitHub development branch](https://github.com/jjmadridt/A1SC-TrainLab-Test/tree/cycle-development-v2)
- [Swim module](https://github.com/jjmadridt/A1SC-TrainLab-Test/blob/cycle-development-v2/disciplines/swim.js)
- [Cloudflare development preview](https://cycle-development-v2.a1sc-trainlab.pages.dev/)
- [Production app](https://a1sc-trainlab.pages.dev/)

## Future chat handoff

Read `ARCHITECTURE.md`, `DEVELOPMENT-LOG.md`, and `NEXT-STEPS.md` **before** proposing code changes. Verify live GitHub state and ask for missing source files only when necessary. Work one step at a time, provide direct GitHub links, and do not claim features are complete until tested.
