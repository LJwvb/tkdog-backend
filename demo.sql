/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.18-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: demo
-- ------------------------------------------------------
-- Server version	10.11.18-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `demo`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `demo` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;

USE `demo`;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `last_login_time` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES
(1,'admin','$2b$10$JMXVAHIzUTbIIRsqmN6hPevlEv8tQpFlEyed8/oeDImP20iurHBEq','2026-08-26 22:39:58');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement`
--

DROP TABLE IF EXISTS `announcement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `ctime` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement`
--

LOCK TABLES `announcement` WRITE;
/*!40000 ALTER TABLE `announcement` DISABLE KEYS */;
INSERT INTO `announcement` VALUES
(2,'顶顶顶顶','','2026-08-24 23:49:48',0);
/*!40000 ALTER TABLE `announcement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `answer_record`
--

DROP TABLE IF EXISTS `answer_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `answer_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `record_id` int(11) NOT NULL COMMENT 'paper_record.id',
  `user_id` int(11) NOT NULL COMMENT '作答用户ID',
  `paper_id` int(11) NOT NULL COMMENT '试卷ID',
  `question_id` int(11) NOT NULL COMMENT '题目ID',
  `user_answer` text DEFAULT NULL COMMENT '用户作答内容',
  `is_correct` tinyint(1) DEFAULT NULL COMMENT '1对 0错 NULL主观题不判分',
  `ctime` datetime DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `max_score` int(11) NOT NULL DEFAULT 0 COMMENT '该题满分',
  PRIMARY KEY (`id`),
  KEY `idx_answer_record_user` (`user_id`),
  KEY `idx_answer_record_question` (`question_id`),
  KEY `idx_answer_record_record` (`record_id`)
) ENGINE=InnoDB AUTO_INCREMENT=314 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `answer_record`
--

