# Cognitive Control Coach Supabase

This folder intentionally does not carry forward the copied Attention Coach Edge Functions or `attention_*` migrations.

CCC v1 uses a hybrid shared schema:

- Shared tables: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- CCC state table: `cognitive_control_progress`

Implemented service-role Edge Functions:

- `submit-coach-block`: idempotently stores variable-length practice and guided blocks, trial-level value data, validity flags and transition events.
- `sync-coach-progress`: loads and saves the versioned CCC journey state.
- `finalize-coach-session`: marks a stored session complete and records its summary.

Apply migrations in timestamp order. `202608120001_cognitive_control_dual_estimand.sql` adds the v0.3 signal/policy/transfer separation, quota validity and frame-timing fields without rewriting the shared schema.

For the v0.3 forced-choice Attention protocol, `is_valid_decision` is true only for an answer. A timing-clean deadline omission is stored with `counts_toward_quota = true` and `is_valid_decision = false`; interrupted or invalid observations have both flags false and are replaced by the client.

Clients authenticate with the normal Supabase session. The functions validate the user and perform writes with the service role; authenticated clients retain read-own access only. Existing Attention Coach and WM Coach cloud data remain in their legacy app schemas and are not converted into CCC progression credit.
