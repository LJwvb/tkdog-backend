-- 积分/打卡功能迁移
USE `demo`;

-- 每日打卡
CREATE TABLE IF NOT EXISTS `checkin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '打卡用户ID',
  `checkin_date` varchar(10) NOT NULL COMMENT '打卡日期 YYYY-MM-DD',
  `ctime` varchar(50) DEFAULT NULL COMMENT '打卡时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `checkin_date`),
  KEY `idx_checkin_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 评论回复（楼层回复，parent_id 指向父评论）
ALTER TABLE `comment` ADD COLUMN `parent_id` int(11) DEFAULT NULL COMMENT '父评论ID（回复某条评论时使用）';
ALTER TABLE `comment` ADD COLUMN `reply_username` varchar(255) DEFAULT NULL COMMENT '被回复人用户名';

-- 题目纠错反馈
CREATE TABLE IF NOT EXISTS `question_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL COMMENT '题目ID',
  `user_id` int(11) NOT NULL COMMENT '反馈用户ID',
  `type` varchar(30) DEFAULT 'error' COMMENT '反馈类型 error/wrong_answer/typo',
  `content` varchar(500) DEFAULT NULL COMMENT '反馈内容',
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已处理',
  `ctime` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_feedback_question` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
