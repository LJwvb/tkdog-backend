-- 纠错反馈完整化：处理备注/时间/处理人
USE `demo`;

ALTER TABLE `question_feedback` ADD COLUMN `resolve_remark` varchar(500) DEFAULT NULL COMMENT '处理备注';
ALTER TABLE `question_feedback` ADD COLUMN `resolve_time` varchar(50) DEFAULT NULL COMMENT '处理时间';
ALTER TABLE `question_feedback` ADD COLUMN `resolver` varchar(255) DEFAULT NULL COMMENT '处理人';
