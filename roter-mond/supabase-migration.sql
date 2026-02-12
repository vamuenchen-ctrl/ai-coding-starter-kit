-- =========================================================================
-- Roter Mond – Supabase Database Migration
-- Führe dieses SQL im Supabase SQL-Editor aus:
-- https://supabase.com/dashboard → Projekt → SQL Editor → New Query
-- =========================================================================

-- ----- Trigger-Funktion für automatisches updated_at ---------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- 1) Zyklusdaten (1 Zeile pro Nutzerin)
-- =========================================================================
CREATE TABLE zyklusdaten (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zyklus_start date,
  zyklus_laenge integer NOT NULL DEFAULT 28,
  zyklus_typ  text CHECK (zyklus_typ IN ('weissmond', 'rotmond') OR zyklus_typ IS NULL),
  ersteinrichtung_abgeschlossen boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE zyklusdaten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON zyklusdaten FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_zyklusdaten_updated BEFORE UPDATE ON zyklusdaten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =========================================================================
-- 2) Korrekturen (n Zeilen pro Nutzerin)
-- =========================================================================
CREATE TABLE korrekturen (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  datum            date NOT NULL,
  zyklus_tag       integer NOT NULL,
  berechnete_phase text NOT NULL,
  korrigierte_phase text NOT NULL,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_korrekturen_user ON korrekturen(user_id);

ALTER TABLE korrekturen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON korrekturen FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =========================================================================
-- 3) Zyklushistorie (n Zeilen pro Nutzerin)
-- =========================================================================
CREATE TABLE zyklushistorie (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startdatum    date NOT NULL,
  mondphase     text,
  zyklus_typ    text,
  zyklus_laenge integer,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_zyklushistorie_user ON zyklushistorie(user_id);
CREATE INDEX idx_zyklushistorie_user_start ON zyklushistorie(user_id, startdatum);

ALTER TABLE zyklushistorie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON zyklushistorie FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_zyklushistorie_updated BEFORE UPDATE ON zyklushistorie
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =========================================================================
-- 4) Chronik / Tagebuch-Einträge (upsert nach Datum)
-- =========================================================================
CREATE TABLE chronik (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  datum                 date NOT NULL,
  koerper               jsonb,
  stimmung              text,
  energie               integer CHECK (energie BETWEEN 1 AND 10 OR energie IS NULL),
  traeume               text DEFAULT '',
  kreativitaet          text DEFAULT '',
  sexuelles_empfinden   text,
  phase                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(user_id, datum)
);

CREATE INDEX idx_chronik_user ON chronik(user_id);
CREATE INDEX idx_chronik_user_datum ON chronik(user_id, datum);

ALTER TABLE chronik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON chronik FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_chronik_updated BEFORE UPDATE ON chronik
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =========================================================================
-- 5) Tageskarten / Orakelkarten (upsert nach Datum)
-- =========================================================================
CREATE TABLE tageskarten (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  datum      date NOT NULL,
  karten_id  text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, datum)
);

CREATE INDEX idx_tageskarten_user ON tageskarten(user_id);

ALTER TABLE tageskarten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON tageskarten FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =========================================================================
-- 6) Zyklustyp-Hinweis (1 Zeile pro Nutzerin)
-- =========================================================================
CREATE TABLE zyklustyp_hinweis (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  letzter_hinweis        timestamptz,
  nutzerin_hat_abgelehnt boolean NOT NULL DEFAULT false,
  ablehnungs_datum       timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE zyklustyp_hinweis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON zyklustyp_hinweis FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_zyklustyp_hinweis_updated BEFORE UPDATE ON zyklustyp_hinweis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =========================================================================
-- 7) Angepasste Phasengrenzen (1 Zeile pro Nutzerin)
-- =========================================================================
CREATE TABLE angepasste_grenzen (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grenzen    jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE angepasste_grenzen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON angepasste_grenzen FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_angepasste_grenzen_updated BEFORE UPDATE ON angepasste_grenzen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
