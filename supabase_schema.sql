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

-- Anyone can insert
CREATE POLICY "Anyone can insert characters"
ON public_characters FOR INSERT
WITH CHECK (true);

-- UPDATES: Restricted to client-side logic in this No-Auth MVP.
-- Security Note: Since we use anonymous local IDs, RLS cannot securely verify 'author_id' against a JWT.
-- However, allowing global updates is dangerous.
-- Ideally, we would use a secret header or Anon Auth.
-- For this prototype, we will DISABLE updates via the public API to prevent vandalism.
-- Users can "Remix" (Insert new) but cannot overwrite existing public characters.
-- If an update feature is strictly required, it should be done via a secure RPC or checking a local secret.
-- Given the requirements, "Remixing" creates a NEW character. The original should remain immutable to others.
-- Thus, we REMOVE the "Anyone can update" policy.
-- Only the author (via some mechanism) should update, but without auth, we default to Immutable Public Characters.
-- (Or we can allow it if the client sends the correct author_id, but RLS can't verify that easily without a custom header).
-- Decision: Make public characters INSERT-ONLY (Immutable) for safety in this anonymous env.
-- Remixing handles the "Edit" use case by creating a fork.

DROP POLICY IF EXISTS "Anyone can update characters" ON public_characters;
-- No UPDATE policy = Deny All Updates.

-- Favorites Policies
CREATE POLICY "Favorites are viewable by everyone"
ON character_favorites FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert favorites"
ON character_favorites FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites"
ON character_favorites FOR DELETE
USING (true); -- Ideally restrict to own user_id, but without JWT, we rely on client.

-- Storage Policies
-- Bucket: character-icons
-- Policy: Give public read access. Give public insert access.

-- RPCs for Favorites Count (Atomic Updates)
-- These run with SECURITY DEFINER to bypass RLS if needed, or just as normal functions.

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
