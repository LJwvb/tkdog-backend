// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportAdmin from '../../../app/service/admin';
import ExportAnnouncement from '../../../app/service/announcement';
import ExportAnswer from '../../../app/service/answer';
import ExportCheckin from '../../../app/service/checkin';
import ExportComment from '../../../app/service/comment';
import ExportFavorite from '../../../app/service/favorite';
import ExportFeedback from '../../../app/service/feedback';
import ExportFollow from '../../../app/service/follow';
import ExportMessage from '../../../app/service/message';
import ExportNotification from '../../../app/service/notification';
import ExportPaper from '../../../app/service/paper';
import ExportQuestions from '../../../app/service/questions';
import ExportRankingList from '../../../app/service/rankingList';
import ExportSensitiveWord from '../../../app/service/sensitiveWord';
import ExportUser from '../../../app/service/user';

declare module 'egg' {
  interface IService {
    admin: AutoInstanceType<typeof ExportAdmin>;
    announcement: AutoInstanceType<typeof ExportAnnouncement>;
    answer: AutoInstanceType<typeof ExportAnswer>;
    checkin: AutoInstanceType<typeof ExportCheckin>;
    comment: AutoInstanceType<typeof ExportComment>;
    favorite: AutoInstanceType<typeof ExportFavorite>;
    feedback: AutoInstanceType<typeof ExportFeedback>;
    follow: AutoInstanceType<typeof ExportFollow>;
    message: AutoInstanceType<typeof ExportMessage>;
    notification: AutoInstanceType<typeof ExportNotification>;
    paper: AutoInstanceType<typeof ExportPaper>;
    questions: AutoInstanceType<typeof ExportQuestions>;
    rankingList: AutoInstanceType<typeof ExportRankingList>;
    sensitiveWord: AutoInstanceType<typeof ExportSensitiveWord>;
    user: AutoInstanceType<typeof ExportUser>;
  }
}
