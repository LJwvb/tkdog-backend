/* eslint-disable comma-dangle */
import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router, middleware } = app;
  // 鉴权中间件
  const auth = middleware.auth();
  const adminAuth = middleware.adminAuth();
  const authOrAdmin = middleware.authOrAdmin();
  // 前缀
  router.prefix('/api');

  // ===== 公开接口（登录 / 注册 / 浏览类，无需登录）=====
  router.post('/captcha', controller.user.captcha);
  router.post('/register', controller.user.register);
  router.post('/login', controller.user.login);
  router.post('/resetPassword', controller.user.resetPassword);
  router.post('/logout', controller.user.logout);
  router.post('/refreshToken', controller.user.refreshToken);
  // GitHub OAuth 第三方登录
  router.get('/oauth/github', controller.oauth.github);
  router.post('/oauth/github/callback', controller.oauth.githubCallback);
  router.post('/adminLogin', controller.admin.adminLogin);
  router.post('/getQuestions', controller.questions.getQuestions);
  router.post('/getQuestionDetail', controller.questions.getQuestionDetail);
  router.get('/getDailyQuestions', controller.questions.getDailyQuestions);
  router.post('/getSimilarQuestions', controller.questions.getSimilarQuestions);
  router.post('/searchQuestions', controller.questions.searchQuestions);
  router.post('/getTagStats', adminAuth, controller.questions.getTagStats);
  router.post('/renameTag', adminAuth, controller.questions.renameTag);
  router.post('/deleteTag', adminAuth, controller.questions.deleteTag);
  router.get('/getSubjectList', controller.subjectList.getSubjectList);
  router.get('/getAnnouncements', controller.announcement.getList);
  router.get('/getRankingList', controller.rankingList.getRankingList);
  router.get('/getCommentList', controller.comment.getCommentList);
  router.post(
    '/getPaperQuestionsList',
    controller.paper.getPaperQuestionsList
  );
  router.post(
    '/getPaperQuestionsDetail',
    controller.paper.getPaperQuestionsDetail
  );

  // ===== 需登录接口（auth）=====
  router.post('/editUserInfo', auth, controller.user.updateUserInfo);
  router.post('/getUserInfo', auth, controller.user.getUserInfo);
  router.post('/setDailyGoal', auth, controller.user.setDailyGoal);
  router.post('/getPublicProfile', auth, controller.user.getPublicProfile);
  router.post('/getUserUploadQues', auth, controller.user.getUserUploadQues);
  router.post('/uploadQuestions', auth, controller.questions.uploadQuestions);
  router.post('/importQuestions', auth, controller.questions.importQuestions);
  router.post(
    '/randomPickQuestions',
    auth,
    controller.questions.randomPickQuestions
  );
  router.post('/likeQuestions', auth, controller.questions.likeQuestions);
  router.post(
    '/cancelLikeQuestions',
    auth,
    controller.questions.cancelLikeQuestions
  );
  // 浏览数：游客也能浏览题目，浏览数应随访问 +1，不强制登录
  router.post('/addBrowsesNum', controller.questions.addBrowsesNum);
  router.post('/getPaperQuestions', auth, controller.paper.getPaperQuestions);
  router.post(
    '/updatePaperPurview',
    auth,
    controller.paper.updatePaperPurview
  );
  // 编辑自己的试卷题目（公开试卷需重新审核）
  router.post(
    '/updatePaperQuestions',
    auth,
    controller.paper.updatePaperQuestions
  );
  router.post('/addComment', auth, controller.comment.addComment);
  router.post('/uploadImage', auth, controller.upload.uploadImage);
  router.post('/likeComment', auth, controller.comment.likeComment);
  router.post('/unlikeComment', auth, controller.comment.unlikeComment);
  router.post('/checkin', auth, controller.checkin.checkin);
  router.post('/getCheckinInfo', auth, controller.checkin.getCheckinInfo);
  router.post('/favoriteQuestion', auth, controller.favorite.add);
  router.post(
    '/cancelFavoriteQuestion',
    auth,
    controller.favorite.remove
  );
  router.post('/getMyFavorites', auth, controller.favorite.getList);
  router.post('/followUser', auth, controller.follow.follow);
  router.post('/unfollowUser', auth, controller.follow.unfollow);
  router.post('/getFollowing', auth, controller.follow.getFollowing);
  router.post('/getFollowers', auth, controller.follow.getFollowers);
  router.post('/getFollowCounts', auth, controller.follow.getCounts);
  router.post('/submitFeedback', auth, controller.feedback.submitFeedback);
  router.post('/getMyFeedback', auth, controller.feedback.getMyFeedback);
  router.post('/submitPaper', auth, controller.answer.submitPaper);
  // AI 批改简答题（主观题）
  router.post('/aiJudgeAnswer', auth, controller.answer.aiJudgeAnswer);
  router.post('/aiJudgeBatch', auth, controller.answer.aiJudgeBatch);
  // AI 解题解析
  router.post('/aiAnalyze', auth, controller.answer.aiAnalyze);
  router.post('/aiHint', auth, controller.answer.aiHint);
  router.post('/aiPaperReport', auth, controller.answer.aiPaperReport);
  router.post('/aiLearningReport', auth, controller.user.aiLearningReport);
  router.post('/exchangeAiCredit', auth, controller.user.exchangeAiCredit);
  router.post('/aiPaperSuggest', auth, controller.paper.aiPaperSuggest);
  router.post('/getMyPaperRecords', auth, controller.answer.getMyPaperRecords);
  router.post('/getRecordDetail', auth, controller.answer.getRecordDetail);
  router.post('/getAnswerStats', auth, controller.answer.getAnswerStats);
  router.post('/getWrongQuestions', auth, controller.answer.getWrongQuestions);
  router.post(
    '/clearWrongQuestions',
    auth,
    controller.answer.clearWrongQuestions
  );
  router.post('/getNotifications', auth, controller.notification.getNotifications);
  router.post('/getUnreadCount', auth, controller.notification.getUnreadCount);
  router.post(
    '/markNotificationRead',
    auth,
    controller.notification.markRead
  );
  router.post(
    '/markAllNotificationsRead',
    auth,
    controller.notification.markAllRead
  );

  // ===== 管理员接口（adminAuth）=====
  router.post(
    '/editAdminPassword',
    adminAuth,
    controller.admin.editAdminPassword
  );
  router.post('/getUserList', adminAuth, controller.admin.getUserList);
  router.post('/adminUpdateUser', adminAuth, controller.admin.adminUpdateUser);
  router.post(
    '/getAdminStatistics',
    adminAuth,
    controller.admin.getStatistics
  );
  router.post(
    '/getAdminPendingCounts',
    adminAuth,
    controller.admin.getPendingCounts
  );
  router.post(
    '/getNoChkQuestions',
    adminAuth,
    controller.admin.getNoChkQuestions
  );
  router.post(
    '/getAllChkQuestions',
    adminAuth,
    controller.admin.getAllChkQuestions
  );
  router.post(
    '/searchAdminQuestions',
    adminAuth,
    controller.admin.searchQuestions
  );
  router.post('/chkQuestions', adminAuth, controller.admin.chkQuestions);
  router.post('/deleteQuestions', adminAuth, controller.admin.deleteQuestions);
  router.post('/updateQuestion', authOrAdmin, controller.questions.updateQuestion);
  router.post('/chkPaper', adminAuth, controller.admin.chkPaper);
  router.post('/getNoChkPaper', adminAuth, controller.admin.getNoChkPaper);
  router.post('/getAllChkPaper', adminAuth, controller.admin.getAllChkPaper);
  router.post('/deletePaper', adminAuth, controller.admin.deletePaper);
  router.post('/deleteUser', adminAuth, controller.admin.deleteUser);
  router.post(
    '/getDeletedQuestions',
    adminAuth,
    controller.admin.getDeletedQuestions
  );
  router.post('/restoreQuestion', adminAuth, controller.admin.restoreQuestion);
  router.post('/getDeletedPapers', adminAuth, controller.admin.getDeletedPapers);
  router.post('/restorePaper', adminAuth, controller.admin.restorePaper);
  router.post('/getDeletedUsers', adminAuth, controller.admin.getDeletedUsers);
  router.post('/restoreUser', adminAuth, controller.admin.restoreUser);
  router.post('/deleteComment', adminAuth, controller.comment.deleteComment);
  router.post(
    '/getDeletedComments',
    adminAuth,
    controller.comment.getDeletedComments
  );
  router.post(
    '/restoreComment',
    adminAuth,
    controller.comment.restoreComment
  );
  router.post('/approveComment', adminAuth, controller.comment.approveComment);
  router.post('/pinComment', adminAuth, controller.comment.pinComment);
  router.post('/getFeedbackList', adminAuth, controller.feedback.getFeedbackList);
  router.post('/resolveFeedback', adminAuth, controller.feedback.resolveFeedback);
  router.post(
    '/getUnresolvedFeedbackCount',
    adminAuth,
    controller.feedback.getUnresolvedCount
  );
  router.post(
    '/getSensitiveWords',
    adminAuth,
    controller.sensitiveWord.getList
  );
  router.post('/addSensitiveWord', adminAuth, controller.sensitiveWord.add);
  router.post(
    '/deleteSensitiveWord',
    adminAuth,
    controller.sensitiveWord.remove
  );
  router.post(
    '/getDeletedSensitiveWords',
    adminAuth,
    controller.sensitiveWord.getDeletedList
  );
  router.post(
    '/restoreSensitiveWord',
    adminAuth,
    controller.sensitiveWord.restore
  );
  router.post('/addAnnouncement', adminAuth, controller.announcement.add);
  router.post(
    '/deleteAnnouncement',
    adminAuth,
    controller.announcement.remove
  );
  router.post(
    '/getDeletedAnnouncements',
    adminAuth,
    controller.announcement.getDeletedList
  );
  router.post(
    '/restoreAnnouncement',
    adminAuth,
    controller.announcement.restore
  );
};
