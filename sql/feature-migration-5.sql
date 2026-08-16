-- session 共享存储（解决 cluster 多进程登录态串号）
USE `demo`;

CREATE TABLE IF NOT EXISTS `session` (
  `id` varchar(255) NOT NULL COMMENT 'session id (cookie EGG_SESS)',
  `data` text COMMENT 'session 序列化数据',
  `expire_at` bigint(20) DEFAULT NULL COMMENT '过期时间戳(ms)',
  `update_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expire` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
