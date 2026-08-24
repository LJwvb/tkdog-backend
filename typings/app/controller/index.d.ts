// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAdmin from '../../../app/controller/admin';
import ExportAnnouncement from '../../../app/controller/announcement';
import ExportAnswer from '../../../app/controller/answer';
import ExportCheckin from '../../../app/controller/checkin';
import ExportComment from '../../../app/controller/comment';
import ExportFavorite from '../../../app/controller/favorite';
import ExportFeedback from '../../../app/controller/feedback';
import ExportFollow from '../../../app/controller/follow';
import ExportNotification from '../../../app/controller/notification';
import ExportPaper from '../../../app/controller/paper';
import ExportQuestions from '../../../app/controller/questions';
import ExportRankingList from '../../../app/controller/rankingList';
import ExportSensitiveWord from '../../../app/controller/sensitiveWord';
import ExportSubjectList from '../../../app/controller/subjectList';
import ExportUpload from '../../../app/controller/upload';
import ExportUser from '../../../app/controller/user';

declare module 'egg' {
  interface IController {
    admin: ExportAdmin;
    announcement: ExportAnnouncement;
    answer: ExportAnswer;
    checkin: ExportCheckin;
    comment: ExportComment;
    favorite: ExportFavorite;
    feedback: ExportFeedback;
    follow: ExportFollow;
    notification: ExportNotification;
    paper: ExportPaper;
    questions: ExportQuestions;
    rankingList: ExportRankingList;
    sensitiveWord: ExportSensitiveWord;
    subjectList: ExportSubjectList;
    upload: ExportUpload;
    user: ExportUser;
  }
}
