-- CEO Platform: AI News Dashboard
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_zh TEXT,
  summary_zh TEXT NOT NULL,
  original_url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('模型发布', '行业动态', '商业应用', '中国AI')),
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);

-- Enable Row Level Security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON news_articles
  FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role write access" ON news_articles
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-delete articles older than 30 days (optional: run via pg_cron or Supabase scheduled functions)
-- DELETE FROM news_articles WHERE published_at < NOW() - INTERVAL '30 days';
