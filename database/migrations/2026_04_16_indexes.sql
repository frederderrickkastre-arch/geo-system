-- Performance indexes for common access patterns.
-- Safe to apply incrementally; CREATE INDEX is non-destructive.
USE geo_system;

-- list views consistently do: WHERE user_id = ? ORDER BY id DESC LIMIT ?
ALTER TABLE keywords          ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE questions         ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE knowledge_bases   ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE writing_prompts   ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE article_categories ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE ai_tasks          ADD INDEX idx_user_status (user_id, status);
ALTER TABLE articles          ADD INDEX idx_user_status_created (user_id, status, created_at DESC);
ALTER TABLE hot_articles      ADD INDEX idx_user_id_desc (user_id, id DESC);
ALTER TABLE submissions       ADD INDEX idx_user_status_created (user_id, status, created_at DESC);
ALTER TABLE submissions       ADD INDEX idx_media (media_type, media_id);
ALTER TABLE platform_indexing ADD INDEX idx_user_keyword_time (user_id, keyword, query_time DESC);
ALTER TABLE platform_indexing ADD INDEX idx_user_platform_time (user_id, platform, query_time DESC);
ALTER TABLE score_logs        ADD INDEX idx_user_created (user_id, created_at DESC);
ALTER TABLE balance_logs      ADD INDEX idx_user_created (user_id, created_at DESC);
ALTER TABLE images            ADD INDEX idx_user_created (user_id, created_at DESC);
ALTER TABLE media_outlets     ADD INDEX idx_status_industry (status, industry);
ALTER TABLE selfmedia_outlets ADD INDEX idx_status_platform (status, platform);
