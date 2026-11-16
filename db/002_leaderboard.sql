BEGIN;
SELECT pg_advisory_xact_lock(150151);

-- Project leaderboard and its authors, in the haven schema. On the managed
-- database these tables already exist (owned by postgres, with id defaulting
-- to public.uuid_as_a_service()), so this migration is a no-op there. Fresh
-- databases get the built-in gen_random_uuid() instead, which needs no custom
-- function. All columns are NOT NULL except authors.project_id.
CREATE TABLE IF NOT EXISTS haven.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() CONSTRAINT leaderboard_pk PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL,
  source_url text NOT NULL,
  rank integer NOT NULL
);
CREATE TABLE IF NOT EXISTS haven.authors (
  id uuid NOT NULL DEFAULT gen_random_uuid() CONSTRAINT authors_pk PRIMARY KEY,
  name text NOT NULL,
  project_id uuid CONSTRAINT authors_leaderboard_id_fk REFERENCES haven.leaderboard,
  email text NOT NULL
);

-- Keep the haven-schema posture (no access for PUBLIC), but only when this
-- role owns the tables; they may pre-exist under a different owner, and only
-- the owner may revoke.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'haven'
      AND c.relname IN ('leaderboard', 'authors')
      AND c.relowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
  ) THEN
    EXECUTE 'REVOKE ALL ON haven.leaderboard FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON haven.authors FROM PUBLIC';
  END IF;
END $$;
COMMIT;
