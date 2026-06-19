alter table public.cognitive_bandwidth_partner_feedback
  alter column audience drop not null,
  alter column clarity drop not null,
  alter column credibility drop not null;