LOCK TABLES `answer_record` WRITE;
/*!40000 ALTER TABLE `answer_record` DISABLE KEYS */;
INSERT INTO `answer_record` VALUES
(18,5,2,50,570,'A',1,'2026-08-16 00:08:43',NULL,0),
(19,5,2,50,571,'A',1,'2026-08-16 00:08:43',NULL,0),
(20,5,2,50,574,'ABCD',1,'2026-08-16 00:08:43',NULL,0),
(21,5,2,50,575,'ABCD',1,'2026-08-16 00:08:43',NULL,0),
(22,5,2,50,583,'',0,'2026-08-16 00:08:43',NULL,0),
(23,5,2,50,584,'',0,'2026-08-16 00:08:43',NULL,0),
(24,5,2,50,585,'',0,'2026-08-16 00:08:43',NULL,0),
(25,5,2,50,589,'',1,'2026-08-16 00:08:43',NULL,0),
(26,5,2,50,591,'',1,'2026-08-16 00:08:43',NULL,0),
(27,5,2,50,593,'',1,'2026-08-16 00:08:43',NULL,0),
(36,6,4,56,586,'',1,'2026-08-16 00:25:07',NULL,0),
(98,12,4,47,562,'A',0,'2026-08-24 21:33:57',NULL,0),
(99,12,4,47,564,'A',1,'2026-08-24 21:33:57',NULL,0),
(100,12,4,47,565,'B',0,'2026-08-24 21:33:57',NULL,0),
(101,12,4,47,566,'A',1,'2026-08-24 21:33:57',NULL,0),
(102,12,4,47,578,'正确',1,'2026-08-24 21:33:57',NULL,0),
(103,12,4,47,580,'正确',1,'2026-08-24 21:33:57',NULL,0),
(104,12,4,47,581,'',0,'2026-08-24 21:33:57',NULL,0),
(105,12,4,47,572,'AB',0,'2026-08-24 21:33:57',NULL,0),
(106,12,4,47,576,'BC',0,'2026-08-24 21:33:57',NULL,0),
(107,12,4,47,586,'大撒发射点',NULL,'2026-08-24 21:33:57',NULL,0),
(108,12,4,47,587,'二ware啊我热温热',NULL,'2026-08-24 21:33:57',NULL,0),
(109,12,4,47,592,'阿斯顿发大水发大水发',NULL,'2026-08-24 21:33:57',NULL,0),
(110,13,4,48,562,'A',0,'2026-08-24 21:37:04',NULL,0),
(111,13,4,48,563,'B',0,'2026-08-24 21:37:04',NULL,0),
(112,13,4,48,569,'C',0,'2026-08-24 21:37:04',NULL,0),
(113,13,4,48,578,'正确',1,'2026-08-24 21:37:04',NULL,0),
(114,13,4,48,579,'正确',0,'2026-08-24 21:37:04',NULL,0),
(115,13,4,48,577,'B',0,'2026-08-24 21:37:04',NULL,0),
(116,13,4,48,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明',1,'2026-08-24 21:37:04',NULL,0),
(121,14,4,64,562,'A',0,'2026-08-24 21:40:21',NULL,0),
(122,14,4,64,569,'A',1,'2026-08-24 21:40:21',NULL,0),
(123,14,4,64,623,'A',1,'2026-08-24 21:40:21',NULL,0),
(124,14,4,64,610,'A',1,'2026-08-24 21:40:21',NULL,0),
(125,14,4,64,594,'A',1,'2026-08-24 21:40:21',NULL,0),
(126,15,4,47,562,'A',0,'2026-08-24 21:48:52',NULL,0),
(127,15,4,47,564,'A',1,'2026-08-24 21:48:52',NULL,0),
(128,15,4,47,565,'A',1,'2026-08-24 21:48:52',NULL,0),
(129,15,4,47,566,'A',1,'2026-08-24 21:48:52',NULL,0),
(130,15,4,47,578,'正确',1,'2026-08-24 21:48:52',NULL,0),
(131,15,4,47,580,'正确',1,'2026-08-24 21:48:52',NULL,0),
(132,15,4,47,581,'正确',1,'2026-08-24 21:48:52',NULL,0),
(133,15,4,47,572,'ABCD',1,'2026-08-24 21:48:52',NULL,0),
(134,15,4,47,576,'ACDB',1,'2026-08-24 21:48:52',NULL,0),
(135,15,4,47,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量',1,'2026-08-24 21:48:52',NULL,0),
(136,15,4,47,587,'请简述标准盒模型由哪些部分组成。',1,'2026-08-24 21:48:52',NULL,0),
(137,15,4,47,592,'请简述从输入 URL 到页面显示经历了哪些主要步骤。',NULL,'2026-08-24 21:48:52',NULL,0),
(138,16,4,47,562,'A',0,'2026-08-24 22:01:23',NULL,0),
(139,16,4,47,564,'A',1,'2026-08-24 22:01:23',NULL,0),
(140,16,4,47,565,'A',1,'2026-08-24 22:01:23',NULL,0),
(141,16,4,47,566,'A',1,'2026-08-24 22:01:24',NULL,0),
(142,16,4,47,578,'正确',1,'2026-08-24 22:01:24',NULL,0),
(143,16,4,47,580,'正确',1,'2026-08-24 22:01:24',NULL,0),
(144,16,4,47,581,'正确',1,'2026-08-24 22:01:24',NULL,0),
(145,16,4,47,572,'ABCD',1,'2026-08-24 22:01:24',NULL,0),
(146,16,4,47,576,'ABCD',1,'2026-08-24 22:01:24',NULL,0),
(147,16,4,47,586,'var、let、const',0,'2026-08-24 22:01:24',NULL,0),
(148,16,4,47,587,'准盒模型',1,'2026-08-24 22:01:24',NULL,0),
(149,16,4,47,592,'不知道啊',0,'2026-08-24 22:01:24',NULL,0),
(150,17,4,47,562,'A',0,'2026-08-24 22:07:05',NULL,0),
(151,17,4,47,564,'A',1,'2026-08-24 22:07:05',NULL,0),
(152,17,4,47,565,'A',1,'2026-08-24 22:07:05',NULL,0),
(153,17,4,47,566,'A',1,'2026-08-24 22:07:05',NULL,0),
(154,17,4,47,578,'正确',1,'2026-08-24 22:07:05',NULL,0),
(155,17,4,47,580,'正确',1,'2026-08-24 22:07:05',NULL,0),
(156,17,4,47,581,'正确',1,'2026-08-24 22:07:05',NULL,0),
(157,17,4,47,572,'A',0,'2026-08-24 22:07:05',NULL,0),
(158,17,4,47,576,'A',0,'2026-08-24 22:07:05',NULL,0),
(159,17,4,47,586,'准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型',0,'2026-08-24 22:07:05',NULL,0),
(160,17,4,47,587,'准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型',0,'2026-08-24 22:07:05',NULL,0),
(161,17,4,47,592,'准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型准盒模型',0,'2026-08-24 22:07:05',NULL,0),
(162,18,4,47,562,'A',0,'2026-08-24 22:07:54',NULL,0),
(163,18,4,47,564,'A',1,'2026-08-24 22:07:54',NULL,0),
(164,18,4,47,565,'A',1,'2026-08-24 22:07:54',NULL,0),
(165,18,4,47,566,'A',1,'2026-08-24 22:07:54',NULL,0),
(166,18,4,47,578,'正确',1,'2026-08-24 22:07:54',NULL,0),
(167,18,4,47,580,'正确',1,'2026-08-24 22:07:54',NULL,0),
(168,18,4,47,581,'正确',1,'2026-08-24 22:07:54',NULL,0),
(169,18,4,47,572,'ABCD',1,'2026-08-24 22:07:54',NULL,0),
(170,18,4,47,576,'ABCD',1,'2026-08-24 22:07:54',NULL,0),
(171,18,4,47,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；',1,'2026-08-24 22:07:54',NULL,0),
(172,18,4,47,587,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；',0,'2026-08-24 22:07:54',NULL,0),
(173,18,4,47,592,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；',0,'2026-08-24 22:07:54',NULL,0),
(174,19,4,65,615,'',0,'2026-08-24 23:07:17',NULL,0),
(175,19,4,65,631,'',0,'2026-08-24 23:07:17',NULL,0),
(176,19,4,65,613,'',0,'2026-08-24 23:07:17',NULL,0),
(177,19,4,65,646,'',0,'2026-08-24 23:07:17',NULL,0),
(178,19,4,65,653,'',0,'2026-08-24 23:07:17',NULL,0),
(179,19,4,65,582,'',0,'2026-08-24 23:07:17',NULL,0),
(180,19,4,65,661,'',0,'2026-08-24 23:07:17',NULL,0),
(181,19,4,65,669,'',0,'2026-08-24 23:07:17',NULL,0),
(182,19,4,65,604,'',0,'2026-08-24 23:07:17',NULL,0),
(183,19,4,65,667,'',0,'2026-08-24 23:07:17',NULL,0),
(184,20,4,65,615,'A',1,'2026-08-24 23:09:25',NULL,0),
(185,20,4,65,631,'A',1,'2026-08-24 23:09:25',NULL,0),
(186,20,4,65,613,'A',1,'2026-08-24 23:09:26',NULL,0),
(187,20,4,65,646,'ABCD',1,'2026-08-24 23:09:26',NULL,0),
(188,20,4,65,653,'ABCD',1,'2026-08-24 23:09:26',NULL,0),
(189,20,4,65,582,'正确',0,'2026-08-24 23:09:26',NULL,0),
(190,20,4,65,661,'正确',1,'2026-08-24 23:09:26',NULL,0),
(191,20,4,65,669,' v-if是dom会消失 \n v-show本质就是渐显渐隐',0,'2026-08-24 23:09:26',NULL,0),
(192,20,4,65,604,'重排\n重绘',0,'2026-08-24 23:09:26',NULL,0),
(193,20,4,65,667,'事件捕获由外向内触发，事件冒泡由内向外触发；',0,'2026-08-24 23:09:26',NULL,0),
(194,21,4,55,615,'A',1,'2026-08-24 23:20:58',17,0),
(195,21,4,55,616,'正确',1,'2026-08-24 23:20:58',17,0),
(196,21,4,55,617,'A',1,'2026-08-24 23:20:58',17,0),
(197,21,4,55,618,'正确',1,'2026-08-24 23:20:58',17,0),
(198,21,4,55,623,'B',0,'2026-08-24 23:20:58',0,0),
(199,21,4,55,624,'正确',1,'2026-08-24 23:20:58',17,0),
(200,22,4,47,562,'A',0,'2026-08-24 23:26:39',0,0),
(201,22,4,47,564,'A',1,'2026-08-24 23:26:39',8,0),
(202,22,4,47,565,'A',1,'2026-08-24 23:26:39',8,0),
(203,22,4,47,566,'A',1,'2026-08-24 23:26:39',8,0),
(204,22,4,47,578,'正确',1,'2026-08-24 23:26:39',8,0),
(205,22,4,47,580,'正确',1,'2026-08-24 23:26:39',8,0),
(206,22,4,47,581,'正确',1,'2026-08-24 23:26:39',8,0),
(207,22,4,47,572,'ABCD',1,'2026-08-24 23:26:39',8,0),
(208,22,4,47,576,'A',0,'2026-08-24 23:26:39',0,0),
(209,22,4,47,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',1,'2026-08-24 23:26:39',8,0),
(210,22,4,47,587,'不划算发生的的撒范德萨发顺丰撒地方',0,'2026-08-24 23:26:39',0,0),
(211,22,4,47,592,'暗色法大师傅',0,'2026-08-24 23:26:39',0,0),
(212,23,4,47,562,'A',0,'2026-08-24 23:31:51',0,9),
(213,23,4,47,564,'A',1,'2026-08-24 23:31:51',9,9),
(214,23,4,47,565,'A',1,'2026-08-24 23:31:51',9,9),
(215,23,4,47,566,'A',1,'2026-08-24 23:31:51',9,9),
(216,23,4,47,578,'正确',1,'2026-08-24 23:31:51',8,8),
(217,23,4,47,580,'正确',1,'2026-08-24 23:31:51',8,8),
(218,23,4,47,581,'正确',1,'2026-08-24 23:31:51',8,8),
(219,23,4,47,572,'ABCD',1,'2026-08-24 23:31:51',8,8),
(220,23,4,47,576,'ABCD',1,'2026-08-24 23:31:51',8,8),
(221,23,4,47,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',1,'2026-08-24 23:31:51',8,8),
(222,23,4,47,587,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',0,'2026-08-24 23:31:51',0,8),
(223,23,4,47,592,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',0,'2026-08-24 23:31:51',0,8),
(224,24,4,47,562,'A',0,'2026-08-24 23:36:22',0,9),
(225,24,4,47,564,'A',1,'2026-08-24 23:36:22',9,9),
(226,24,4,47,565,'A',1,'2026-08-24 23:36:22',9,9),
(227,24,4,47,566,'D',0,'2026-08-24 23:36:22',0,9),
(228,24,4,47,578,'正确',1,'2026-08-24 23:36:22',8,8),
(229,24,4,47,580,'正确',1,'2026-08-24 23:36:22',8,8),
(230,24,4,47,581,'正确',1,'2026-08-24 23:36:22',8,8),
(231,24,4,47,572,'A',0,'2026-08-24 23:36:22',0,8),
(232,24,4,47,576,'A',0,'2026-08-24 23:36:22',0,8),
(233,24,4,47,586,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',1,'2026-08-24 23:36:22',8,8),
(234,24,4,47,587,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',0,'2026-08-24 23:36:22',0,8),
(235,24,4,47,592,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。',0,'2026-08-24 23:36:22',0,8),
(236,25,4,66,577,'',0,'2026-08-24 23:48:16',0,4),
(237,25,4,66,669,'',0,'2026-08-24 23:48:16',0,4),
(238,25,4,66,604,'',0,'2026-08-24 23:48:16',0,4),
(239,25,4,66,590,'',0,'2026-08-24 23:48:16',0,4),
(240,25,4,66,670,'',0,'2026-08-24 23:48:16',0,4),
(241,25,4,66,588,'',0,'2026-08-24 23:48:16',0,4),
(242,25,4,66,593,'',0,'2026-08-24 23:48:16',0,4),
(243,25,4,66,619,'',0,'2026-08-24 23:48:16',0,3),
(244,25,4,66,567,'',0,'2026-08-24 23:48:16',0,3),
(245,25,4,66,645,'',0,'2026-08-24 23:48:16',0,3),
(246,25,4,66,598,'',0,'2026-08-24 23:48:16',0,3),
(247,25,4,66,565,'',0,'2026-08-24 23:48:16',0,3),
(248,25,4,66,627,'',0,'2026-08-24 23:48:16',0,3),
(249,25,4,66,636,'',0,'2026-08-24 23:48:16',0,3),
(250,25,4,66,630,'',0,'2026-08-24 23:48:16',0,3),
(251,25,4,66,633,'',0,'2026-08-24 23:48:16',0,2),
(252,25,4,66,601,'',0,'2026-08-24 23:48:16',0,2),
(253,25,4,66,605,'',0,'2026-08-24 23:48:16',0,2),
(254,25,4,66,573,'',0,'2026-08-24 23:48:16',0,2),
(255,25,4,66,572,'',0,'2026-08-24 23:48:16',0,2),
(256,25,4,66,648,'',0,'2026-08-24 23:48:16',0,2),
(257,25,4,66,647,'',0,'2026-08-24 23:48:16',0,2),
(258,25,4,66,574,'',0,'2026-08-24 23:48:16',0,2),
(259,25,4,66,646,'',0,'2026-08-24 23:48:16',0,2),
(260,25,4,66,649,'',0,'2026-08-24 23:48:16',0,2),
(261,25,4,66,575,'',0,'2026-08-24 23:48:16',0,2),
(262,25,4,66,653,'',0,'2026-08-24 23:48:16',0,2),
(263,25,4,66,576,'',0,'2026-08-24 23:48:16',0,2),
(264,25,4,66,582,'',0,'2026-08-24 23:48:16',0,2),
(265,25,4,66,660,'',0,'2026-08-24 23:48:16',0,2),
(266,25,4,66,579,'',0,'2026-08-24 23:48:16',0,2),
(267,25,4,66,616,'',0,'2026-08-24 23:48:16',0,2),
(268,25,4,66,585,'',0,'2026-08-24 23:48:16',0,2),
(269,25,4,66,664,'',0,'2026-08-24 23:48:16',0,2),
(270,25,4,66,657,'',0,'2026-08-24 23:48:16',0,2),
(271,25,4,66,614,'',0,'2026-08-24 23:48:16',0,2),
(272,25,4,66,666,'',0,'2026-08-24 23:48:16',0,2),
(273,25,4,66,596,'',0,'2026-08-24 23:48:16',0,2),
(274,25,4,66,592,'',0,'2026-08-24 23:48:16',0,2),
(275,26,4,66,577,'',0,'2026-08-24 23:50:46',0,4),
(276,26,4,66,669,'',0,'2026-08-24 23:50:46',0,4),
(277,26,4,66,604,'',0,'2026-08-24 23:50:46',0,4),
(278,26,4,66,590,'',0,'2026-08-24 23:50:46',0,4),
(279,26,4,66,670,'',0,'2026-08-24 23:50:46',0,4),
(280,26,4,66,588,'',0,'2026-08-24 23:50:46',0,4),
(281,26,4,66,593,'',0,'2026-08-24 23:50:46',0,4),
(282,26,4,66,619,'',0,'2026-08-24 23:50:46',0,3),
(283,26,4,66,567,'',0,'2026-08-24 23:50:46',0,3),
(284,26,4,66,645,'',0,'2026-08-24 23:50:46',0,3),
(285,26,4,66,598,'',0,'2026-08-24 23:50:46',0,3),
(286,26,4,66,565,'',0,'2026-08-24 23:50:46',0,3),
(287,26,4,66,627,'',0,'2026-08-24 23:50:46',0,3),
(288,26,4,66,636,'',0,'2026-08-24 23:50:46',0,3),
(289,26,4,66,630,'',0,'2026-08-24 23:50:46',0,3),
(290,26,4,66,633,'',0,'2026-08-24 23:50:46',0,2),
(291,26,4,66,601,'',0,'2026-08-24 23:50:46',0,2),
(292,26,4,66,605,'',0,'2026-08-24 23:50:46',0,2),
(293,26,4,66,573,'',0,'2026-08-24 23:50:46',0,2),
(294,26,4,66,572,'',0,'2026-08-24 23:50:46',0,2),
(295,26,4,66,648,'',0,'2026-08-24 23:50:46',0,2),
(296,26,4,66,647,'',0,'2026-08-24 23:50:46',0,2),
(297,26,4,66,574,'',0,'2026-08-24 23:50:46',0,2),
(298,26,4,66,646,'',0,'2026-08-24 23:50:46',0,2),
(299,26,4,66,649,'',0,'2026-08-24 23:50:46',0,2),
(300,26,4,66,575,'',0,'2026-08-24 23:50:46',0,2),
(301,26,4,66,653,'',0,'2026-08-24 23:50:46',0,2),
(302,26,4,66,576,'',0,'2026-08-24 23:50:46',0,2),
(303,26,4,66,582,'',0,'2026-08-24 23:50:46',0,2),
(304,26,4,66,660,'',0,'2026-08-24 23:50:46',0,2),
(305,26,4,66,579,'',0,'2026-08-24 23:50:46',0,2),
(306,26,4,66,616,'',0,'2026-08-24 23:50:46',0,2),
(307,26,4,66,585,'',0,'2026-08-24 23:50:46',0,2),
(308,26,4,66,664,'',0,'2026-08-24 23:50:46',0,2),
(309,26,4,66,657,'',0,'2026-08-24 23:50:46',0,2),
(310,26,4,66,614,'',0,'2026-08-24 23:50:46',0,2),
(311,26,4,66,666,'',0,'2026-08-24 23:50:46',0,2),
(312,26,4,66,596,'',0,'2026-08-24 23:50:46',0,2),
(313,26,4,66,592,'',0,'2026-08-24 23:50:46',0,2);
/*!40000 ALTER TABLE `answer_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkin`
--

DROP TABLE IF EXISTS `checkin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '打卡用户ID',
  `checkin_date` date NOT NULL,
  `ctime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`,`checkin_date`),
  KEY `idx_checkin_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkin`
--

LOCK TABLES `checkin` WRITE;
/*!40000 ALTER TABLE `checkin` DISABLE KEYS */;
INSERT INTO `checkin` VALUES
(2,2,'2026-08-15','2026-08-15 21:02:10'),
(3,1,'2026-08-15','2026-08-15 21:09:25'),
(4,4,'2026-08-16','2026-08-16 00:36:08'),
(5,2,'2026-08-16','2026-08-16 17:13:56'),
(6,4,'2026-08-24','2026-08-24 23:10:42'),
(7,4,'2026-08-25','2026-08-25 00:17:35'),
(8,4,'2026-08-26','2026-08-26 21:57:10');
/*!40000 ALTER TABLE `checkin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `create_time` datetime DEFAULT current_timestamp(),
  `question_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL COMMENT '父评论ID（回复某条评论时使用）',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=通过 0=待审核',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `images` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment`
--

LOCK TABLES `comment` WRITE;
/*!40000 ALTER TABLE `comment` DISABLE KEYS */;
INSERT INTO `comment` VALUES
(126,4,'我去饿v','2026-08-25 00:27:24',678,NULL,1,0,0,'[\"/public/uploads/1787588838162_qwrf39.jpg\"]'),
(127,4,'二万人','2026-08-25 00:28:09',678,126,1,1,0,'[\"/public/uploads/1787588887302_yfwzmr.jpg\"]');
/*!40000 ALTER TABLE `comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_like`
--

DROP TABLE IF EXISTS `comment_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_like` (
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_like`
--

LOCK TABLES `comment_like` WRITE;
/*!40000 ALTER TABLE `comment_like` DISABLE KEYS */;
INSERT INTO `comment_like` VALUES
(4,126,'2026-08-25 00:27:27'),
(4,127,'2026-08-25 00:29:54');
/*!40000 ALTER TABLE `comment_like` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `examination_paper`
--

DROP TABLE IF EXISTS `examination_paper`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `examination_paper` (
  `author` varchar(255) NOT NULL COMMENT '试卷作者',
  `ctime` datetime NOT NULL COMMENT '创建时间',
  `paper_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '试卷编号',
  `paper_title` varchar(255) NOT NULL COMMENT '试卷标题',
  `paper_tags` varchar(255) NOT NULL COMMENT '试卷标签',
  `purview` int(2) NOT NULL COMMENT '试卷权限',
  `chkState` int(2) NOT NULL COMMENT '审核状态',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`paper_id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `examination_paper`
--

LOCK TABLES `examination_paper` WRITE;
/*!40000 ALTER TABLE `examination_paper` DISABLE KEYS */;
INSERT INTO `examination_paper` VALUES
('admin','2026-08-15 23:53:54',47,'前端基础综合测验','前端,HTML,CSS,JavaScript',-1,1,0),
('admin','2026-08-15 23:53:54',48,'JavaScript 与 TypeScript 语言专项','JavaScript,TypeScript,ES6',-1,1,0),
('admin','2026-08-15 23:53:54',49,'Vue 与 React 框架专项','Vue,React,前端框架',-1,1,0),
('admin','2026-08-15 23:53:54',50,'计算机网络与工程协作综合','HTTP,Git,Node,网络',-1,1,0),
('admin','2026-08-16 00:14:53',51,'前端框架进阶（Angular/Vue/React）','Angular,Vue,React,前端框架',-1,1,0),
('admin','2026-08-16 00:14:53',52,'前端工程化与构建（Webpack/Git）','Webpack,Git,工程化',-1,1,0),
('admin','2026-08-16 00:14:53',53,'浏览器原理与 CSS','浏览器,CSS,渲染',-1,1,0),
('admin','2026-08-16 00:14:53',54,'计算机网络与 Node','HTTP,Node,网络',-1,1,0),
('admin','2026-08-16 00:14:53',55,'前端语言基础（JS/HTML/TS）','JavaScript,HTML,TypeScript',-1,1,0),
('admin','2026-08-16 00:25:05',56,'随机练习-1786811105853','',3,1,0),
('admin','2026-08-16 00:27:35',57,'随机练习-1786811255858','',3,1,0),
('admin','2026-08-16 00:28:12',58,'随机练习-1786811292541','',3,1,0),
('请问','2026-08-16 00:31:35',59,'随机练习-1786811495246','',1,1,0),
('请问','2026-08-16 00:41:15',60,'随机练习-1786812075266','',1,0,0),
('请问','2026-08-16 01:05:58',61,'随机练习-1786813558708','',3,1,0),
('请问','2026-08-16 01:08:58',62,'错题重练-1786813738734','',3,1,0),
('小米','2026-08-16 17:44:12',63,'是否','',1,1,0),
('请问','2026-08-24 21:39:05',64,'test','',3,1,0),
('请问','2026-08-24 23:07:12',65,'随机练习-1787584032489','',3,1,0),
('请问','2026-08-24 23:47:16',66,'个人练习生','你干嘛,厉不厉害',1,1,0),
('请问','2026-08-24 23:54:09',67,'错题重练-1787586849674','',3,1,0),
('请问','2026-08-26 22:10:27',68,'错题重练-1787753427234','',3,1,0);
/*!40000 ALTER TABLE `examination_paper` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '接收用户ID',
  `type` varchar(30) NOT NULL DEFAULT 'system' COMMENT '通知类型',
  `title` varchar(255) DEFAULT NULL COMMENT '标题',
  `content` varchar(500) DEFAULT NULL COMMENT '内容',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0未读 1已读',
  `ctime` datetime DEFAULT NULL,
  `question_id` int(11) DEFAULT NULL COMMENT '关联题目ID',
  `comment_id` int(11) DEFAULT NULL COMMENT '关联评论ID',
  PRIMARY KEY (`id`),
  KEY `idx_notification_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES
(15,4,'paper_review','试卷审核通过','你创建的试卷「随机练习-1786811495246」审核通过',1,'2026-08-16 00:40:59',NULL,NULL),
(16,4,'paper_review','试卷审核通过','你创建的试卷「随机练习-1786812075266」审核通过',1,'2026-08-16 00:41:35',NULL,NULL),
(17,4,'feedback_resolved','纠错反馈已处理','你提交的题目纠错已处理',1,'2026-08-16 00:56:42',NULL,NULL),
(18,2,'paper_review','试卷审核通过','你创建的试卷「是否」审核通过',1,'2026-08-16 17:54:49',NULL,NULL),
(19,2,'comment','收到新评论','你的题目「【Promise】下面代码的输出是什么？」收到一条新评论',1,'2026-08-16 19:44:36',NULL,NULL),
(20,4,'question_review','题目审核通过','你上传的题目「你好啊」审核通过，审核建议：牛逼',1,'2026-08-24 23:56:59',NULL,NULL),
(21,2,'question_review','题目审核通过','你上传的题目「1」审核通过',1,'2026-08-26 22:21:13',NULL,NULL),
(22,4,'paper_review','试卷审核通过','你创建的试卷「个人练习生」审核通过',0,'2026-08-26 22:40:11',NULL,NULL);
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paper_question`
--

DROP TABLE IF EXISTS `paper_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `paper_question` (
  `paper_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  PRIMARY KEY (`paper_id`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paper_question`
--

LOCK TABLES `paper_question` WRITE;
/*!40000 ALTER TABLE `paper_question` DISABLE KEYS */;
INSERT INTO `paper_question` VALUES
(47,562,0),
(47,564,1),
(47,565,2),
(47,566,3),
(47,572,7),
(47,576,8),
(47,578,4),
(47,580,5),
(47,581,6),
(47,586,9),
(47,587,10),
(47,592,11),
(48,562,0),
(48,563,1),
(48,569,2),
(48,577,5),
(48,578,3),
(48,579,4),
(48,586,6),
(49,567,0),
(49,568,1),
(49,573,2),
(49,582,3),
(49,588,4),
(49,590,5),
(50,570,0),
(50,571,1),
(50,574,2),
(50,575,3),
(50,583,4),
(50,584,5),
(50,585,6),
(50,589,7),
(50,591,8),
(50,593,9),
(51,594,0),
(51,595,1),
(51,596,2),
(51,619,3),
(51,620,4),
(51,621,5),
(51,622,6),
(52,597,0),
(52,598,1),
(52,599,2),
(52,600,3),
(52,601,4),
(52,625,5),
(52,626,6),
(53,602,0),
(53,603,1),
(53,604,2),
(53,605,3),
(53,613,4),
(53,614,5),
(54,606,0),
(54,607,1),
(54,608,2),
(54,609,3),
(54,610,4),
(54,611,5),
(54,612,6),
(55,615,0),
(55,616,1),
(55,617,2),
(55,618,3),
(55,623,4),
(55,624,5),
(56,566,1),
(56,574,3),
(56,576,4),
(56,586,8),
(56,615,2),
(56,622,5),
(56,623,0),
(56,626,6),
(57,562,1),
(57,563,2),
(57,572,3),
(57,576,4),
(57,579,5),
(57,616,6),
(57,625,0),
(58,566,0),
(58,575,3),
(58,597,2),
(58,598,1),
(58,605,4),
(58,616,5),
(58,618,6),
(59,566,0),
(59,570,2),
(59,573,3),
(59,605,4),
(59,611,6),
(59,620,5),
(59,623,1),
(60,569,2),
(60,571,0),
(60,615,1),
(61,563,1),
(61,568,0),
(61,601,4),
(61,602,2),
(61,607,5),
(61,609,3),
(61,612,8),
(61,626,6),
(62,566,13),
(62,569,4),
(62,570,11),
(62,571,6),
(62,573,10),
(62,575,3),
(62,576,19),
(62,578,1),
(62,579,18),
(62,582,0),
(62,597,16),
(62,598,17),
(62,605,9),
(62,609,2),
(62,611,7),
(62,615,5),
(62,616,15),
(62,618,14),
(62,620,8),
(62,623,12),
(63,562,2),
(63,563,1),
(63,564,5),
(63,568,4),
(63,572,0),
(63,579,8),
(63,586,9),
(63,598,6),
(63,619,3),
(63,621,7),
(64,562,4),
(64,569,5),
(64,594,8),
(64,610,7),
(64,623,6),
(65,582,5),
(65,604,8),
(65,613,2),
(65,615,0),
(65,631,1),
(65,646,3),
(65,653,4),
(65,661,6),
(65,667,9),
(65,669,7),
(66,562,3),
(66,578,4),
(66,579,6),
(66,585,5),
(66,592,2),
(66,596,1),
(66,666,0),
(67,562,41),
(67,565,27),
(67,566,40),
(67,567,30),
(67,569,49),
(67,572,19),
(67,573,20),
(67,574,16),
(67,575,13),
(67,576,11),
(67,577,38),
(67,579,8),
(67,582,10),
(67,585,6),
(67,586,48),
(67,587,39),
(67,588,33),
(67,590,35),
(67,592,0),
(67,593,32),
(67,596,1),
(67,598,28),
(67,601,22),
(67,604,36),
(67,605,21),
(67,613,45),
(67,614,3),
(67,615,47),
(67,616,7),
(67,619,31),
(67,623,42),
(67,627,26),
(67,630,24),
(67,631,46),
(67,633,23),
(67,636,25),
(67,645,29),
(67,646,15),
(67,647,17),
(67,648,18),
(67,649,14),
(67,653,12),
(67,657,4),
(67,660,9),
(67,661,44),
(67,664,5),
(67,666,2),
(67,667,43),
(67,669,37),
(67,670,34),
(68,562,41),
(68,565,27),
(68,566,40),
(68,567,30),
(68,569,49),
(68,572,19),
(68,573,20),
(68,574,16),
(68,575,13),
(68,576,11),
(68,577,38),
(68,579,8),
(68,582,10),
(68,585,6),
(68,586,48),
(68,587,39),
(68,588,33),
(68,590,35),
(68,592,0),
(68,593,32),
(68,596,1),
(68,598,28),
(68,601,22),
(68,604,36),
(68,605,21),
(68,613,45),
(68,614,3),
(68,615,47),
(68,616,7),
(68,619,31),
(68,623,42),
(68,627,26),
(68,630,24),
(68,631,46),
(68,633,23),
(68,636,25),
(68,645,29),
(68,646,15),
(68,647,17),
(68,648,18),
(68,649,14),
(68,653,12),
(68,657,4),
(68,660,9),
(68,661,44),
(68,664,5),
(68,666,2),
(68,667,43),
(68,669,37),
(68,670,34);
/*!40000 ALTER TABLE `paper_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paper_record`
--

DROP TABLE IF EXISTS `paper_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `paper_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '作答用户ID',
  `paper_id` int(11) NOT NULL COMMENT '试卷ID',
  `score` int(11) NOT NULL DEFAULT 0,
  `question_num` int(11) NOT NULL DEFAULT 0 COMMENT '题目总数',
  `correct_num` int(11) NOT NULL DEFAULT 0 COMMENT '答对数量',
  `wrong_num` int(11) NOT NULL DEFAULT 0 COMMENT '答错数量',
  `subjective_num` int(11) NOT NULL DEFAULT 0 COMMENT '主观题（待批改）数量',
  `ctime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_paper_record_user` (`user_id`),
  KEY `idx_paper_record_paper` (`paper_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paper_record`
--

LOCK TABLES `paper_record` WRITE;
/*!40000 ALTER TABLE `paper_record` DISABLE KEYS */;
INSERT INTO `paper_record` VALUES
(5,2,50,4,10,4,3,3,'2026-08-16 00:08:43'),
(6,4,56,0,10,0,7,3,'2026-08-16 00:25:07'),
(7,4,57,0,10,0,7,3,'2026-08-16 00:27:37'),
(8,4,58,0,10,0,7,3,'2026-08-16 00:28:14'),
(9,4,59,0,10,0,7,3,'2026-08-16 00:31:36'),
(10,4,60,0,10,0,7,3,'2026-08-16 00:41:17'),
(11,4,62,0,20,0,20,0,'2026-08-16 01:09:03'),
(12,4,47,4,12,4,5,3,'2026-08-24 21:33:57'),
(13,4,48,2,7,2,5,0,'2026-08-24 21:37:04'),
(14,4,64,5,9,5,1,3,'2026-08-24 21:40:21'),
(15,4,47,10,12,10,1,1,'2026-08-24 21:48:52'),
(16,4,47,9,12,9,3,0,'2026-08-24 22:01:23'),
(17,4,47,6,12,6,6,0,'2026-08-24 22:07:05'),
(18,4,47,9,12,9,3,0,'2026-08-24 22:07:54'),
(19,4,65,0,10,0,10,0,'2026-08-24 23:07:17'),
(20,4,65,6,10,6,4,0,'2026-08-24 23:09:25'),
(21,4,55,83,6,5,1,0,'2026-08-24 23:20:58'),
(22,4,47,67,12,8,4,0,'2026-08-24 23:26:39'),
(23,4,47,75,12,9,3,0,'2026-08-24 23:31:51'),
(24,4,47,50,12,6,6,0,'2026-08-24 23:36:22'),
(25,4,66,0,39,0,39,0,'2026-08-24 23:48:16'),
(26,4,66,0,39,0,39,0,'2026-08-24 23:50:46');
/*!40000 ALTER TABLE `paper_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_feedback`
--

DROP TABLE IF EXISTS `question_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL COMMENT '题目ID',
  `user_id` int(11) NOT NULL COMMENT '反馈用户ID',
  `type` varchar(30) DEFAULT 'error' COMMENT '反馈类型 error/wrong_answer/typo',
  `content` varchar(500) DEFAULT NULL COMMENT '反馈内容',
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已处理',
  `ctime` datetime DEFAULT NULL,
  `resolve_remark` varchar(500) DEFAULT NULL COMMENT '处理备注',
  `resolve_time` datetime DEFAULT NULL,
  `resolver` varchar(255) DEFAULT NULL COMMENT '处理人',
  PRIMARY KEY (`id`),
  KEY `idx_feedback_question` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_feedback`
--

LOCK TABLES `question_feedback` WRITE;
/*!40000 ALTER TABLE `question_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `question_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subjectID` int(11) DEFAULT NULL,
  `catalogID` int(11) DEFAULT NULL,
  `browses_num` int(11) DEFAULT NULL,
  `questionType` varchar(150) DEFAULT NULL,
  `difficulty` varchar(150) DEFAULT NULL,
  `question` varchar(768) DEFAULT NULL,
  `questionDetail` varchar(765) DEFAULT NULL,
  `likes_num` int(11) DEFAULT NULL,
  `favorite_num` int(11) DEFAULT 0,
  `answer` text DEFAULT NULL,
  `tags` varchar(768) DEFAULT NULL,
  `chkState` tinyint(1) DEFAULT NULL,
  `chkRemarks` varchar(768) DEFAULT NULL,
  `creator` varchar(765) DEFAULT NULL,
  `addDate` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `updateTime` datetime DEFAULT NULL COMMENT '修改时间',
  `updateUser` varchar(255) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=680 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES
(562,0,0,7,'0','0','以下哪项不是 JavaScript 的基本数据类型？','[{\"code\":\"A\",\"value\":\"Number\"},{\"code\":\"B\",\"value\":\"String\"},{\"code\":\"C\",\"value\":\"Integer\"},{\"code\":\"D\",\"value\":\"Boolean\"}]',1,1,'正确选项：C','JavaScript,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(563,0,0,3,'0','1','下列哪个方法可以向数组末尾添加一个元素？','[{\"code\":\"A\",\"value\":\"push\"},{\"code\":\"B\",\"value\":\"pop\"},{\"code\":\"C\",\"value\":\"shift\"},{\"code\":\"D\",\"value\":\"unshift\"}]',1,0,'正确选项：A','JavaScript,数组',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(564,1,0,3,'0','0','以下哪个 CSS 属性用于设置文字颜色？','[{\"code\":\"A\",\"value\":\"color\"},{\"code\":\"B\",\"value\":\"font-color\"},{\"code\":\"C\",\"value\":\"text-color\"},{\"code\":\"D\",\"value\":\"background-color\"}]',0,0,'正确选项：A','CSS,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(565,1,0,1,'0','1','下列哪个选择器的优先级最高？','[{\"code\":\"A\",\"value\":\"#id\"},{\"code\":\"B\",\"value\":\".class\"},{\"code\":\"C\",\"value\":\"element\"},{\"code\":\"D\",\"value\":\"*\"}]',0,0,'正确选项：A','CSS,选择器',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(566,2,0,0,'0','0','HTML 中用于插入图片的标签是？','[{\"code\":\"A\",\"value\":\"<img>\"},{\"code\":\"B\",\"value\":\"<image>\"},{\"code\":\"C\",\"value\":\"<pic>\"},{\"code\":\"D\",\"value\":\"<figure>\"}]',0,0,'正确选项：A','HTML,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(567,5,0,0,'0','1','Vue 中用于数据双向绑定的指令是？','[{\"code\":\"A\",\"value\":\"v-model\"},{\"code\":\"B\",\"value\":\"v-bind\"},{\"code\":\"C\",\"value\":\"v-on\"},{\"code\":\"D\",\"value\":\"v-if\"}]',0,0,'正确选项：A','Vue,指令',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(568,4,0,0,'0','1','在 React 函数组件中管理本地状态的 Hook 是？','[{\"code\":\"A\",\"value\":\"useState\"},{\"code\":\"B\",\"value\":\"useEffect\"},{\"code\":\"C\",\"value\":\"useContext\"},{\"code\":\"D\",\"value\":\"useMemo\"}]',0,0,'正确选项：A','React,Hook',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(569,8,0,1,'0','1','TypeScript 中定义接口使用的关键字是？','[{\"code\":\"A\",\"value\":\"interface\"},{\"code\":\"B\",\"value\":\"type\"},{\"code\":\"C\",\"value\":\"class\"},{\"code\":\"D\",\"value\":\"enum\"}]',0,0,'正确选项：A','TypeScript,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(570,9,0,1,'0','0','将暂存区内容提交到本地仓库的 Git 命令是？','[{\"code\":\"A\",\"value\":\"git commit\"},{\"code\":\"B\",\"value\":\"git add\"},{\"code\":\"C\",\"value\":\"git push\"},{\"code\":\"D\",\"value\":\"git clone\"}]',0,0,'正确选项：A','Git,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(571,10,0,0,'0','0','HTTP 中表示请求成功的状态码是？','[{\"code\":\"A\",\"value\":\"200\"},{\"code\":\"B\",\"value\":\"301\"},{\"code\":\"C\",\"value\":\"404\"},{\"code\":\"D\",\"value\":\"500\"}]',0,0,'正确选项：A','HTTP,状态码',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(572,0,0,4,'1','1','以下哪些是 ES6 新增的特性？','[{\"code\":\"A\",\"value\":\"let/const\"},{\"code\":\"B\",\"value\":\"箭头函数\"},{\"code\":\"C\",\"value\":\"模板字符串\"},{\"code\":\"D\",\"value\":\"Promise\"}]',0,0,'正确选项：ABCD','JavaScript,ES6',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(573,5,0,1,'1','1','以下哪些属于 Vue 的生命周期钩子？','[{\"code\":\"A\",\"value\":\"mounted\"},{\"code\":\"B\",\"value\":\"created\"},{\"code\":\"C\",\"value\":\"beforeUpdate\"},{\"code\":\"D\",\"value\":\"beforeDestroy\"}]',0,0,'正确选项：ABCD','Vue,生命周期',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(574,10,0,1,'1','1','以下哪些是常见的 HTTP 请求方法？','[{\"code\":\"A\",\"value\":\"GET\"},{\"code\":\"B\",\"value\":\"POST\"},{\"code\":\"C\",\"value\":\"PUT\"},{\"code\":\"D\",\"value\":\"DELETE\"}]',0,0,'正确选项：ABCD','HTTP,方法',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(575,9,0,0,'1','1','以下哪些是 Git 的常用命令？','[{\"code\":\"A\",\"value\":\"clone\"},{\"code\":\"B\",\"value\":\"branch\"},{\"code\":\"C\",\"value\":\"merge\"},{\"code\":\"D\",\"value\":\"status\"}]',0,0,'正确选项：ABCD','Git,命令',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(576,11,0,0,'1','1','以下哪些可以用作浏览器的本地存储？','[{\"code\":\"A\",\"value\":\"localStorage\"},{\"code\":\"B\",\"value\":\"sessionStorage\"},{\"code\":\"C\",\"value\":\"Cookie\"},{\"code\":\"D\",\"value\":\"IndexedDB\"}]',0,0,'正确选项：ABCD','浏览器,存储',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(577,8,0,1,'1','2','以下哪些是 TypeScript 支持的类型标注？','[{\"code\":\"A\",\"value\":\"string\"},{\"code\":\"B\",\"value\":\"number\"},{\"code\":\"C\",\"value\":\"boolean\"},{\"code\":\"D\",\"value\":\"any\"}]',0,0,'正确选项：ABCD','TypeScript,类型',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(578,0,0,2,'2','0','JavaScript 中 === 会进行严格类型比较。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','JavaScript,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(579,0,0,1,'2','1','JavaScript 中 == 和 === 的行为完全一致。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','JavaScript,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(580,1,0,0,'2','0','CSS 中 id 选择器的优先级高于 class 选择器。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','CSS,选择器',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(581,2,0,0,'2','0','HTML 中 div 是块级元素。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTML,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(582,5,0,0,'2','1','Vue 中 v-if 和 v-show 都会销毁并重建 DOM 元素。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','Vue,指令',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(583,10,0,0,'2','0','HTTPS 是在 HTTP 基础上加入了 TLS/SSL 加密。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTTP,安全',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(584,9,0,0,'2','0','git pull 等价于 git fetch 加 git merge。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Git,命令',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(585,6,0,1,'2','1','Node.js 采用单线程事件驱动模型。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Node,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(586,0,0,2,'3','1','请简述 var、let、const 的区别。','',0,0,'var 存在变量提升且可重复声明；let 具有块级作用域且不可重复声明；const 声明常量，值不可重新赋值，同样具有块级作用域。','JavaScript,基础',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(587,1,0,0,'3','1','请简述标准盒模型由哪些部分组成。','',0,0,'标准盒模型由 content（内容）、padding（内边距）、border（边框）、margin（外边距）四部分组成。','CSS,盒模型',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(588,5,0,0,'3','2','请列举 Vue 组件间通信的常用方式。','',0,0,'常用方式包括：父传子用 props、子传父用 emit、跨层级用 provide/inject、全局状态用 Vuex 或 Pinia、以及事件总线或 ref 访问组件实例。','Vue,通信',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(589,10,0,1,'3','1','请简述 GET 和 POST 请求的主要区别。','',0,0,'GET 参数拼接在 URL 中、可被缓存且通常幂等，适合查询；POST 参数放在请求体中、适合提交数据，一般不幂等且相对更安全。','HTTP,方法',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(590,4,0,0,'3','2','请简述受控组件与非受控组件的区别。','',0,0,'受控组件的表单值由 React state 控制并通过 onChange 更新；非受控组件不维护 state，直接通过 ref 读取 DOM 中的值。','React,表单',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(591,9,0,0,'3','1','请简述 git merge 与 git rebase 的区别。','',0,0,'merge 会保留分支历史并产生一个合并提交；rebase 会把当前分支的提交重放到目标分支之上，使历史更线性整洁。','Git,分支',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(592,11,0,2,'3','1','请简述从输入 URL 到页面显示经历了哪些主要步骤。','',0,0,'主要包括：DNS 解析域名、建立 TCP 连接、发送 HTTP 请求、服务器返回响应、浏览器解析 HTML/CSS/JS 并渲染页面。','浏览器,原理',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(593,6,0,0,'3','2','请简述 Node.js 事件循环的作用。','',0,0,'事件循环用于调度异步回调和非阻塞 IO，通过不断循环处理宏任务与微任务，保证单线程下的高并发能力。','Node,事件循环',1,NULL,'admin','2026-08-15 23:50:37',0,NULL,NULL),
(594,3,0,0,'0','0','Angular 中实现双向数据绑定的语法是？','[{\"code\":\"A\",\"value\":\"[(ngModel)]\"},{\"code\":\"B\",\"value\":\"(ngModel)\"},{\"code\":\"C\",\"value\":\"[ngModel]\"},{\"code\":\"D\",\"value\":\"#ngModel\"}]',0,0,'正确选项：A','Angular,指令',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(595,3,0,0,'2','0','Angular 中 *ngIf 指令用于根据条件渲染元素。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Angular,指令',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(596,3,0,0,'3','1','请简述 Angular 中组件、模块与服务的关系。','',0,0,'组件负责视图与交互；模块（NgModule）用于组织和声明组件、指令、服务等；服务（@Injectable）封装可复用的业务逻辑，通过依赖注入提供给组件使用。','Angular,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(597,7,0,0,'0','0','Webpack 中用于处理 CSS 文件的 loader 是？','[{\"code\":\"A\",\"value\":\"css-loader\"},{\"code\":\"B\",\"value\":\"babel-loader\"},{\"code\":\"C\",\"value\":\"file-loader\"},{\"code\":\"D\",\"value\":\"url-loader\"}]',0,0,'正确选项：A','Webpack,loader',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(598,7,0,0,'0','1','Webpack 配置中用于指定入口文件的字段是？','[{\"code\":\"A\",\"value\":\"entry\"},{\"code\":\"B\",\"value\":\"output\"},{\"code\":\"C\",\"value\":\"module\"},{\"code\":\"D\",\"value\":\"plugins\"}]',0,0,'正确选项：A','Webpack,配置',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(599,7,0,0,'2','0','Webpack 的 mode 支持 development 和 production 两种模式。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Webpack,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(600,7,0,0,'3','1','请简述 Webpack 中 loader 与 plugin 的区别。','',0,0,'loader 用于转换单个模块的源码（如编译 CSS、JS），在打包过程中对文件进行预处理；plugin 作用于整个构建生命周期，通过钩子扩展打包、优化、产物处理等能力。','Webpack,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(601,7,0,0,'1','1','以下哪些是常见的前端构建工具？','[{\"code\":\"A\",\"value\":\"Webpack\"},{\"code\":\"B\",\"value\":\"Vite\"},{\"code\":\"C\",\"value\":\"Rollup\"},{\"code\":\"D\",\"value\":\"Parcel\"}]',0,0,'正确选项：ABCD','Webpack,构建工具',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(602,11,0,0,'0','0','以下哪个不是浏览器渲染引擎？','[{\"code\":\"A\",\"value\":\"Blink\"},{\"code\":\"B\",\"value\":\"Gecko\"},{\"code\":\"C\",\"value\":\"WebKit\"},{\"code\":\"D\",\"value\":\"Node.js\"}]',0,0,'正确选项：D','浏览器,渲染引擎',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(603,11,0,0,'2','0','localStorage 中的数据在浏览器关闭后仍会保留。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','浏览器,存储',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(604,11,0,0,'3','2','请简述浏览器重排（reflow）与重绘（repaint）的区别。','',0,0,'重排是元素的几何属性（尺寸、位置）改变导致重新计算布局，开销较大；重绘是外观样式（颜色、背景）改变但不影响布局，只需重新绘制像素，开销较小。','浏览器,性能',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(605,11,0,0,'1','1','浏览器同源策略由哪些部分构成？','[{\"code\":\"A\",\"value\":\"协议\"},{\"code\":\"B\",\"value\":\"域名\"},{\"code\":\"C\",\"value\":\"端口\"},{\"code\":\"D\",\"value\":\"路径\"}]',0,0,'正确选项：ABC','浏览器,同源策略',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(606,10,0,0,'0','1','HTTP 响应头中用于缓存控制的是？','[{\"code\":\"A\",\"value\":\"Cache-Control\"},{\"code\":\"B\",\"value\":\"Content-Type\"},{\"code\":\"C\",\"value\":\"Accept\"},{\"code\":\"D\",\"value\":\"Cookie\"}]',0,0,'正确选项：A','HTTP,缓存',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(607,10,0,0,'2','0','状态码 404 表示请求的资源未找到。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTTP,状态码',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(608,10,0,1,'3','1','请简述 HTTP/2 相比 HTTP/1.1 的主要改进。','',0,0,'HTTP/2 支持二进制分帧、头部压缩（HPACK）、多路复用、服务器推送，减少了队头阻塞并提升传输效率。','HTTP,协议',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(609,10,0,0,'1','0','以下哪些是 HTTP 常见的请求头？','[{\"code\":\"A\",\"value\":\"User-Agent\"},{\"code\":\"B\",\"value\":\"Content-Type\"},{\"code\":\"C\",\"value\":\"Accept\"},{\"code\":\"D\",\"value\":\"Authorization\"}]',0,0,'正确选项：ABCD','HTTP,请求头',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(610,6,0,0,'0','0','Node.js 中用于读写文件的模块是？','[{\"code\":\"A\",\"value\":\"fs\"},{\"code\":\"B\",\"value\":\"http\"},{\"code\":\"C\",\"value\":\"path\"},{\"code\":\"D\",\"value\":\"os\"}]',0,0,'正确选项：A','Node,fs',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(611,6,0,0,'2','0','Node.js 使用 CommonJS 模块规范，require 用于引入模块。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Node,模块',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(612,6,0,0,'3','1','请简述 Node.js 中 require 查找模块的规则。','',0,0,'require 会先判断是否为内置模块或相对/绝对路径，再依次在 node_modules 目录中逐级向上查找模块的 package.json main 字段或 index 文件。','Node,模块',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(613,1,0,1,'0','0','下列哪个属性可以让元素采用弹性布局？','[{\"code\":\"A\",\"value\":\"display:flex\"},{\"code\":\"B\",\"value\":\"display:block\"},{\"code\":\"C\",\"value\":\"position:flex\"},{\"code\":\"D\",\"value\":\"float:flex\"}]',0,0,'正确选项：A','CSS,布局',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(614,1,0,0,'2','1','CSS 中 em 是相对单位，1em 相对于父元素的 font-size。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','CSS,单位',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(615,0,0,1,'0','0','判断一个值是否为 NaN 应使用哪个函数？','[{\"code\":\"A\",\"value\":\"isNaN\"},{\"code\":\"B\",\"value\":\"isNull\"},{\"code\":\"C\",\"value\":\"isUndefined\"},{\"code\":\"D\",\"value\":\"isString\"}]',0,0,'正确选项：A','JavaScript,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(616,0,0,1,'2','1','JavaScript 中 typeof null 的结果是 object。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','JavaScript,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(617,2,0,0,'0','0','HTML5 中用于定义页眉区域的语义化标签是？','[{\"code\":\"A\",\"value\":\"<header>\"},{\"code\":\"B\",\"value\":\"<head>\"},{\"code\":\"C\",\"value\":\"<top>\"},{\"code\":\"D\",\"value\":\"<title>\"}]',0,0,'正确选项：A','HTML,语义化',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(618,2,0,0,'2','0','input 的 type=email 在表单提交时会做基础的邮箱格式校验。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTML,表单',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(619,5,0,0,'0','1','Vue 3 中用于创建响应式对象的 API 是？','[{\"code\":\"A\",\"value\":\"reactive\"},{\"code\":\"B\",\"value\":\"computed\"},{\"code\":\"C\",\"value\":\"watch\"},{\"code\":\"D\",\"value\":\"nextTick\"}]',0,0,'正确选项：A','Vue,响应式',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(620,5,0,0,'2','0','Vue 3 使用 Proxy 实现响应式系统。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Vue,响应式',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(621,4,0,0,'0','0','React 中父组件向子组件传递数据通常使用？','[{\"code\":\"A\",\"value\":\"props\"},{\"code\":\"B\",\"value\":\"state\"},{\"code\":\"C\",\"value\":\"refs\"},{\"code\":\"D\",\"value\":\"context\"}]',0,0,'正确选项：A','React,props',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(622,4,0,0,'2','0','React 列表渲染中 key 属性用于帮助 diff 算法识别元素变化。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','React,key',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(623,8,0,0,'0','1','TypeScript 中定义一个可选属性的写法是？','[{\"code\":\"A\",\"value\":\"name?: string\"},{\"code\":\"B\",\"value\":\"name!: string\"},{\"code\":\"C\",\"value\":\"name = string\"},{\"code\":\"D\",\"value\":\"name string\"}]',0,0,'正确选项：A','TypeScript,类型',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(624,8,0,0,'2','0','TypeScript 最终会被编译成 JavaScript 才能运行。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','TypeScript,基础',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(625,9,0,0,'0','0','查看 Git 提交历史的命令是？','[{\"code\":\"A\",\"value\":\"git log\"},{\"code\":\"B\",\"value\":\"git status\"},{\"code\":\"C\",\"value\":\"git diff\"},{\"code\":\"D\",\"value\":\"git branch\"}]',0,0,'正确选项：A','Git,命令',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(626,9,0,0,'2','0','git branch 命令可以查看或创建分支。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Git,分支',1,NULL,'admin','2026-08-16 00:14:35',0,NULL,NULL),
(627,0,0,0,'0','1','数组方法中，用于删除并返回最后一个元素的是？','[{\"code\":\"A\",\"value\":\"pop\"},{\"code\":\"B\",\"value\":\"push\"},{\"code\":\"C\",\"value\":\"shift\"},{\"code\":\"D\",\"value\":\"unshift\"}]',0,0,'正确选项：A','JavaScript,数组',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(628,0,0,0,'0','1','以下哪个方法可以把 JSON 字符串解析为 JavaScript 对象？','[{\"code\":\"A\",\"value\":\"JSON.parse\"},{\"code\":\"B\",\"value\":\"JSON.stringify\"},{\"code\":\"C\",\"value\":\"eval\"},{\"code\":\"D\",\"value\":\"parseInt\"}]',0,0,'正确选项：A','JavaScript,JSON',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(629,0,0,0,'0','0','JavaScript 中表示「未定义」的值是？','[{\"code\":\"A\",\"value\":\"null\"},{\"code\":\"B\",\"value\":\"undefined\"},{\"code\":\"C\",\"value\":\"NaN\"},{\"code\":\"D\",\"value\":\"void\"}]',0,0,'正确选项：B','JavaScript,基础',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(630,1,0,0,'0','1','使元素相对于自身原始位置进行偏移的定位方式是？','[{\"code\":\"A\",\"value\":\"relative\"},{\"code\":\"B\",\"value\":\"absolute\"},{\"code\":\"C\",\"value\":\"fixed\"},{\"code\":\"D\",\"value\":\"static\"}]',0,0,'正确选项：A','CSS,定位',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(631,1,0,0,'0','0','实现块级元素水平居中的常见写法是？','[{\"code\":\"A\",\"value\":\"margin: 0 auto\"},{\"code\":\"B\",\"value\":\"padding: 0 auto\"},{\"code\":\"C\",\"value\":\"margin: auto 0\"},{\"code\":\"D\",\"value\":\"text-align: center\"}]',0,0,'正确选项：A','CSS,布局',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(632,2,0,0,'0','0','HTML 中用于定义无序列表的标签是？','[{\"code\":\"A\",\"value\":\"<ul>\"},{\"code\":\"B\",\"value\":\"<ol>\"},{\"code\":\"C\",\"value\":\"<dl>\"},{\"code\":\"D\",\"value\":\"<li>\"}]',0,0,'正确选项：A','HTML,标签',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(633,2,0,0,'0','1','HTML 中用于在 head 内引入外部 CSS 文件的标签是？','[{\"code\":\"A\",\"value\":\"<link>\"},{\"code\":\"B\",\"value\":\"<script>\"},{\"code\":\"C\",\"value\":\"<style>\"},{\"code\":\"D\",\"value\":\"<import>\"}]',0,0,'正确选项：A','HTML,标签',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(634,5,0,0,'0','0','Vue 中用于条件渲染的指令是？','[{\"code\":\"A\",\"value\":\"v-if\"},{\"code\":\"B\",\"value\":\"v-for\"},{\"code\":\"C\",\"value\":\"v-model\"},{\"code\":\"D\",\"value\":\"v-bind\"}]',0,0,'正确选项：A','Vue,指令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(635,5,0,0,'0','1','Vue 中用于定义计算属性的配置项是？','[{\"code\":\"A\",\"value\":\"computed\"},{\"code\":\"B\",\"value\":\"watch\"},{\"code\":\"C\",\"value\":\"methods\"},{\"code\":\"D\",\"value\":\"props\"}]',0,0,'正确选项：A','Vue,选项',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(636,4,0,0,'0','1','React 函数组件中用于管理状态的是？','[{\"code\":\"A\",\"value\":\"useState\"},{\"code\":\"B\",\"value\":\"useEffect\"},{\"code\":\"C\",\"value\":\"useRef\"},{\"code\":\"D\",\"value\":\"useContext\"}]',0,0,'正确选项：A','React,Hooks',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(637,4,0,0,'0','0','React 中用于描述 UI 结构的语法是？','[{\"code\":\"A\",\"value\":\"JSX\"},{\"code\":\"B\",\"value\":\"XML\"},{\"code\":\"C\",\"value\":\"HTML\"},{\"code\":\"D\",\"value\":\"TSX\"}]',0,0,'正确选项：A','React,JSX',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(638,6,0,0,'0','0','Node.js 中用于创建 HTTP 服务器的模块是？','[{\"code\":\"A\",\"value\":\"http\"},{\"code\":\"B\",\"value\":\"fs\"},{\"code\":\"C\",\"value\":\"net\"},{\"code\":\"D\",\"value\":\"dns\"}]',0,0,'正确选项：A','Node,模块',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(639,9,0,0,'0','0','Git 中创建并切换到新分支的命令是？','[{\"code\":\"A\",\"value\":\"git checkout -b\"},{\"code\":\"B\",\"value\":\"git branch\"},{\"code\":\"C\",\"value\":\"git switch -d\"},{\"code\":\"D\",\"value\":\"git new\"}]',0,0,'正确选项：A','Git,分支',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(640,9,0,0,'0','1','Git 中用于查看提交历史的命令是？','[{\"code\":\"A\",\"value\":\"git log\"},{\"code\":\"B\",\"value\":\"git status\"},{\"code\":\"C\",\"value\":\"git diff\"},{\"code\":\"D\",\"value\":\"git show\"}]',0,0,'正确选项：A','Git,命令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(641,10,0,0,'0','0','HTTP 状态码 500 表示？','[{\"code\":\"A\",\"value\":\"服务器内部错误\"},{\"code\":\"B\",\"value\":\"资源未找到\"},{\"code\":\"C\",\"value\":\"请求成功\"},{\"code\":\"D\",\"value\":\"重定向\"}]',0,0,'正确选项：A','HTTP,状态码',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(642,10,0,0,'0','1','HTTP 响应头中用于协商缓存的是？','[{\"code\":\"A\",\"value\":\"ETag\"},{\"code\":\"B\",\"value\":\"Cookie\"},{\"code\":\"C\",\"value\":\"Host\"},{\"code\":\"D\",\"value\":\"Content-Type\"}]',0,0,'正确选项：A','HTTP,缓存',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(643,11,0,0,'0','0','浏览器中主要负责解析 HTML 与 CSS 的是？','[{\"code\":\"A\",\"value\":\"渲染引擎\"},{\"code\":\"B\",\"value\":\"JS 引擎\"},{\"code\":\"C\",\"value\":\"网络模块\"},{\"code\":\"D\",\"value\":\"存储模块\"}]',0,0,'正确选项：A','浏览器,渲染',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(644,8,0,0,'0','1','TypeScript 中用于把 .ts 编译为 .js 的命令是？','[{\"code\":\"A\",\"value\":\"tsc\"},{\"code\":\"B\",\"value\":\"ts-node\"},{\"code\":\"C\",\"value\":\"node\"},{\"code\":\"D\",\"value\":\"npm run\"}]',0,0,'正确选项：A','TypeScript,编译',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(645,7,0,0,'0','1','Webpack 配置中用于指定入口文件的字段是？','[{\"code\":\"A\",\"value\":\"entry\"},{\"code\":\"B\",\"value\":\"output\"},{\"code\":\"C\",\"value\":\"module\"},{\"code\":\"D\",\"value\":\"plugins\"}]',0,0,'正确选项：A','Webpack,配置',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(646,0,0,0,'1','1','以下哪些是 JavaScript 数组的常用方法？','[{\"code\":\"A\",\"value\":\"map\"},{\"code\":\"B\",\"value\":\"filter\"},{\"code\":\"C\",\"value\":\"reduce\"},{\"code\":\"D\",\"value\":\"concat\"}]',0,0,'正确选项：ABCD','JavaScript,数组',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(647,0,0,1,'1','1','以下哪些属于 JavaScript 的引用类型？','[{\"code\":\"A\",\"value\":\"Object\"},{\"code\":\"B\",\"value\":\"Array\"},{\"code\":\"C\",\"value\":\"Function\"},{\"code\":\"D\",\"value\":\"Number\"}]',0,0,'正确选项：ABC','JavaScript,类型',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(648,5,0,0,'1','1','以下哪些是 Vue 的常用指令？','[{\"code\":\"A\",\"value\":\"v-if\"},{\"code\":\"B\",\"value\":\"v-for\"},{\"code\":\"C\",\"value\":\"v-model\"},{\"code\":\"D\",\"value\":\"v-bind\"}]',0,0,'正确选项：ABCD','Vue,指令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(649,5,0,0,'1','1','以下哪些属于 Vue Router 的常用组成？','[{\"code\":\"A\",\"value\":\"router-link\"},{\"code\":\"B\",\"value\":\"router-view\"},{\"code\":\"C\",\"value\":\"$router.push\"},{\"code\":\"D\",\"value\":\"$route.query\"}]',0,0,'正确选项：ABCD','Vue,路由',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(650,10,0,0,'1','0','以下哪些是 HTTP 3xx 重定向状态码？','[{\"code\":\"A\",\"value\":\"301\"},{\"code\":\"B\",\"value\":\"302\"},{\"code\":\"C\",\"value\":\"304\"},{\"code\":\"D\",\"value\":\"404\"}]',0,0,'正确选项：ABC','HTTP,状态码',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(651,9,0,0,'1','1','以下哪些是 Git 的常用命令？','[{\"code\":\"A\",\"value\":\"git add\"},{\"code\":\"B\",\"value\":\"git commit\"},{\"code\":\"C\",\"value\":\"git push\"},{\"code\":\"D\",\"value\":\"git pull\"}]',0,0,'正确选项：ABCD','Git,命令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(652,11,0,0,'1','0','以下哪些属于浏览器提供的 Web 存储？','[{\"code\":\"A\",\"value\":\"localStorage\"},{\"code\":\"B\",\"value\":\"sessionStorage\"},{\"code\":\"C\",\"value\":\"Cookie\"},{\"code\":\"D\",\"value\":\"IndexedDB\"}]',0,0,'正确选项：ABCD','浏览器,存储',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(653,8,0,0,'1','1','以下哪些是 TypeScript 的基础类型？','[{\"code\":\"A\",\"value\":\"string\"},{\"code\":\"B\",\"value\":\"number\"},{\"code\":\"C\",\"value\":\"boolean\"},{\"code\":\"D\",\"value\":\"any\"}]',0,0,'正确选项：ABCD','TypeScript,类型',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(654,0,0,1,'2','0','JavaScript 中 const 声明的变量不可以重新赋值。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','JavaScript,基础',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(655,0,0,0,'2','0','JavaScript 中 null 与 undefined 的数据类型相同。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','JavaScript,类型',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(656,1,0,0,'2','0','CSS 中 display: none 的元素不会占据页面空间。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','CSS,布局',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(657,1,0,0,'2','1','CSS 中 position: absolute 的定位参照物一定是浏览器窗口。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','CSS,定位',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(658,2,0,0,'2','0','HTML 中 <img> 标签是自闭合标签。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTML,标签',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(659,5,0,0,'2','0','Vue 中 v-if 与 v-show 都能控制元素的显示与隐藏。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Vue,指令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(660,4,0,0,'2','1','React 中 state 可以直接通过赋值方式修改。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','React,state',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(661,6,0,0,'2','0','Node.js 采用单线程事件驱动模型。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Node,基础',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(662,10,0,0,'2','0','HTTP 是一种无状态协议。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','HTTP,基础',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(663,9,0,0,'2','0','Git 中 git add 命令用于将文件加入暂存区。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','Git,命令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(664,11,0,0,'2','1','localStorage 中存储的数据会随浏览器关闭而永久删除。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'错误','浏览器,存储',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(665,8,0,0,'2','0','TypeScript 是 JavaScript 的超集。','[{\"code\":\"正确\",\"value\":\"\"},{\"code\":\"错误\",\"value\":\"\"}]',0,0,'正确','TypeScript,基础',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(666,0,0,2,'3','1','请简述深拷贝与浅拷贝的区别。','',0,0,'浅拷贝只复制对象的第一层属性，内部嵌套对象仍与原对象共享引用；深拷贝会递归复制所有层级，生成完全独立的新对象。','JavaScript,对象',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(667,0,0,0,'3','1','请简述事件冒泡与事件捕获的区别。','',0,0,'事件捕获由外向内触发，事件冒泡由内向外触发；addEventListener 第三个参数为 true 时在捕获阶段触发，为 false 时在冒泡阶段触发。','JavaScript,事件',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(668,1,0,0,'3','1','请简述标准盒模型与 IE 盒模型的区别。','',0,0,'标准盒模型的 width/height 只包含 content；IE 盒模型的 width/height 包含 content、padding 和 border。','CSS,盒模型',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(669,5,0,0,'3','2','请简述 Vue 中 v-if 与 v-show 的区别。','',0,0,'v-if 是条件渲染，切换时会销毁并重建 DOM；v-show 通过 display 控制显隐，元素始终存在于 DOM 中，适合频繁切换。','Vue,指令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(670,4,0,0,'3','2','请简述 React 中 useState 的作用。','',0,0,'useState 用于在函数组件中声明状态，返回当前状态值与更新函数，调用更新函数会触发组件重新渲染。','React,Hooks',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(671,6,0,0,'3','1','请简述 Node.js 中 require 与 import 的区别。','',0,0,'require 是 CommonJS 规范，运行时同步加载；import 是 ES Module 规范，编译时静态解析，支持 tree-shaking。','Node,模块',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(672,9,0,0,'3','1','请简述 git fetch 与 git pull 的区别。','',0,0,'git fetch 只从远程仓库下载更新到本地，不合并；git pull 等价于 fetch 加 merge，会直接合并到当前分支。','Git,命令',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(673,10,0,0,'3','1','请简述 HTTP 与 HTTPS 的区别。','',0,0,'HTTPS 在 HTTP 与 TCP 之间增加 SSL/TLS 加密层，通过证书验证身份并对数据加密，默认端口 443；HTTP 为明文传输，默认端口 80。','HTTP,安全',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(674,11,0,0,'3','1','请简述浏览器事件循环 Event Loop 的机制。','',0,0,'主线程同步执行任务，异步任务完成后将回调放入任务队列；主线程空闲时依次取出宏任务执行，并在宏任务之间清空微任务队列。','浏览器,原理',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(675,8,0,0,'3','1','请简述 TypeScript 中 interface 与 type 的区别。','',0,0,'两者都能描述类型；interface 支持声明合并、更适合描述对象形状，type 支持联合类型、交叉类型等更丰富的类型别名。','TypeScript,类型',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(676,7,0,0,'3','1','请简述 Webpack 的基本打包流程。','',0,0,'从 entry 入口开始递归解析依赖，构建模块依赖图，通过 loader 转换各类资源，最终将模块打包成 bundle 输出文件。','Webpack,原理',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(677,2,0,0,'3','1','请简述 HTML 语义化标签的作用。','',0,0,'语义化标签能清晰描述内容结构，利于搜索引擎优化（SEO）、无障碍访问与代码的可维护性。','HTML,语义化',1,'审核通过','admin','2026-08-24 22:47:55',0,NULL,NULL),
(678,0,0,NULL,'0','1','你好啊','[{\"code\":\"A\",\"value\":\"撒地方\"},{\"code\":\"B\",\"value\":\"啊士大夫\"},{\"code\":\"E\",\"value\":\"阿斯蒂芬\"}]',NULL,1,'正确选项：A','三百',0,'牛逼','请问','2026-08-24 23:00:20',0,'2026-08-26 21:56:43','请问'),
(679,0,0,NULL,'0','1','1','[{\"code\":\"A\",\"value\":\"1\"},{\"code\":\"B\",\"value\":\"1\"},{\"code\":\"C\",\"value\":\"1\"},{\"code\":\"D\",\"value\":\"1\"}]',NULL,1,'正确选项：A','',0,'审核通过','小米','2026-08-26 22:18:28',0,'2026-08-26 22:29:55','小米');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sensitive_word`
--

DROP TABLE IF EXISTS `sensitive_word`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sensitive_word` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL COMMENT '违禁词',
  `level` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=直接拦截 2=待审核',
  `ctime` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`)
) ENGINE=InnoDB AUTO_INCREMENT=334 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sensitive_word`
--

LOCK TABLES `sensitive_word` WRITE;
/*!40000 ALTER TABLE `sensitive_word` DISABLE KEYS */;
INSERT INTO `sensitive_word` VALUES
(1,'傻逼',1,'2026-08-15 21:27:56',0),
(2,'煞笔',1,'2026-08-15 21:27:56',0),
(3,'傻叉',1,'2026-08-15 21:27:56',0),
(4,'脑残',1,'2026-08-15 21:27:56',0),
(5,'弱智',1,'2026-08-15 21:27:56',0),
(6,'白痴',1,'2026-08-15 21:27:56',0),
(7,'智障',1,'2026-08-15 21:27:56',0),
(8,'废物',1,'2026-08-15 21:27:56',0),
(9,'垃圾人',1,'2026-08-15 21:27:56',0),
(10,'贱人',1,'2026-08-15 21:27:56',0),
(11,'贱货',1,'2026-08-15 21:27:56',0),
(12,'混蛋',1,'2026-08-15 21:27:56',0),
(13,'王八蛋',1,'2026-08-15 21:27:56',0),
(14,'畜生',1,'2026-08-15 21:27:56',0),
(15,'狗东西',1,'2026-08-15 21:27:56',0),
(16,'妈的',1,'2026-08-15 21:27:56',0),
(17,'他妈',1,'2026-08-15 21:27:56',0),
(18,'你妈',1,'2026-08-15 21:27:56',0),
(19,'草泥马',1,'2026-08-15 21:27:56',0),
(20,'卧槽',1,'2026-08-15 21:27:56',0),
(21,'我操',1,'2026-08-15 21:27:56',0),
(22,'我靠',1,'2026-08-15 21:27:56',0),
(23,'滚蛋',1,'2026-08-15 21:27:56',0),
(24,'去死',1,'2026-08-15 21:27:56',0),
(25,'死全家',1,'2026-08-15 21:27:56',0),
(26,'色情',1,'2026-08-15 21:27:56',0),
(27,'裸聊',1,'2026-08-15 21:27:56',0),
(28,'约炮',1,'2026-08-15 21:27:56',0),
(29,'一夜情',1,'2026-08-15 21:27:56',0),
(30,'嫖娼',1,'2026-08-15 21:27:56',0),
(31,'卖淫',1,'2026-08-15 21:27:56',0),
(32,'黄色网站',1,'2026-08-15 21:27:56',0),
(33,'代刷',2,'2026-08-15 21:27:56',0),
(34,'刷单',2,'2026-08-15 21:27:56',0),
(35,'办证',2,'2026-08-15 21:27:56',1),
(36,'加微信',2,'2026-08-15 21:27:56',0),
(37,'加v',2,'2026-08-15 21:27:56',0),
(38,'兼职日结',2,'2026-08-15 21:27:56',0),
(40,'sb',1,'2026-08-15 21:37:01',0),
(41,'蠢货',1,'2026-08-16 18:49:28',0),
(42,'蠢猪',1,'2026-08-16 18:49:28',0),
(43,'猪头',1,'2026-08-16 18:49:28',0),
(44,'狗娘养的',1,'2026-08-16 18:49:28',0),
(45,'龟儿子',1,'2026-08-16 18:49:28',0),
(46,'龟孙子',1,'2026-08-16 18:49:28',0),
(47,'二百五',1,'2026-08-16 18:49:28',0),
(48,'傻蛋',1,'2026-08-16 18:49:28',0),
(49,'笨蛋',1,'2026-08-16 18:49:28',0),
(50,'蠢蛋',1,'2026-08-16 18:49:28',0),
(51,'狗日的',1,'2026-08-16 18:49:28',0),
(52,'日你妈',1,'2026-08-16 18:49:28',0),
(53,'操你妈',1,'2026-08-16 18:49:28',0),
(54,'妈卖批',1,'2026-08-16 18:49:28',0),
(55,'你妹',1,'2026-08-16 18:49:28',0),
(56,'他妈的',1,'2026-08-16 18:49:28',0),
(57,'奶奶的',1,'2026-08-16 18:49:28',0),
(58,'混账',1,'2026-08-16 18:49:28',0),
(59,'狗屁',1,'2026-08-16 18:49:28',0),
(60,'去你妈的',1,'2026-08-16 18:49:28',0),
(61,'傻屌',1,'2026-08-16 18:49:28',0),
(62,'二逼',1,'2026-08-16 18:49:28',0),
(63,'不要脸',1,'2026-08-16 18:49:28',0),
(64,'缺德',1,'2026-08-16 18:49:28',0),
(65,'人渣',1,'2026-08-16 18:49:28',0),
(66,'败类',1,'2026-08-16 18:49:28',0),
(67,'狗杂种',1,'2026-08-16 18:49:28',0),
(68,'杂种',1,'2026-08-16 18:49:28',0),
(69,'野种',1,'2026-08-16 18:49:28',0),
(70,'狗男女',1,'2026-08-16 18:49:28',0),
(71,'婊子',1,'2026-08-16 18:49:28',0),
(72,'傻吊',1,'2026-08-16 18:49:28',0),
(73,'黄片',1,'2026-08-16 18:49:28',0),
(74,'色情片',1,'2026-08-16 18:49:28',0),
(75,'成人视频',1,'2026-08-16 18:49:28',0),
(76,'成人电影',1,'2026-08-16 18:49:28',0),
(77,'淫秽',1,'2026-08-16 18:49:28',0),
(78,'淫荡',1,'2026-08-16 18:49:28',0),
(79,'做爱',1,'2026-08-16 18:49:28',0),
(80,'性交',1,'2026-08-16 18:49:28',0),
(81,'强奸',1,'2026-08-16 18:49:28',0),
(82,'轮奸',1,'2026-08-16 18:49:28',0),
(83,'迷奸',1,'2026-08-16 18:49:28',0),
(84,'偷拍',1,'2026-08-16 18:49:28',0),
(85,'裸体',1,'2026-08-16 18:49:28',0),
(86,'露点',1,'2026-08-16 18:49:28',0),
(87,'三级片',1,'2026-08-16 18:49:28',0),
(88,'黄网',1,'2026-08-16 18:49:28',0),
(89,'色情网站',1,'2026-08-16 18:49:28',0),
(90,'激情视频',1,'2026-08-16 18:49:28',0),
(91,'自慰',1,'2026-08-16 18:49:28',0),
(92,'手淫',1,'2026-08-16 18:49:28',0),
(93,'性爱',1,'2026-08-16 18:49:28',0),
(94,'鸡巴',1,'2026-08-16 18:49:28',0),
(95,'屌',1,'2026-08-16 18:49:28',0),
(96,'毒品',1,'2026-08-16 18:49:28',0),
(97,'贩毒',1,'2026-08-16 18:49:28',0),
(98,'吸毒',1,'2026-08-16 18:49:28',0),
(99,'枪支',1,'2026-08-16 18:49:28',0),
(100,'买枪',1,'2026-08-16 18:49:28',0),
(101,'卖枪',1,'2026-08-16 18:49:28',0),
(102,'赌博',1,'2026-08-16 18:49:28',0),
(103,'赌场',1,'2026-08-16 18:49:28',0),
(104,'洗钱',1,'2026-08-16 18:49:28',0),
(105,'传销',1,'2026-08-16 18:49:28',0),
(106,'诈骗',1,'2026-08-16 18:49:28',0),
(107,'高利贷',1,'2026-08-16 18:49:28',0),
(108,'杀人',1,'2026-08-16 18:49:28',0),
(109,'买凶',1,'2026-08-16 18:49:28',0),
(110,'邪教',1,'2026-08-16 18:49:28',0),
(111,'法轮功',1,'2026-08-16 18:49:28',0),
(112,'反共',1,'2026-08-16 18:49:28',0),
(113,'反华',1,'2026-08-16 18:49:28',0),
(114,'台独',1,'2026-08-16 18:49:28',0),
(115,'藏独',1,'2026-08-16 18:49:28',0),
(116,'疆独',1,'2026-08-16 18:49:28',0),
(117,'港独',1,'2026-08-16 18:49:28',0),
(118,'加qq',2,'2026-08-16 18:49:28',0),
(119,'微信',2,'2026-08-16 18:49:28',0),
(120,'手机号',2,'2026-08-16 18:49:28',0),
(121,'联系方式',2,'2026-08-16 18:49:28',0),
(122,'点击链接',2,'2026-08-16 18:49:28',0),
(123,'优惠券',2,'2026-08-16 18:49:28',0),
(124,'领红包',2,'2026-08-16 18:49:28',0),
(125,'免费领取',2,'2026-08-16 18:49:28',0),
(126,'兼职',2,'2026-08-16 18:49:28',0),
(127,'招聘',2,'2026-08-16 18:49:28',0),
(128,'高薪',2,'2026-08-16 18:49:28',0),
(129,'日结',2,'2026-08-16 18:49:28',0),
(130,'贷款',2,'2026-08-16 18:49:28',0),
(131,'借贷',2,'2026-08-16 18:49:28',0),
(132,'套现',2,'2026-08-16 18:49:28',0),
(133,'代购',2,'2026-08-16 18:49:28',0),
(134,'代考',2,'2026-08-16 18:49:28',0),
(135,'代写',2,'2026-08-16 18:49:28',0),
(136,'论文代写',2,'2026-08-16 18:49:28',0),
(137,'报名咨询',2,'2026-08-16 18:49:28',0),
(138,'私聊',2,'2026-08-16 18:49:28',0),
(139,'加好友',2,'2026-08-16 18:49:28',0),
(140,'加群',2,'2026-08-16 18:49:28',0),
(141,'进群',2,'2026-08-16 18:49:28',0),
(142,'群号',2,'2026-08-16 18:49:28',0),
(143,'公众号',2,'2026-08-16 18:49:28',0),
(144,'引流',2,'2026-08-16 18:49:28',0),
(145,'带货',2,'2026-08-16 18:49:28',0),
(146,'刷赞',2,'2026-08-16 18:49:28',0),
(147,'刷粉',2,'2026-08-16 18:49:28',0),
(148,'刷量',2,'2026-08-16 18:49:28',0),
(149,'涨粉',2,'2026-08-16 18:49:28',0),
(150,'美女上门',2,'2026-08-16 18:49:28',0),
(151,'包夜',2,'2026-08-16 18:49:28',0),
(152,'死鬼',1,'2026-08-16 18:53:03',0),
(153,'死猪',1,'2026-08-16 18:53:03',0),
(154,'肥猪',1,'2026-08-16 18:53:03',0),
(155,'丑八怪',1,'2026-08-16 18:53:03',0),
(156,'烂货',1,'2026-08-16 18:53:03',0),
(157,'破鞋',1,'2026-08-16 18:53:03',0),
(158,'骚货',1,'2026-08-16 18:53:03',0),
(159,'骚逼',1,'2026-08-16 18:53:03',0),
(160,'贱逼',1,'2026-08-16 18:53:03',0),
(161,'死逼',1,'2026-08-16 18:53:03',0),
(162,'妈逼',1,'2026-08-16 18:53:03',0),
(163,'下贱',1,'2026-08-16 18:53:03',0),
(164,'下三滥',1,'2026-08-16 18:53:03',0),
(165,'狗腿子',1,'2026-08-16 18:53:03',0),
(166,'走狗',1,'2026-08-16 18:53:03',0),
(167,'汉奸',1,'2026-08-16 18:53:03',0),
(168,'卖国贼',1,'2026-08-16 18:53:03',0),
(169,'王八',1,'2026-08-16 18:53:03',0),
(170,'泼妇',1,'2026-08-16 18:53:03',0),
(171,'神经病',1,'2026-08-16 18:53:03',0),
(172,'脑瘫',1,'2026-08-16 18:53:03',0),
(173,'疯狗',1,'2026-08-16 18:53:03',0),
(174,'疯婆子',1,'2026-08-16 18:53:03',0),
(175,'狗屎',1,'2026-08-16 18:53:03',0),
(176,'禽兽不如',1,'2026-08-16 18:53:03',0),
(177,'猪狗不如',1,'2026-08-16 18:53:03',0),
(178,'牲口',1,'2026-08-16 18:53:03',0),
(179,'娘炮',1,'2026-08-16 18:53:03',0),
(180,'二货',1,'2026-08-16 18:53:03',0),
(181,'半吊子',1,'2026-08-16 18:53:03',0),
(182,'废物点心',1,'2026-08-16 18:53:03',0),
(183,'破烂货',1,'2026-08-16 18:53:03',0),
(184,'鸡婆',1,'2026-08-16 18:53:03',0),
(185,'老鸨',1,'2026-08-16 18:53:03',0),
(186,'妓女',1,'2026-08-16 18:53:03',0),
(187,'嫖客',1,'2026-08-16 18:53:03',0),
(188,'卖身',1,'2026-08-16 18:53:03',0),
(189,'援交',1,'2026-08-16 18:53:03',0),
(190,'大保健',1,'2026-08-16 18:53:03',0),
(191,'打飞机',1,'2026-08-16 18:53:03',0),
(192,'口交',1,'2026-08-16 18:53:03',0),
(193,'肛交',1,'2026-08-16 18:53:03',0),
(194,'群交',1,'2026-08-16 18:53:03',0),
(195,'乱伦',1,'2026-08-16 18:53:03',0),
(196,'兽交',1,'2026-08-16 18:53:03',0),
(197,'约p',1,'2026-08-16 18:53:03',0),
(198,'假钞',1,'2026-08-16 18:53:03',0),
(199,'假币',1,'2026-08-16 18:53:03',0),
(200,'走私',1,'2026-08-16 18:53:03',0),
(201,'偷渡',1,'2026-08-16 18:53:03',0),
(202,'拐卖',1,'2026-08-16 18:53:03',0),
(203,'人贩子',1,'2026-08-16 18:53:03',0),
(204,'绑架',1,'2026-08-16 18:53:03',0),
(205,'勒索',1,'2026-08-16 18:53:03',0),
(206,'敲诈',1,'2026-08-16 18:53:03',0),
(207,'抢劫',1,'2026-08-16 18:53:03',0),
(208,'盗窃',1,'2026-08-16 18:53:03',0),
(209,'冰毒',1,'2026-08-16 18:53:03',0),
(210,'海洛因',1,'2026-08-16 18:53:03',0),
(211,'大麻',1,'2026-08-16 18:53:03',0),
(212,'摇头丸',1,'2026-08-16 18:53:03',0),
(213,'可卡因',1,'2026-08-16 18:53:03',0),
(214,'鸦片',1,'2026-08-16 18:53:03',0),
(215,'博彩',1,'2026-08-16 18:53:03',0),
(216,'六合彩',1,'2026-08-16 18:53:03',0),
(217,'网络赌博',1,'2026-08-16 18:53:03',0),
(218,'赌博网站',1,'2026-08-16 18:53:03',0),
(219,'炸药',1,'2026-08-16 18:53:03',0),
(220,'炸弹',1,'2026-08-16 18:53:03',0),
(221,'恐怖袭击',1,'2026-08-16 18:53:03',0),
(222,'恐怖分子',1,'2026-08-16 18:53:03',0),
(223,'圣战',1,'2026-08-16 18:53:03',0),
(224,'占中',1,'2026-08-16 18:53:03',0),
(225,'颜色革命',1,'2026-08-16 18:53:03',0),
(226,'颠覆国家',1,'2026-08-16 18:53:03',0),
(227,'分裂国家',1,'2026-08-16 18:53:03',0),
(228,'卖国',1,'2026-08-16 18:53:03',0),
(229,'荐股',2,'2026-08-16 18:53:03',0),
(230,'股票群',2,'2026-08-16 18:53:03',0),
(231,'网赚',2,'2026-08-16 18:53:03',0),
(232,'躺赚',2,'2026-08-16 18:53:03',0),
(233,'日赚',2,'2026-08-16 18:53:03',0),
(234,'月入过万',2,'2026-08-16 18:53:03',0),
(235,'在家赚钱',2,'2026-08-16 18:53:03',0),
(236,'手机赚钱',2,'2026-08-16 18:53:03',0),
(237,'刷信誉',2,'2026-08-16 18:53:03',0),
(238,'刷好评',2,'2026-08-16 18:53:03',0),
(239,'刷销量',2,'2026-08-16 18:53:03',0),
(240,'代练',2,'2026-08-16 18:53:03',0),
(241,'外挂',2,'2026-08-16 18:53:03',0),
(242,'私服',2,'2026-08-16 18:53:03',0),
(243,'破解',2,'2026-08-16 18:53:03',0),
(244,'盗版',2,'2026-08-16 18:53:03',0),
(245,'办假证',2,'2026-08-16 18:53:03',0),
(246,'假文凭',2,'2026-08-16 18:53:03',0),
(247,'代开发票',2,'2026-08-16 18:53:03',0),
(248,'壮阳',2,'2026-08-16 18:53:03',0),
(249,'伟哥',2,'2026-08-16 18:53:03',0),
(250,'迷药',2,'2026-08-16 18:53:03',0),
(251,'春药',2,'2026-08-16 18:53:03',0),
(252,'催情',2,'2026-08-16 18:53:03',0),
(253,'算命',2,'2026-08-16 18:53:03',0),
(254,'看相',2,'2026-08-16 18:53:03',0),
(255,'开光',2,'2026-08-16 18:53:03',0),
(256,'符咒',2,'2026-08-16 18:53:03',0),
(257,'兼职打字',2,'2026-08-16 18:53:03',0),
(258,'宝妈兼职',2,'2026-08-16 18:53:03',0),
(259,'加我',2,'2026-08-16 18:53:03',0),
(260,'联系我',2,'2026-08-16 18:53:03',0),
(261,'私我',2,'2026-08-16 18:53:03',0),
(262,'资源群',2,'2026-08-16 18:53:03',0),
(263,'福利群',2,'2026-08-16 18:53:03',0),
(264,'滚你妈的',1,'2026-08-16 18:56:51',0),
(265,'操你大爷',1,'2026-08-16 18:56:51',0),
(266,'日你大爷',1,'2026-08-16 18:56:51',0),
(267,'日你先人',1,'2026-08-16 18:56:51',0),
(268,'你妈的逼',1,'2026-08-16 18:56:51',0),
(269,'狗操的',1,'2026-08-16 18:56:51',0),
(270,'王八羔子',1,'2026-08-16 18:56:51',0),
(271,'兔崽子',1,'2026-08-16 18:56:51',0),
(272,'傻帽',1,'2026-08-16 18:56:51',0),
(273,'傻不拉几',1,'2026-08-16 18:56:51',0),
(274,'缺心眼',1,'2026-08-16 18:56:51',0),
(275,'臭婆娘',1,'2026-08-16 18:56:51',0),
(276,'狐狸精',1,'2026-08-16 18:56:51',0),
(277,'扫把星',1,'2026-08-16 18:56:51',0),
(278,'丧门星',1,'2026-08-16 18:56:51',0),
(279,'娘娘腔',1,'2026-08-16 18:56:51',0),
(280,'狗崽子',1,'2026-08-16 18:56:51',0),
(281,'狼心狗肺',1,'2026-08-16 18:56:51',0),
(282,'白眼狼',1,'2026-08-16 18:56:51',0),
(283,'该死的',1,'2026-08-16 18:56:51',0),
(284,'挨千刀的',1,'2026-08-16 18:56:51',0),
(285,'天杀的',1,'2026-08-16 18:56:51',0),
(286,'憨批',1,'2026-08-16 18:56:51',1),
(287,'瓜批',1,'2026-08-16 18:56:51',0),
(288,'扑街',1,'2026-08-16 18:56:51',0),
(289,'痴线',1,'2026-08-16 18:56:51',0),
(290,'二傻子',1,'2026-08-16 18:56:51',0),
(291,'二愣子',1,'2026-08-16 18:56:51',0),
(292,'龟蛋',1,'2026-08-16 18:56:51',0),
(293,'瓜娃子',1,'2026-08-16 18:56:51',0),
(294,'习近平',1,'2026-08-16 18:56:51',0),
(295,'胡锦涛',1,'2026-08-16 18:56:51',0),
(296,'江泽民',1,'2026-08-16 18:56:51',0),
(297,'邓小平',1,'2026-08-16 18:56:51',0),
(298,'毛泽东',1,'2026-08-16 18:56:51',0),
(299,'周恩来',1,'2026-08-16 18:56:51',0),
(300,'刘少奇',1,'2026-08-16 18:56:51',0),
(301,'朱德',1,'2026-08-16 18:56:51',0),
(302,'温家宝',1,'2026-08-16 18:56:51',0),
(303,'李克强',1,'2026-08-16 18:56:51',0),
(304,'李强',1,'2026-08-16 18:56:51',0),
(305,'栗战书',1,'2026-08-16 18:56:51',0),
(306,'汪洋',1,'2026-08-16 18:56:51',0),
(307,'王沪宁',1,'2026-08-16 18:56:51',0),
(308,'赵乐际',1,'2026-08-16 18:56:51',0),
(309,'韩正',1,'2026-08-16 18:56:51',0),
(310,'王岐山',1,'2026-08-16 18:56:51',0),
(311,'朱镕基',1,'2026-08-16 18:56:51',0),
(312,'李鹏',1,'2026-08-16 18:56:51',0),
(313,'吴邦国',1,'2026-08-16 18:56:51',0),
(314,'贾庆林',1,'2026-08-16 18:56:51',0),
(315,'俞正声',1,'2026-08-16 18:56:51',0),
(316,'张德江',1,'2026-08-16 18:56:51',0),
(317,'刘云山',1,'2026-08-16 18:56:51',0),
(318,'彭德怀',1,'2026-08-16 18:56:51',0),
(319,'林彪',1,'2026-08-16 18:56:51',0),
(320,'陈云',1,'2026-08-16 18:56:51',0),
(321,'薄熙来',1,'2026-08-16 18:56:51',0),
(322,'周永康',1,'2026-08-16 18:56:51',0),
(323,'令计划',1,'2026-08-16 18:56:51',0),
(324,'徐才厚',1,'2026-08-16 18:56:51',0),
(325,'郭伯雄',1,'2026-08-16 18:56:51',0),
(326,'孙政才',1,'2026-08-16 18:56:51',0),
(327,'习大大',1,'2026-08-16 18:56:51',1),
(328,'习主席',1,'2026-08-16 18:56:51',0),
(329,'习总书记',1,'2026-08-16 18:56:51',0),
(330,'习总',1,'2026-08-16 18:56:51',0),
(331,'习包子',1,'2026-08-16 18:56:51',0),
(332,'维尼熊',1,'2026-08-16 18:56:51',0),
(333,'维尼',1,'2026-08-16 18:56:51',0);
/*!40000 ALTER TABLE `sensitive_word` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `session`
--

DROP TABLE IF EXISTS `session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `session` (
  `id` varchar(255) NOT NULL COMMENT 'session id (cookie EGG_SESS)',
  `data` text DEFAULT NULL COMMENT 'session 序列化数据',
  `expire_at` bigint(20) DEFAULT NULL COMMENT '过期时间戳(ms)',
  `update_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expire` (`expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `session`
--

LOCK TABLES `session` WRITE;
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` VALUES
('33f50a45-ef5a-4b5e-84c8-f6731de45c56','{\"userId\":4,\"username\":\"请问\",\"_expire\":1787663565685,\"_maxAge\":86400000}',1787663575685,'2026-08-24 21:12:45'),
('3783576e-ebab-494f-88c2-f055392f4673','{\"userId\":4,\"username\":\"请问\",\"_expire\":1786960749470,\"_maxAge\":86400000}',1786960759470,'2026-08-16 17:59:09'),
('a85830d1-79c7-4a12-8329-b40c8ba9a9f4','{\"userId\":4,\"username\":\"请问\",\"_expire\":1787841012666,\"_maxAge\":86400000}',1787841022666,'2026-08-26 22:30:12');
/*!40000 ALTER TABLE `session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userId` int(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码',
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '电话号码',
  `sex` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '性别',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '邮箱',
  `ctime` datetime DEFAULT NULL COMMENT '注册时间',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '头像',
  `last_login_time` datetime NOT NULL COMMENT '最后登录时间',
  `personalIntroduction` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '个人介绍',
  `daily_goal` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_croatian_ci COMMENT='用户';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES
(1,'admin','$2b$10$Bb0QdpS9JgFHSwz//nTq7uyxaU77IPf6cIMouM/PH34kbmV/8uOG2','123456','1','eaogoyang@163.com','2023-03-19 15:58:14','https://api.dicebear.com/7.x/avataaars/svg?seed=admin','2026-08-15 22:25:53','',0,0),
(2,'小米','$2b$10$nAzDPvkbYZFTd9CZtO3ZOOBsoQr5jmBwf4e9QkygLZNh.GSfme0vK','18111111111','1','eaogoyang@163.com','2023-03-19 15:58:14','https://api.dicebear.com/7.x/avataaars/svg?seed=xiaomi','2026-08-26 22:29:46','dfsgdfsgdf',0,0),
(3,'18岁老太太','$2b$10$QfnSNXxEoLlIxmSMJixFPOgL5njq1rrEzrqo6TZK5hCvR3QM9G59y','18000000000','1','eaogoyang@163.com','2023-03-19 15:59:09','https://api.dicebear.com/7.x/avataaars/svg?seed=oldlady','2026-08-15 22:30:42',NULL,0,0),
(4,'请问','$2b$10$IMqEd4SJmvoC0.hsCmzoJ.LcoBqRNtZjKwXlJCq3B7tCJ1M9KUQey','19999999999','1','123@qq.com','2026-08-15 19:46:39','/public/uploads/4_1787589302504_common.jpg','2026-08-26 22:30:12','iii',0,0),
(5,'啊啊啊啊啊啊啊啊','$2b$10$SVBf5mJNqXwoO4bsjbTcuO.om4sfS8ZZbc7GVhgJAYWylyKiI7e/a','17777777777','0','1@qq.com','2026-08-16 00:20:53','https://api.dicebear.com/7.x/avataaars/svg?seed=aa987654','2026-08-16 00:20:53','',0,1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_favorite_question`
--

DROP TABLE IF EXISTS `user_favorite_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favorite_question` (
  `user_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_favorite_question`
--

LOCK TABLES `user_favorite_question` WRITE;
/*!40000 ALTER TABLE `user_favorite_question` DISABLE KEYS */;
INSERT INTO `user_favorite_question` VALUES
(4,562,'2026-08-26 22:38:44'),
(4,678,'2026-08-25 00:30:37'),
(4,679,'2026-08-26 22:23:25');
/*!40000 ALTER TABLE `user_favorite_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_follow`
--

DROP TABLE IF EXISTS `user_follow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follow` (
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT NULL,
  PRIMARY KEY (`follower_id`,`followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_follow`
--

LOCK TABLES `user_follow` WRITE;
/*!40000 ALTER TABLE `user_follow` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_follow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_like_question`
--

DROP TABLE IF EXISTS `user_like_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_like_question` (
  `user_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_like_question`
--

LOCK TABLES `user_like_question` WRITE;
/*!40000 ALTER TABLE `user_like_question` DISABLE KEYS */;
INSERT INTO `user_like_question` VALUES
(4,562,'2026-08-16 01:00:35'),
(4,563,'2026-08-26 22:38:39'),
(4,678,'2026-08-25 00:30:38'),
(4,679,'2026-08-26 22:23:25');
/*!40000 ALTER TABLE `user_like_question` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_upload_question`
--

DROP TABLE IF EXISTS `user_upload_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_upload_question` (
  `user_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `create_time` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_upload_question`
--

LOCK TABLES `user_upload_question` WRITE;
/*!40000 ALTER TABLE `user_upload_question` DISABLE KEYS */;
INSERT INTO `user_upload_question` VALUES
(2,679,'2026-08-26 22:18:28'),
(4,678,'2026-08-24 23:00:20');
/*!40000 ALTER TABLE `user_upload_question` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 22:44:01
