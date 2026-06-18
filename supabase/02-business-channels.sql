-- CEO Platform: multi-business channels (additive, non-breaking)
-- Run AFTER schema.sql, in the Supabase SQL editor.
--
-- Adds a `business` dimension orthogonal to `category`.
-- Existing AI news rows are backfilled to business = 'ceo' automatically,
-- so the current dashboard (which queries without a business filter and
-- now defaults to 'ceo') behaves exactly as before.

-- 1. business dimension; existing rows backfill to 'ceo' via DEFAULT
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS business TEXT NOT NULL DEFAULT 'ceo';

-- 2. drop the rigid category CHECK constraint.
--    The CEO channel still uses 模型发布/行业动态/商业应用/中国AI, but each
--    business channel has its own sub-categories (e.g. 关税政策, 收益趋势),
--    which the old CHECK would reject. App-layer code enforces valid
--    categories per business instead.
ALTER TABLE news_articles
  DROP CONSTRAINT IF EXISTS news_articles_category_check;

-- 3. index for per-business "latest N" reads: GET /api/news?business=<key>&limit=N
CREATE INDEX IF NOT EXISTS idx_news_business_published
  ON news_articles(business, published_at DESC);
