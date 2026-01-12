-- Community Forum Migration
-- Creates tables for community forum functionality

-- Forum Posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'published',
  views INTEGER NOT NULL DEFAULT 0,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_reply_at TIMESTAMP
);

-- Forum Replies Table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  is_solution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Forum Post Votes Table
CREATE TABLE IF NOT EXISTS forum_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upvote BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for forum_posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_last_reply_at ON forum_posts(last_reply_at DESC NULLS LAST);

-- Indexes for forum_replies
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at ASC);

-- Indexes for forum_post_votes
CREATE INDEX IF NOT EXISTS idx_forum_post_votes_post_id ON forum_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_votes_user_id ON forum_post_votes(user_id);

-- Update trigger for forum_posts
CREATE OR REPLACE FUNCTION update_forum_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forum_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_posts_updated_at();

-- Update trigger for forum_replies
CREATE OR REPLACE FUNCTION update_forum_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forum_replies_updated_at
  BEFORE UPDATE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_replies_updated_at();

