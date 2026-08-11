# Cognitive Control Coach Supabase

This folder intentionally does not carry forward the copied Attention Coach Edge Functions or `attention_*` migrations.

CCC v1 uses a hybrid shared schema:

- Shared tables: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- CCC state table: `cognitive_control_progress`

Implemented service-role Edge Functions:

- `submit-coach-block`: idempotently stores variable-length practice and guided blocks, trial-level value data, validity flags and transition events.
- `sync-coach-progress`: loads and saves the versioned CCC journey state.
- `finalize-coach-session`: marks a stored session complete and records its summary.

Clients authenticate with the normal Supabase session. The functions validate the user and perform writes with the service role; authenticated clients retain read-own access only. Existing Attention Coach and WM Coach cloud data remain in their legacy app schemas and are not converted into CCC progression credit.
