-- GEO优化排名系统 数据库设计
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS geo_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE geo_system;

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  vip_expiry DATE DEFAULT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  points INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '1=正常 0=禁用',
  verified TINYINT DEFAULT 0 COMMENT '0=未认证 1=已认证',
  real_name VARCHAR(50) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 关键词表
CREATE TABLE keywords (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword VARCHAR(200) NOT NULL,
  question_count INT DEFAULT 0,
  status ENUM('active','inactive') DEFAULT 'inactive',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_keyword (keyword)
);

-- 写作标题/问题表
CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword_id INT DEFAULT NULL,
  keyword VARCHAR(200) DEFAULT '',
  question TEXT NOT NULL,
  index_status ENUM('indexed','none') DEFAULT 'none',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_keyword (keyword_id)
);

-- 图库分类表
CREATE TABLE image_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  image_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 图片表
CREATE TABLE images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  size INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category_id)
);

-- 企业知识库表
CREATE TABLE knowledge_bases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  company VARCHAR(300) DEFAULT '',
  content LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 写作指令/提示词表
CREATE TABLE writing_prompts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  type ENUM('article','title','traffic') DEFAULT 'article',
  content LONGTEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 文章分类表
CREATE TABLE article_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  sort INT DEFAULT 0,
  article_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- AI写作任务表
CREATE TABLE ai_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  distill_word VARCHAR(200) DEFAULT '',
  max_count INT DEFAULT 10,
  created_count INT DEFAULT 0,
  knowledge_base_id INT DEFAULT NULL,
  prompt_id INT DEFAULT NULL,
  error_msg TEXT,
  status ENUM('pending','running','completed','failed') DEFAULT 'pending',
  last_write_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 文章表
CREATE TABLE articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_id INT DEFAULT NULL,
  title VARCHAR(500) NOT NULL,
  content LONGTEXT,
  category VARCHAR(200) DEFAULT '',
  word_count INT DEFAULT 0,
  status ENUM('draft','pending','published') DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_task (task_id)
);

-- 爆文复刻表
CREATE TABLE hot_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category VARCHAR(200) DEFAULT '',
  url VARCHAR(1000) NOT NULL,
  title VARCHAR(500) DEFAULT '',
  rewritten_content LONGTEXT,
  rewrite_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 批量复刻任务表
CREATE TABLE batch_rewrite_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  keyword VARCHAR(200) DEFAULT '',
  max_rewrite INT DEFAULT 50,
  current_count INT DEFAULT 0,
  status ENUM('pending','running','completed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 网站媒体表
CREATE TABLE media_outlets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  tags JSON,
  industry VARCHAR(100) DEFAULT '',
  region VARCHAR(100) DEFAULT '',
  portal VARCHAR(100) DEFAULT '',
  pc_weight INT DEFAULT 0,
  mobile_weight INT DEFAULT 0,
  publish_time VARCHAR(50) DEFAULT '',
  success_rate INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  entry_level VARCHAR(50) DEFAULT '',
  index_type VARCHAR(50) DEFAULT '',
  link_type VARCHAR(50) DEFAULT '',
  special_industry VARCHAR(100) DEFAULT '',
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 自媒体大V表
CREATE TABLE selfmedia_outlets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  platform VARCHAR(100) DEFAULT '',
  industry VARCHAR(100) DEFAULT '',
  region VARCHAR(100) DEFAULT '',
  followers VARCHAR(50) DEFAULT '',
  `reads` VARCHAR(50) DEFAULT '',
  verified TINYINT DEFAULT 0,
  official TINYINT DEFAULT 0,
  publish_time VARCHAR(50) DEFAULT '',
  success_rate INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 投稿记录表
CREATE TABLE submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  media_type ENUM('web','self','personal','seo') NOT NULL,
  media_id INT NOT NULL,
  media_name VARCHAR(200) DEFAULT '',
  article_id INT DEFAULT NULL,
  title VARCHAR(500) DEFAULT '',
  price DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('pending','published','rejected') DEFAULT 'pending',
  publish_url VARCHAR(1000) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 个人自媒体账号表
CREATE TABLE user_media_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(200) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  platform VARCHAR(100) DEFAULT '',
  publish_status ENUM('active','paused') DEFAULT 'active',
  proxy_ip VARCHAR(100) DEFAULT '',
  today_count INT DEFAULT 0,
  status ENUM('online','offline') DEFAULT 'offline',
  auth_code VARCHAR(50) DEFAULT '',
  auth_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- SEO站点表
CREATE TABLE sites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  site_type VARCHAR(100) DEFAULT '',
  domain VARCHAR(500) NOT NULL,
  published_count INT DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 平台收录数据表
CREATE TABLE platform_indexing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  keyword VARCHAR(200) DEFAULT '',
  platform VARCHAR(50) NOT NULL,
  indexed TINYINT DEFAULT 0,
  source VARCHAR(100) DEFAULT '',
  query_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  screenshot_url VARCHAR(1000) DEFAULT '',
  INDEX idx_user (user_id),
  INDEX idx_platform (platform)
);

-- 点数消耗记录表
CREATE TABLE score_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project VARCHAR(200) DEFAULT '',
  points INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 余额变动记录表
CREATE TABLE balance_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project VARCHAR(200) DEFAULT '',
  amount DECIMAL(10,2) DEFAULT 0.00,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 用户权益配额表
CREATE TABLE user_quotas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  max_keywords INT DEFAULT 0,
  max_questions INT DEFAULT 0,
  max_ai_writing INT DEFAULT 0,
  max_publishing INT DEFAULT 0,
  max_media_auth INT DEFAULT 0,
  max_image_storage INT DEFAULT 0 COMMENT 'MB',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
);

-- 插入默认管理演示账号
INSERT INTO users (username, password, nickname, vip_expiry, status, verified, real_name) VALUES
('geo123', '$2a$10$rQkG7Kw0Z6CxVc2xDg8Kke2m1Yq5Xh0d3L4VJ5dN7uK8JxR3m9Hy', 'GEO演示', '2066-06-06', 1, 1, '演示号');
