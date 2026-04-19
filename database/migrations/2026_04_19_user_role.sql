-- Add role column to users for the first RBAC rollout.
-- Existing rows default to 'user'; promote an admin manually:
--   UPDATE users SET role = 'admin' WHERE username = 'you@example.com';
USE geo_system;

ALTER TABLE users
  ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user' AFTER status;

ALTER TABLE users ADD INDEX idx_role (role);
