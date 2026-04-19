-- Apply this against existing databases that were initialized before audit_logs existed.
USE geo_system;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  username VARCHAR(50) DEFAULT NULL,
  action VARCHAR(64) NOT NULL,
  detail VARCHAR(500) DEFAULT NULL,
  ip VARCHAR(64) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action_time (action, created_at),
  INDEX idx_ip_time (ip, created_at)
);
