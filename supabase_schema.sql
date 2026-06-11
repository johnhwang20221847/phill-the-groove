-- ============================================================
-- PHILL THE GROOVE — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  last_post_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT,
  year INT,
  note TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Reactions
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  color TEXT NOT NULL CHECK (color IN ('red','orange','yellow','blue','black')),
  score_value INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)  -- one reaction per user per post
);

-- ============================================================
-- AUTO-UPDATE SCORE: when reaction is inserted/deleted
-- ============================================================

CREATE OR REPLACE FUNCTION update_score_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add score to post author
    UPDATE profiles
    SET total_score = total_score + NEW.score_value
    WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove score from post author
    UPDATE profiles
    SET total_score = GREATEST(0, total_score - OLD.score_value)
    WHERE id = (SELECT user_id FROM posts WHERE id = OLD.post_id);

  ELSIF TG_OP = 'UPDATE' THEN
    -- Replace old score with new score
    UPDATE profiles
    SET total_score = GREATEST(0, total_score - OLD.score_value + NEW.score_value)
    WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_reaction_score
AFTER INSERT OR UPDATE OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION update_score_on_reaction();

-- ============================================================
-- STREAK: update on post insert
-- ============================================================

CREATE OR REPLACE FUNCTION update_streak_on_post()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
BEGIN
  SELECT last_post_date INTO last_date FROM profiles WHERE id = NEW.user_id;

  IF last_date = CURRENT_DATE THEN
    -- Already posted today, no change
    NULL;
  ELSIF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day — increment streak
    UPDATE profiles
    SET streak = streak + 1,
        last_post_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  ELSE
    -- Streak broken — reset to 1
    UPDATE profiles
    SET streak = 1,
        last_post_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_streak
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION update_streak_on_post();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: public read, auth insert, own delete
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Reactions: public read, auth insert/delete own
CREATE POLICY "reactions_read_all" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert_auth" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_upsert_auth" ON reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reactions_delete_own" ON reactions FOR DELETE USING (auth.uid() = user_id);
