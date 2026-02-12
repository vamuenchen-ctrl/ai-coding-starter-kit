-- PROJ-4: Verbesserte Gaeste-Migration
-- Neue Spalte "guest_id" in zyklusdaten, um Gast-Kennungen zu speichern.
-- Damit kann erkannt werden, ob lokale Gaeste-Daten von der gleichen
-- oder einer anderen Person stammen.

ALTER TABLE zyklusdaten ADD COLUMN IF NOT EXISTS guest_id TEXT;
