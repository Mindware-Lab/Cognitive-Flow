# Architecture, Data, and Deployment

## Stack

- Vite and TypeScript
- framework-neutral DOM UI
- SVG stimulus renderer
- IndexedDB offline queue
- Supabase Auth
- Supabase Postgres with RLS
- Supabase Edge Functions
- Cloudflare Pages

## Runtime Rule

Do not perform network requests, storage writes, or unrelated DOM rendering during fixation, stimulus, or mask states.

Data flow:

```text
Trial runs in memory
-> Append to block buffer
-> Mini-block ends
-> Persist to IndexedDB
-> Submit authenticated batch
-> Server validates and inserts
-> Server finalizes canonical score
```

## Authentication

Use Supabase email magic links:

```ts
supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: stableAppUrl,
    shouldCreateUser: true,
  },
});
```

Require sign-in before the first scored session. Tutorials and timing checks may run anonymously.

Use:

- stable production redirect
- local development redirects
- separate staging Supabase project
- restored browser sessions
- auth change listener
- sign-out and account-deletion flows

## Core Tables

```text
ccc_device_checks
ccc_sessions
ccc_blocks
ccc_trials
ccc_estimates
ccc_score_snapshots
ccc_wrapper_states
ccc_adaptive_events
```

Every score and trial must include version identifiers:

```text
schema_version
generator_version
adaptive_version
scoring_version
```

Use a unique `(session_id, client_trial_id)` constraint for idempotent retries.

## Security

- enable RLS on all user tables
- users may read only their own records
- clients cannot update or delete immutable raw trials
- trials are inserted through an authenticated Edge Function
- canonical estimates are written only by service-role backend code
- no public score or trial reads
- service-role keys never enter the browser

## Edge Functions

### `submit-ccc-block`

- authenticate user
- verify session ownership
- validate schema and payload size
- reconstruct generated trials from seed and version
- verify correct responses
- sanity-check timing and RT
- insert block and trials transactionally
- handle duplicate client IDs idempotently

### `finalize-ccc-session`

- load canonical valid trials
- fit capacity
- calculate interval and confidence
- calculate baselines and eligible derived scores
- update wrapper state
- write score snapshot
- close session

### `export-ccc-data`

Export the authenticated user's sessions, trials, estimates, and settings.

### `delete-ccc-data`

Apply the final retention and deletion policy after explicit confirmation.

## Cloudflare Pages

Recommended configuration:

```text
Project: iq-coach-cognitive-bandwidth
Repository: Mindware-Lab/IQ-Coach
Root: apps/cognitive-bandwidth
Build: npm ci && npm run build
Output: dist
Branch: main
```

Frontend environment:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_ENV
VITE_APP_URL
VITE_PROTOCOL_VERSION
```

Add SPA fallback:

```text
/* /index.html 200
```

Use separate staging and production backend values. Preview deployments must not write to production behavioural data by default.

## Privacy

Treat trial-level performance as sensitive behavioural data.

Requirements:

- privacy summary before scored use
- separate optional research consent
- no advertising trackers in task routes
- no raw email copied to app tables
- UUID user references
- export and deletion controls
- documented retention period
- aggregated research use only with appropriate consent

## Observability

Monitor:

- authentication failures
- block-submission failures
- finalization failures
- timing quality by device class
- contaminated-trial rate
- abandonment rate
- model-boundary rate
- average adaptive stopping length

Do not send raw trial arrays or cognitive scores to third-party analytics.

