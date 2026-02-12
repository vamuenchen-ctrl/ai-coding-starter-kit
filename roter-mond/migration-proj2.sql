-- ---------------------------------------------------------------------------
-- PROJ-2: Field-Level Merge - Schema Migration
--
-- Adds feld_zeitstempel JSONB column to all 7 tables.
-- This column stores per-field timestamps for merge conflict resolution.
--
-- Run this in the Supabase SQL Editor before deploying PROJ-2.
-- ---------------------------------------------------------------------------

ALTER TABLE zyklusdaten ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE korrekturen ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE zyklushistorie ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE chronik ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE tageskarten ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE zyklustyp_hinweis ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
ALTER TABLE angepasste_grenzen ADD COLUMN IF NOT EXISTS feld_zeitstempel JSONB DEFAULT '{}';
