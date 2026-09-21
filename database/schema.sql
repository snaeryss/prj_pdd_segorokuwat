-- ============================================
-- Segorokuwat — Supabase Database Schema
-- ============================================
-- 
-- Run this SQL in the Supabase SQL Editor to create
-- all necessary tables for the Segorokuwat documentation website.
--
-- Structure:
--   years → activities → subcategories → photos
--   (1:many at each level, subcategories are optional)

-- ── Enable UUID extension ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Table: years ──
CREATE TABLE IF NOT EXISTS years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table: activities ──
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cover_photo_id UUID, -- Will add FK after photos table is created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_year_id ON activities(year_id);
CREATE INDEX idx_activities_slug ON activities(slug);

-- ── Table: subcategories ──
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subcategories_activity_id ON subcategories(activity_id);

-- ── Table: photos ──
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_activity_id ON photos(activity_id);
CREATE INDEX idx_photos_subcategory_id ON photos(subcategory_id);
CREATE INDEX idx_photos_is_visible ON photos(is_visible);
CREATE INDEX idx_photos_is_featured ON photos(is_featured);

-- ── Add FK for cover_photo_id on activities ──
ALTER TABLE activities
  ADD CONSTRAINT activities_cover_photo_id_fkey
  FOREIGN KEY (cover_photo_id)
  REFERENCES photos(id)
  ON DELETE SET NULL;

-- ══════════════════════════════════════
--  Row Level Security (RLS)
-- ══════════════════════════════════════
-- Public can read, only authenticated (admin) can write.

-- years
ALTER TABLE years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view years"
  ON years FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert years"
  ON years FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update years"
  ON years FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete years"
  ON years FOR DELETE
  USING (auth.role() = 'authenticated');

-- activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view activities"
  ON activities FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert activities"
  ON activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update activities"
  ON activities FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete activities"
  ON activities FOR DELETE
  USING (auth.role() = 'authenticated');

-- subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view subcategories"
  ON subcategories FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert subcategories"
  ON subcategories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update subcategories"
  ON subcategories FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete subcategories"
  ON subcategories FOR DELETE
  USING (auth.role() = 'authenticated');

-- photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible photos"
  ON photos FOR SELECT
  USING (true); -- Filtering is_visible is done at app level

CREATE POLICY "Admin can insert photos"
  ON photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can update photos"
  ON photos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can delete photos"
  ON photos FOR DELETE
  USING (auth.role() = 'authenticated');


-- ══════════════════════════════════════
--  Sample Seed Data (for testing)
-- ══════════════════════════════════════

-- Insert sample years
INSERT INTO years (year) VALUES (2023), (2024), (2025)
ON CONFLICT (year) DO NOTHING;

-- Insert sample activities
INSERT INTO activities (year_id, name, slug, description) VALUES
  (
    (SELECT id FROM years WHERE year = 2023),
    'Agustusan 2023',
    'agustusan-2023',
    'Dokumentasi kegiatan perayaan HUT Kemerdekaan Segorokuwat tahun 2023. Berbagai lomba dan acara diselenggarakan untuk warga.'
  ),
  (
    (SELECT id FROM years WHERE year = 2024),
    'Kerja Bakti Januari',
    'kerja-bakti-januari-2024',
    'Kegiatan kerja bakti bersama warga Segorokuwat di lingkungan sekitar.'
  ),
  (
    (SELECT id FROM years WHERE year = 2024),
    'Agustusan 2024',
    'agustusan-2024',
    'Perayaan HUT Kemerdekaan RI ke-79 di Segorokuwat.'
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert sample subcategories
INSERT INTO subcategories (activity_id, name, slug) VALUES
  (
    (SELECT id FROM activities WHERE slug = 'agustusan-2023'),
    'Lomba Anak-Anak',
    'lomba-anak-anak'
  ),
  (
    (SELECT id FROM activities WHERE slug = 'agustusan-2023'),
    'Lomba Bapak-Bapak',
    'lomba-bapak-bapak'
  ),
  (
    (SELECT id FROM activities WHERE slug = 'agustusan-2023'),
    'Lomba Ibu-Ibu',
    'lomba-ibu-ibu'
  )
ON CONFLICT DO NOTHING;

-- Note: Photos will be added via the admin dashboard.
-- Sample photo insert (uncomment and modify with actual Google Drive URLs):
--
-- INSERT INTO photos (activity_id, subcategory_id, title, image_url, caption, is_featured, is_visible) VALUES
--   (
--     (SELECT id FROM activities WHERE slug = 'agustusan-2023'),
--     (SELECT id FROM subcategories WHERE slug = 'lomba-anak-anak'),
--     'Lomba Memasukkan Pensil',
--     'https://drive.google.com/file/d/YOUR_FILE_ID/view',
--     'Dokumentasi lomba anak-anak dalam kegiatan Agustusan 2023.',
--     true,
--     true
--   );
