-- Demo account for local dev / staging. DO NOT apply to production.
--
-- Username: geo123
-- Password: geo123456  (bcrypt cost 12)
--
-- Regenerate the hash if you rotate the password:
--   node -e "console.log(require('bcryptjs').hashSync('new-password', 12))"
USE geo_system;

INSERT INTO users (username, password, nickname, vip_expiry, status, verified, real_name)
VALUES (
  'geo123',
  '$2a$12$3sTmXJ1zV0rQ8yk6m9yG1OY9uJ7kQHWcVQq7EHMA9FhTQTI1n0.lG',
  'GEO演示',
  '2066-06-06',
  1,
  1,
  '演示号'
)
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);
