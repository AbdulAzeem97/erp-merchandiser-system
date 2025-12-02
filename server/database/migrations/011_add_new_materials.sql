-- Migration: 011_add_new_materials.sql
-- Add new materials to the materials table
-- Date: 2025-01-26

-- Insert new materials
-- Uses ON CONFLICT to skip duplicates (materials table has UNIQUE constraint on name)

INSERT INTO materials (name, description, unit, "costPerUnit", "isActive", "createdAt", "updatedAt")
VALUES
  ('ART CARD', 'Art card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('IVORY CARD', 'Ivory card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BLACK CARD', 'Black card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BLEACH CARD', 'Bleach card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BUX BOARD', 'Bux board material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CORRUGATED SHEET', 'Corrugated sheet material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CORRUGATED FLOATING', 'Corrugated floating material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CORRUGATED B/F', 'Corrugated B/F material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CRAFT CARD', 'Craft card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('EVERY CARD', 'Every card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AREENA NATURAL SMOOTH', 'Areena natural smooth material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AREENA NATURAL ROUGH', 'Areena natural rough material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ARENA WHITE ROUGH', 'Arena white rough material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ARENA WHITE SMOOTH', 'Arena white smooth material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AREENA E.W SMOOTH', 'Areena E.W smooth material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FANCY CARD', 'Fancy card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FANCY CARD UNCOTED', 'Fancy card uncoated material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FREE CENTO E.WHITE', 'Free Cento E.White material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FREE CENTO BLACK', 'Free Cento black material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('FREE CENTO PW', 'Free Cento PW material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LIFE ECO 100 WHITE', 'Life Eco 100 white material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LIFE ECO100 WHITE CARD', 'Life Eco100 white card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MATERICA ACQUA CARD', 'Materica Acqua card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MATERICA CLAY CARD', 'Materica Clay card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MATERICA QUARZ CARD', 'Materica Quarz card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('OLD MILL BAIANCO', 'Old Mill Baianco material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('OLD MILL PW', 'Old Mill PW material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SIRIO BLACK', 'Sirio black material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SIRIO PERLA', 'Sirio Perla material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SIRIO PIETRA CARD', 'Sirio Pietra card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SIRIO SABBIA CARD', 'Sirio Sabbia card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SMOOTH NEUTRAL', 'Smooth neutral material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SYM FREE MATT PULS CARD', 'SYM Free Matt Plus card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LEVIS MATCH BOOK (FSC)', 'Levis Match Book FSC material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LEVIS FANCY CARD', 'Levis fancy card material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('WOODSTOCK CAMOSCIO', 'Woodstock Camoscio material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('METSA BOARD', 'Metsa board material', 'pcs', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inserted_count
  FROM materials
  WHERE name IN (
    'ART CARD', 'IVORY CARD', 'BLACK CARD', 'BLEACH CARD', 'BUX BOARD',
    'CORRUGATED SHEET', 'CORRUGATED FLOATING', 'CORRUGATED B/F',
    'CRAFT CARD', 'EVERY CARD', 'AREENA NATURAL SMOOTH', 'AREENA NATURAL ROUGH',
    'ARENA WHITE ROUGH', 'ARENA WHITE SMOOTH', 'AREENA E.W SMOOTH',
    'FANCY CARD', 'FANCY CARD UNCOTED', 'FREE CENTO E.WHITE', 'FREE CENTO BLACK',
    'FREE CENTO PW', 'LIFE ECO 100 WHITE', 'LIFE ECO100 WHITE CARD',
    'MATERICA ACQUA CARD', 'MATERICA CLAY CARD', 'MATERICA QUARZ CARD',
    'OLD MILL BAIANCO', 'OLD MILL PW', 'SIRIO BLACK', 'SIRIO PERLA',
    'SIRIO PIETRA CARD', 'SIRIO SABBIA CARD', 'SMOOTH NEUTRAL',
    'SYM FREE MATT PULS CARD', 'LEVIS MATCH BOOK (FSC)', 'LEVIS FANCY CARD',
    'WOODSTOCK CAMOSCIO', 'METSA BOARD'
  );
  
  RAISE NOTICE 'Migration completed. Total materials matching new list: %', inserted_count;
END $$;

