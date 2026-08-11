# Cognitive Control Coach Supabase

This folder intentionally does not carry forward the copied Attention Coach Edge Functions or `attention_*` migrations.

CCC v1 uses a hybrid shared schema:

- Shared tables: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- CCC state table: `cognitive_control_progress`

Service-role Edge Functions for the shared schema are the next backend stage. Existing Attention Coach and WM Coach cloud data remain in their legacy app schemas and must not be converted into CCC progression credit.