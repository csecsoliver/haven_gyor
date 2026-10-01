BEGIN;
SELECT pg_advisory_xact_lock(150150);
CREATE SCHEMA IF NOT EXISTS haven;

-- One site, with ordered relational children and JSONB for presentation sections.
CREATE TABLE IF NOT EXISTS haven.site (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO haven.site (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS haven.section (
  name text PRIMARY KEY CHECK (name IN (
    'meta', 'nav', 'tagline', 'hero', 'about', 'pitch', 'steps',
    'schedule', 'pastEvents', 'sponsors', 'faq', 'footer', 'fonts', 'images'
  )),
  value jsonb NOT NULL CHECK (
    (name = 'tagline' AND jsonb_typeof(value) = 'array')
    OR (name <> 'tagline' AND jsonb_typeof(value) = 'object')
  )
);
CREATE TABLE IF NOT EXISTS haven.faq (
  position integer PRIMARY KEY CHECK (position >= 0),
  question text NOT NULL
);
CREATE TABLE IF NOT EXISTS haven.faq_segment (
  faq_position integer NOT NULL REFERENCES haven.faq(position) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  text text NOT NULL,
  href text,
  mark boolean,
  PRIMARY KEY (faq_position, position),
  CHECK (href IS NULL OR href ~ '^(https://|mailto:)')
);
CREATE TABLE IF NOT EXISTS haven.schedule_day (
  position integer PRIMARY KEY CHECK (position >= 0),
  label text NOT NULL
);
CREATE TABLE IF NOT EXISTS haven.schedule_item (
  day_position integer NOT NULL REFERENCES haven.schedule_day(position) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  time text NOT NULL,
  title text NOT NULL,
  body text,
  PRIMARY KEY (day_position, position)
);

-- This function is atomic: malformed children cause the whole statement to roll
-- back. The API additionally validates every supported SITE_DATA field with Zod.
-- Direct SQL callers must supply the same documented schema.
CREATE OR REPLACE FUNCTION haven.import_content(document jsonb)
RETURNS void LANGUAGE plpgsql
SET search_path = pg_catalog, haven
AS $$
DECLARE
  normalized jsonb := document;
  entry record;
  item record;
  part record;
BEGIN
  IF jsonb_typeof(normalized) IS DISTINCT FROM 'object'
     OR octet_length(normalized::text) > 1048576 THEN
    RAISE EXCEPTION 'Content must be a JSON object of at most 1 MiB';
  END IF;
  IF jsonb_typeof(normalized->'faq') = 'array' THEN
    normalized := jsonb_set(normalized, '{faq}', jsonb_build_object('items', normalized->'faq'));
  END IF;
  -- Serialize replacement imports, without blocking ordinary MVCC reads.
  PERFORM 1 FROM haven.site WHERE id = true FOR UPDATE;
  DELETE FROM haven.section;
  DELETE FROM haven.faq;
  DELETE FROM haven.schedule_day;

  FOR entry IN SELECT key, value FROM jsonb_each(normalized) LOOP
    IF entry.key = 'faq' AND entry.value ? 'items' THEN
      IF jsonb_typeof(entry.value->'items') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'faq.items must be an array';
      END IF;
      FOR item IN SELECT value, ordinality FROM jsonb_array_elements(entry.value->'items') WITH ORDINALITY LOOP
        IF jsonb_typeof(item.value->'q') IS DISTINCT FROM 'string'
           OR jsonb_typeof(item.value->'a') IS DISTINCT FROM 'array' THEN
          RAISE EXCEPTION 'Each FAQ needs a string q and an array a';
        END IF;
        INSERT INTO haven.faq VALUES (item.ordinality - 1, item.value->>'q');
        FOR part IN SELECT value, ordinality FROM jsonb_array_elements(item.value->'a') WITH ORDINALITY LOOP
          IF jsonb_typeof(part.value->'text') IS DISTINCT FROM 'string'
             OR (part.value ? 'href' AND jsonb_typeof(part.value->'href') IS DISTINCT FROM 'string')
             OR (part.value ? 'mark' AND jsonb_typeof(part.value->'mark') IS DISTINCT FROM 'boolean') THEN
            RAISE EXCEPTION 'Invalid FAQ answer segment';
          END IF;
          INSERT INTO haven.faq_segment VALUES (
            item.ordinality - 1, part.ordinality - 1, part.value->>'text',
            part.value->>'href', (part.value->>'mark')::boolean
          );
        END LOOP;
      END LOOP;
      -- Empty array records that items was explicitly supplied (rather than omitted).
      entry.value := jsonb_set(entry.value, '{items}', '[]'::jsonb);
    ELSIF entry.key = 'schedule' AND entry.value ? 'days' THEN
      IF jsonb_typeof(entry.value->'days') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'schedule.days must be an array';
      END IF;
      FOR item IN SELECT value, ordinality FROM jsonb_array_elements(entry.value->'days') WITH ORDINALITY LOOP
        IF jsonb_typeof(item.value->'day') IS DISTINCT FROM 'string'
           OR jsonb_typeof(item.value->'items') IS DISTINCT FROM 'array' THEN
          RAISE EXCEPTION 'Each schedule day needs a string day and an array items';
        END IF;
        INSERT INTO haven.schedule_day VALUES (item.ordinality - 1, item.value->>'day');
        FOR part IN SELECT value, ordinality FROM jsonb_array_elements(item.value->'items') WITH ORDINALITY LOOP
          IF jsonb_typeof(part.value->'time') IS DISTINCT FROM 'string'
             OR jsonb_typeof(part.value->'title') IS DISTINCT FROM 'string'
             OR (part.value ? 'body' AND jsonb_typeof(part.value->'body') IS DISTINCT FROM 'string') THEN
            RAISE EXCEPTION 'Invalid schedule item';
          END IF;
          INSERT INTO haven.schedule_item VALUES (
            item.ordinality - 1, part.ordinality - 1, part.value->>'time',
            part.value->>'title', part.value->>'body'
          );
        END LOOP;
      END LOOP;
      entry.value := jsonb_set(entry.value, '{days}', '[]'::jsonb);
    END IF;
    INSERT INTO haven.section (name, value) VALUES (entry.key, entry.value);
  END LOOP;
  UPDATE haven.site SET updated_at = now() WHERE id = true;
END;
$$;

CREATE OR REPLACE FUNCTION haven.export_content()
RETURNS jsonb LANGUAGE plpgsql STABLE
SET search_path = pg_catalog, haven
AS $$
DECLARE document jsonb;
BEGIN
  -- One SELECT gives a single consistent snapshot of all ordered child tables.
  SELECT coalesce(jsonb_object_agg(s.name, CASE
    WHEN s.name = 'faq' AND (s.value ? 'items' OR EXISTS (SELECT 1 FROM haven.faq)) THEN
      jsonb_set(s.value, '{items}', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('q', f.question, 'a', (
          SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
            'text', a.text, 'href', a.href, 'mark', a.mark
          )) ORDER BY a.position), '[]'::jsonb)
          FROM haven.faq_segment a WHERE a.faq_position = f.position
        )) ORDER BY f.position), '[]'::jsonb) FROM haven.faq f
      ))
    WHEN s.name = 'schedule' AND (s.value ? 'days' OR EXISTS (SELECT 1 FROM haven.schedule_day)) THEN
      jsonb_set(s.value, '{days}', (
        SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.label, 'items', (
          SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
            'time', i.time, 'title', i.title, 'body', i.body
          )) ORDER BY i.position), '[]'::jsonb)
          FROM haven.schedule_item i WHERE i.day_position = d.position
        )) ORDER BY d.position), '[]'::jsonb) FROM haven.schedule_day d
      ))
    ELSE s.value END), '{}'::jsonb)
  INTO document FROM (
    SELECT name, value FROM haven.section
    UNION ALL
    SELECT 'schedule', '{}'::jsonb
    WHERE EXISTS (SELECT 1 FROM haven.schedule_day)
      AND NOT EXISTS (SELECT 1 FROM haven.section WHERE name = 'schedule')
    UNION ALL
    SELECT 'faq', '{}'::jsonb
    WHERE EXISTS (SELECT 1 FROM haven.faq)
      AND NOT EXISTS (SELECT 1 FROM haven.section WHERE name = 'faq')
  ) s;
  RETURN document;
END;
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA haven FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA haven FROM PUBLIC;
COMMIT;
