# A1SC Train Lab — Development Log

**Record prepared:** 2026-11-05 (project-local date).  
**Source of truth for code:** GitHub `jjmadridt/A1SC-TrainLab-Test`.  
**Evidence:** recovered architecture document, user-provided `index.html`, branch and commit screenshots, and conversation reports. This is a continuity record, **not** a complete reconstruction of the original 180+ steps.

## Established project workflow

- Development branch: `cycle-development-v2`.
- Release branch: `trainlab-update-06`.
- Development preview: https://cycle-development-v2.a1sc-trainlab.pages.dev/
- Production: https://a1sc-trainlab.pages.dev/
- Changes are tested in development and reviewed before merging to production. Cloudflare deployment success is not functional approval.

## Previously established work (from recovered reference and user reports)

- Total Body: existing training interface, exercise selection and athlete illustrations.
- Cycle: workout interface and activity handling.
- Run: weekly program, activity functionality, athlete illustrations.
- Shared: timer, athlete profile, bilingual interface, offline service worker and update flow.
- MOVE: separate application linked from Train Lab; not part of this repository's Swim work.
- Registration/admin pages exist; live backend authorization is **not verified**.

These are known components, not a claim that every function has been retested in this session.

## Swim — current development session

| Step | Evidence / action | Status |
|---|---|---|
| 181 | Original conversation approved first Swim workout interface: pool/open-water, three categories, 13 workouts, six male/female illustrations, recurring weekly plan, EN/ES. Logging/history deliberately deferred until interface testing. | Approved design recovered; implementation incomplete |
| 182–186 | Selected `cycle-development-v2`; uploaded `disciplines/swim.js` to its correct folder. | Completed per screenshots |
| 187–188 | GitHub screenshot shows `disciplines/swim.js`, commit `16e525f`, 59 lines / 7.56 KB. | Commit visually verified |
| 189 | Screenshot showed Swim still presenting `En desarrollo`. | Integration not functioning in tested page |
| 190 | Reviewed supplied `index.html`: Swim script tag exists but navigation only activates Run and Cycle builders. | Diagnosis confirmed; no corrective code uploaded |

### Critical Swim discrepancy

The uploaded Swim module is a **different, simplified Phase 1 implementation** with local activity logging/history and a shorter workout-type list. It is **not** the original approved 13-workout interface. Do not treat this upload as approval of a changed product specification. The original approved six illustration assets were not verified as present in this simplified package.

### Current Swim code integration evidence

The supplied `index.html` has `disciplines/swim.js` in script loading, but its `module-page` only contains `run-builder` and `cycle-builder`, and `show()` toggles only those two builders. `module-coming` remains visible for Swim. A correct integration will require coordinated source changes and service-worker asset review.

## Data protection and QA rules

- Do not rename shared browser storage key `fitclimb-v1` without a compatibility/migration plan.
- Preserve existing athlete plans and activities; never clear storage to force a feature to work.
- Verify `sw.js` precache assets and cache version after adding scripts/images.
- Test online, offline, installed PWA, persistence, EN/ES, male/female illustrations, and regressions in Total Body/Cycle/Run.
- Review branch diff before any production merge.

## Record maintenance

After each approved milestone, append: date, step number, commit SHA, changed paths, preview URL, tests passed/failed, decisions, outstanding issues, and release/merge SHA. Never mark a feature tested solely because it was committed or deployed.
