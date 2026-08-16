-- 违禁词可管理 + 分级匹配
USE `demo`;

-- 违禁词表
CREATE TABLE IF NOT EXISTS `sensitive_word` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL COMMENT '违禁词',
  `level` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=直接拦截 2=待审核',
  `ctime` varchar(50) DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 评论审核状态
ALTER TABLE `comment` ADD COLUMN `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=通过 0=待审核';

-- 预置分级词（明显脏话→拦截，广告/引流→待审核）
INSERT INTO `sensitive_word` (`word`, `level`, `ctime`) VALUES
('傻逼', 1, NOW()), ('煞笔', 1, NOW()), ('傻叉', 1, NOW()), ('脑残', 1, NOW()),
('弱智', 1, NOW()), ('白痴', 1, NOW()), ('智障', 1, NOW()), ('废物', 1, NOW()),
('垃圾人', 1, NOW()), ('贱人', 1, NOW()), ('贱货', 1, NOW()), ('混蛋', 1, NOW()),
('王八蛋', 1, NOW()), ('畜生', 1, NOW()), ('狗东西', 1, NOW()), ('妈的', 1, NOW()),
('他妈', 1, NOW()), ('你妈', 1, NOW()), ('草泥马', 1, NOW()), ('卧槽', 1, NOW()),
('我操', 1, NOW()), ('我靠', 1, NOW()), ('滚蛋', 1, NOW()), ('去死', 1, NOW()),
('死全家', 1, NOW()), ('色情', 1, NOW()), ('裸聊', 1, NOW()), ('约炮', 1, NOW()),
('一夜情', 1, NOW()), ('嫖娼', 1, NOW()), ('卖淫', 1, NOW()), ('黄色网站', 1, NOW()),
('代刷', 2, NOW()), ('刷单', 2, NOW()), ('办证', 2, NOW()), ('加微信', 2, NOW()),
('加v', 2, NOW()), ('加V', 2, NOW()), ('兼职日结', 2, NOW())
ON DUPLICATE KEY UPDATE `level` = VALUES(`level`);
