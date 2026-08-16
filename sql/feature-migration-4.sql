-- 通知关联题目/评论，支持点击跳转定位
USE `demo`;

ALTER TABLE `notification` ADD COLUMN `question_id` int(11) DEFAULT NULL COMMENT '关联题目ID';
ALTER TABLE `notification` ADD COLUMN `comment_id` int(11) DEFAULT NULL COMMENT '关联评论ID';
