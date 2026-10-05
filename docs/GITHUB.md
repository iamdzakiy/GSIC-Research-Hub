# Adding these changes to the existing GitHub repo

Do this with a **branch and a Pull Request**, so `main` stays untouched until you are satisfied.

```bash
# 1. Get an up-to-date local repo
cd gsic-hub
git checkout main && git pull
git checkout -b feat/portal-v2

# 2. Apply the package (idempotent; safe to repeat)
unzip portal-refactor.zip -d /tmp
bash /tmp/portal-refactor/apply.sh

# 3. Env + database
cp .env.portal.example .env.portal.tmp      # copy the new variables into .env / .env.local, then delete the tmp file
npx prisma db push                          # recommended (this repo uses db push)
npm run doctor                              # checks env, DB schema, service-role key, SMTP
npx tsx scripts/seed-portal.ts              # initial links and blog articles (needs one admin account)

# 4. Check locally
npm run build && npm run dev

# 5. Commit and push
git add -A
git status                                  # make sure .env is NOT included
git commit -m "feat: portal v2 (directory, links, report card, dashboard, gallery)"
git push -u origin feat/portal-v2
```

Then open a Pull Request from `feat/portal-v2` to `main` on GitHub. If you use Vercel, every PR gets a **Preview URL** automatically. Test there before merging.

## Safe order for production
1. Add the new env variables in Vercel (`SMTP_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and optionally `NEXT_PUBLIC_TEASER_VIDEO_URL`).
2. Update the production database **before** deploying the code: run `npx prisma db push` with the production `DIRECT_URL`/`DATABASE_URL` in your local `.env`. It only adds tables and columns, so existing data is kept. Note: `.gitignore` contains `*.sql`, so migration files never reach GitHub. That is why `db push` is used. Do not run `migrate deploy` on a database created with `db push` (error P3005).
3. In Supabase, go to Auth -> URL Configuration and add `https://<domain>/auth/callback**`.
4. Merge the PR, then run the seed once.

## Rollback
`git revert <merge-commit>` restores the code. The migration only adds tables and columns, so existing data is kept and the old code still runs.

## Security fixes included
* `GET /api/test-results` used to be public. Now only admins (all results) or the owner (own results) can read it.
* Test scores used to be calculated in the browser and sent as-is. Now the server calculates them from the stored questions, `userId` is taken from the token, each test can be taken once, and the post-test requires the pre-test.
* The `GET /api/tests` response still sends `correctAnswer` to the browser. Separating the answer key from the questions shown to participants is a recommended next step.

## If you get a 500
Test these in order to find which layer is failing:
1. `/api/ping` returns 200? Then the Next runtime is running. If this also returns 500, the build or deploy is broken (see Vercel > Deployments > Build Logs).
2. `/auth` is a page without a database. A 500 here points to a layout, env or font problem.
3. `/api/health` returns all `true`? If not, follow the steps below.
4. `/` and `/blog` are pages that use the database.
Send the results (the status code of each URL) and the `[API xxxxxx]` lines or errors from Vercel > Logs.

1. Open `https://<domain>/api/health`. All values should be `true`. `P2021`/`P2022` means the DB schema is out of date: run `npx prisma db push`.
2. Run `npm run doctor` locally. It checks env variables, missing tables and columns, the service-role key and SMTP login.
3. Check Vercel > Logs. Every 500 prints `[API <ref>]`, which matches the `ref` in the JSON response.
