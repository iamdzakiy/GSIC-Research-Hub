# Hub v3: state of the repo before the work

Read on `main` at `856ebef` (v2, `feat/hub-v2`, is merged). `feat/hub-v3` starts there.

## What matches the prompt's notes

- `Test { eventId, type pre|post, title, description, questions Json, durationMinutes, passingScore }` and `TestResult { testId, userId, answers, score, maxScore, completedAt }`. Neither has a unique constraint or a relation to `Event`.
- `scoreTest()` in `lib/scoring.ts` handles `multiple_choice` (compared by answer text, case-insensitive) and `essay` (full points when not empty).
- `TestRunner` keeps the draft and the timer in `localStorage`, so the timer can be reset by clearing storage.
- `lib/test-submit.ts` requires a registration, requires the pre-test for a post-test (through `Registration.preTestCompleted`) and allows one attempt.
- `BlogPost` has `content`, `coverImage`, `tags`. `lib/render-content.ts` runs `marked`, then `sanitize-html`.
- `User` has no `nim`. `FACULTY_MAJOR_MAP` in `lib/types.ts` maps faculty to majors with a 3-digit `code`.

## What differs, and how the work adapts

| Area | Found | Adaptation |
|---|---|---|
| `DESIGN.md` | Does not exist. The v2 design decisions live in code (`tailwind.config.ts`, `globals.css`, `app/layout.tsx`). | Job 1 writes `DESIGN.md` from the code and the measured brand values. |
| Fonts | v2.1 chose Bricolage Grotesque (display), Plus Jakarta Sans (text) and IBM Plex Mono (labels), not Plus Jakarta Sans and Inter. | Kept, since it is the live, deliberate v2 choice. Switching to Poppins and Lato is a three-line change in `app/layout.tsx`. |
| GDV | Not in the project files. `docs/brand/` holds only `Logo_GSIC.png` and `Logo_KM_ITB.png`. | Measured brand values apply. The logo files are used as they are. |
| Test runner | `components/tests/TestRunner.tsx` is not imported anywhere. No page lets a participant take a test. `GET /api/tests` is public and returns `correctAnswer`. | Job 4 adds the participant routes and replaces the runner. The public list strips answers. |
| `/people` | The member directory is `/members`. | NIM privacy rules are applied to `/members`, `/u/[username]`, partner posts and search. |
| Auth | Pages are client-rendered against Supabase Auth. API routes read a Bearer token (`requireUser`, `requireAdmin`). There is no server-side session on pages. | New participant pages are client components that call the API with `apiFetch`. |
| Sign-up | Two steps (Account, Profile) in `components/portal/AuthForm.tsx`, one shared `registerSchema`. | Job 2 adds the NIM, the draft and a Review step. |
| Event registration | One-screen form in `components/events/EventRegister.tsx`. Bootcamp team members are ITB emails. A full event is refused. No edit, cancel or waitlist. | Job 3 moves it to steps with a server draft, NIM-based members and a waitlist. |
| Rapor | `buildRapor()` takes the first pre and first post test per event, so it cannot show four episodes. | Job 5 groups by `pairKey`. |
| Sheets | Two modules: `lib/matchmaking-sheet.ts` (profile write-through by header name, through the outbox) and `lib/googleSheets.ts` (`writeSheet` clears a whole tab; used by the admin sync). | NIM is added as an app-owned column in the matching sheet. Test results use a new outbox job that writes only tabs it created. |
| Admin | One 1,000-line legacy page at `/admin` with tabs. | New admin screens are separate components loaded into new tabs. |
| Seed events | `scripts/seed-events.ts` seeds `pkm-bootcamp-2027`, `sandbox-sesi-1`, `sandbox-sesi-2`, all `comingSoon`, with no panelists. | The assessment seed attaches by these slugs. With no panelists the `{{panelists}}` question is left out. |
| Lint | No ESLint config or package, so `npm run lint` opened a setup prompt. | `eslint` and `eslint-config-next` added (approved in the project thread) with `next/core-web-vitals`. |
| Tokens | `tailwind.config.ts` still has glass, glow, violet and cyan entries. `globals.css` has the matching `.glass`, `.glow-*` classes. | Job 1 removes the ones nothing uses. |

## Design skills

- `frontend-design` is loaded and used.
- `impeccable` could not be installed: the environment's network policy blocks `impeccable.style`, where the skill bundle is downloaded from. The CLI from npm works offline, so `npx impeccable detect` is run on the key routes. The `/impeccable shape`, `critique`, `audit` and `polish` commands were not available.

## Not part of this work, but worth knowing

- `.env.local` is tracked in git and holds SMTP and database credentials. It is listed in `.gitignore`, so it was added before the rule. It should be removed from the index and the credentials rotated.
- `tsconfig.tsbuildinfo` is tracked too and changes on every type-check.
