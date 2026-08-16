-- =============================================================
-- 题库狗 产品功能迁移：在线做题判分 / 答题统计 / 错题本 / 消息通知
-- 说明：均为增量表，使用 CREATE TABLE IF NOT EXISTS，可重复执行。
-- =============================================================
USE `demo`;

-- 试卷作答记录（一次整卷提交一行）
CREATE TABLE IF NOT EXISTS `paper_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '作答用户ID',
  `paper_id` int(11) NOT NULL COMMENT '试卷ID',
  `score` int(11) NOT NULL DEFAULT 0 COMMENT '得分（客观题答对数量）',
  `question_num` int(11) NOT NULL DEFAULT 0 COMMENT '题目总数',
  `correct_num` int(11) NOT NULL DEFAULT 0 COMMENT '答对数量',
  `wrong_num` int(11) NOT NULL DEFAULT 0 COMMENT '答错数量',
  `subjective_num` int(11) NOT NULL DEFAULT 0 COMMENT '主观题（待批改）数量',
  `ctime` varchar(50) DEFAULT NULL COMMENT '提交时间',
  PRIMARY KEY (`id`),
  KEY `idx_paper_record_user` (`user_id`),
  KEY `idx_paper_record_paper` (`paper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 答题明细（一题一行，通过 record_id 关联一次整卷作答）
CREATE TABLE IF NOT EXISTS `answer_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `record_id` int(11) NOT NULL COMMENT 'paper_record.id',
  `user_id` int(11) NOT NULL COMMENT '作答用户ID',
  `paper_id` int(11) NOT NULL COMMENT '试卷ID',
  `question_id` int(11) NOT NULL COMMENT '题目ID',
  `user_answer` text COMMENT '用户作答内容',
  `is_correct` tinyint(1) DEFAULT NULL COMMENT '1对 0错 NULL主观题不判分',
  `ctime` varchar(50) DEFAULT NULL COMMENT '作答时间',
  PRIMARY KEY (`id`),
  KEY `idx_answer_record_user` (`user_id`),
  KEY `idx_answer_record_question` (`question_id`),
  KEY `idx_answer_record_record` (`record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息通知
CREATE TABLE IF NOT EXISTS `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '接收用户ID',
  `type` varchar(30) NOT NULL DEFAULT 'system' COMMENT '通知类型',
  `title` varchar(255) DEFAULT NULL COMMENT '标题',
  `content` varchar(500) DEFAULT NULL COMMENT '内容',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0未读 1已读',
  `ctime` varchar(50) DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_notification_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
