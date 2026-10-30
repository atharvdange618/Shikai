# GitHub quirks

GitHub API behavior that makes Shikai look broken when it isn't. Read this before you debug an empty list, a missing item or a 4xx. Use it to answer a user report with evidence.

Add an entry whenever a bug traces back to GitHub, in the same change as the fix or workaround. Each entry has:
- **Symptom**: what the user sees in Shikai.
- **Cause**: what GitHub does, with the date and source (a changelog link, or "inferred from results").
- **Check**: a command that shows it on the user's account, so a report can be confirmed in a minute.
- **Handled**: the code and the decision entry.

## Issue search returns nothing on the App token

- **Symptom:** Your work shows "Nothing here right now" in every section; the Issues tab in Search finds nothing.
- **Cause:** `/search/issues` answers 200 with 0 items for every query on a GitHub App user token, even public repos. Inferred from results on 2026-10-30, not in GitHub's docs.
- **Check:** compare `gh api "/search/issues?q=repo:microsoft/vscode+is:open" -q .total_count` with the same query in the app.
- **Handled:** `searchIssues()` sends the PAT; both screens ask for one without it. D-027.

## Activity feeds are capped, unsorted and miss pushes

- **Symptom:** a repo the user worked on is missing from Recent Activity, or dates jump around.
- **Cause:** `/users/{user}/events` keeps at most 300 events over about 30 days, returns them out of date order, and some pushes never get an event. Seen 2026-10-30.
- **Check:** `gh api /users/<login>/events --paginate -q '.[] | "\(.created_at) \(.type) \(.repo.name)"'`. An event missing there, or past position 300, can't show in Shikai.
- **Handled:** `sortEventsNewestFirst()` sorts what's loaded. D-028.

## App token gets no notifications or private events

- **Symptom:** no Notifications tab; Recent Activity shows only public events.
- **Cause:** a GitHub App user token can't read notifications, and `/users/{user}/events` never returns private events to it, even with the Events permission.
- **Check:** `gh api /notifications` works on a classic PAT; the app's session token can't read it.
- **Handled:** the optional PAT. D-003.

## Stargazers and watchers need push access

- **Symptom:** Stars shows a count but doesn't open; Watching never opens.
- **Cause:** since mid-2026, `/stargazers` and `/subscribers` serve only admins and collaborators ([changelog, 2026-06-30](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/)). App tokens also need Contents: write for stargazers.
- **Check:** `gh api /repos/<owner>/<repo>/stargazers` on a repo the user doesn't own returns 403.
- **Handled:** Stars opens only with `push` or `admin` and a saved PAT. D-023.

## Notification threads read before the poll sees them

- **Symptom:** alerts never fire for some users.
- **Cause:** GitHub marks a thread read when anything loads the tracking image in its email. Mail clients that preload images read every thread seconds after it arrives.
- **Check:** in `gh api /notifications?all=true`, `last_read_at` lands 1 to 5 seconds after `updated_at`.
- **Handled:** `planAlerts` treats a read within 2 minutes of the update as unread. D-022.

## Paged lists stop at page 400

- **Symptom:** an error at the bottom of a long stargazers, forks or followers list.
- **Cause:** GitHub answers 422 past page 400 (per the comment on `MAX_LIST_PAGE`, from `c837573`). Not reproduced on 2026-10-30: page 401 of `microsoft/vscode` forks and `torvalds` followers both returned 30 items. Stargazers are untested.
- **Check:** `gh api "/repos/<owner>/<repo>/stargazers?per_page=30&page=401"` on a repo with over 12,000 stars where the user has push access.
- **Handled:** `MAX_LIST_PAGE` in `lib/github-rest.ts` stops offering a next page. If the 422 is gone, the cap hides real pages; verify before removing it.

## Repo stats answer 202 while computing

- **Symptom:** Insights charts are empty on first open, then fill in.
- **Cause:** `/stats/*` endpoints are cached per default-branch SHA; on a miss GitHub answers 202 with no body and computes in the background.
- **Check:** `gh api -i /repos/<owner>/<repo>/stats/contributors` on a repo nobody has opened lately shows `202 Accepted`.
- **Handled:** `lib/github-rest.ts` throws on 202 so React Query retries instead of caching nothing.

## File contents stop at 1 MB

- **Symptom:** a large file shows "File too large to preview".
- **Cause:** the contents API sends no body for files past 1 MB and sets `encoding` to `"none"`.
- **Check:** `gh api /repos/<owner>/<repo>/contents/<path> -q '.size, .encoding'`.
- **Handled:** `app/(app)/repo/[repoId]/file.tsx` shows the message instead of an empty viewer.
