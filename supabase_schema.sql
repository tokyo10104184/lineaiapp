-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Public Characters Table
CREATE TABLE IF NOT EXISTS public_characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT,
    icon_url TEXT,
    author_id UUID NOT NULL, -- Anonymous User ID
    parent_id UUID REFERENCES public_characters(id), -- For Remixes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    favorites_count INTEGER DEFAULT 0
);

-- 2. Favorites Table
CREATE TABLE IF NOT EXISTS character_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES public_characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Anonymous User ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id, user_id)
);

-- 3. Storage Bucket for Icons
-- Note: You need to create a bucket named 'character-icons' in the Supabase Dashboard -> Storage
-- and set it to Public.

-- Policies (Row Level Security)

-- Enable RLS
ALTER TABLE public_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_favorites ENABLE ROW LEVEL SECURITY;

-- Public Characters Policies
-- Anyone can read
CREATE POLICY "Public characters are viewable by everyone"
ON public_characters FOR SELECT
USING (true);

-- Anyone can insert (since we use anonymous IDs, we allow anyone to post)
CREATE POLICY "Anyone can insert characters"
ON public_characters FOR INSERT
WITH CHECK (true);

-- Only author can update
CREATE POLICY "Authors can update their own characters"
ON public_characters FOR UPDATE
USING (auth.uid() = author_id) -- Note: Since we are using local UUIDs and not Auth, this RLS might be tricky.
-- For a local-only app without real Auth, we might need to trust the client or use a simplified policy.
-- Given the constraints, we will allow updates if the provided author_id matches (enforced by app logic mostly,
-- but strictly speaking, without a JWT, RLS using auth.uid() won't work for anonymous users unless we use anonymous auth).
-- For this MVP without Supabase Auth, we might have to disable RLS for INSERT/UPDATE or use a shared key,
-- BUT 'auth.uid()' refers to Supabase Auth.
-- Since the requirements state "Authentication... features have been completely removed",
-- we are likely using the Anon Key. The Anon key bypasses RLS if we don't set it up carefully,
-- or we can just leave RLS open for this demo (or use a secret header).
-- Let's stick to "Anyone can insert/update" for now, or rely on client-side ID checks if we can't do real Auth.
-- REVISED POLICY FOR NO-AUTH MODE:
DROP POLICY IF EXISTS "Authors can update their own characters" ON public_characters;
CREATE POLICY "Anyone can update characters" ON public_characters FOR UPDATE USING (true);


-- Favorites Policies
CREATE POLICY "Favorites are viewable by everyone"
ON character_favorites FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert favorites"
ON character_favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites"
ON character_favorites FOR DELETE
USING (true);

-- Storage Policies (SQL for Storage is specific, usually done in UI, but here is the idea)
-- Bucket: character-icons
-- Policy: Give public read access. Give public insert access.

-- RPCs for Favorites Count (Atomic Updates)

CREATE OR REPLACE FUNCTION increment_favorites_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public_characters
  SET favorites_count = favorites_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_favorites_count(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public_characters
  SET favorites_count = GREATEST(0, favorites_count - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
