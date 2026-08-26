/* eslint-disable comma-dangle */
import { Service } from 'egg';
import bcrypt from 'bcryptjs';
import { getNowFormatDate, getSubjectName } from '../utils';

interface IChkQuestions {
  id: number | string; // 题目ID
  chkState?: 0 | 1 | 2; // 审核状态 0:未审核 1:审核通过 2:审核不通过
  chkRemarks?: string; // 审核备注
}

export default class admin extends Service {
  // 管理员登录
  public async adminLogin(params) {
    const { app } = this;
    const { name, password } = params;
    try {
      // 先按用户名查，再 bcrypt 校验密码（不再明文比对）
      const result: any = await app.mysql.get('admin', { name });
      if (!result) return null;
      const ok = await bcrypt.compare(password, result.password);
      if (!ok) return null;
      // 更新登录时间
      await app.mysql.update(
        'admin',
        {
          last_login_time: getNowFormatDate(),
        },
        {
          where: { id: result.id },
        }
      );

      return {
        ...result,
        isAdmin: true,
      };
    } catch (err) {
      return null;
    }
  }
  // 修改密码
  public async editAdminPassword(params) {
    const { app } = this;
    const { id, password } = params;
    try {
      const hashed = await bcrypt.hash(password, 10);
      const result = await app.mysql.update(
        'admin',
        {
          password: hashed,
        },
        {
          where: { id },
        }
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取用户列表（分页）
  public async getUserList(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10 } = params || {};
    try {
      const user: any = await app.mysql.query(
        'SELECT * FROM user WHERE is_deleted = 0',
      );
      const admin = await app.mysql.select('admin');
      const list: any[] = [ ...admin, ...user ];
      // 一次性按 creator 聚合题目统计，避免逐用户查询（N+1）
      const statsRows: any = await app.mysql.query(
        'SELECT creator, COUNT(*) AS upload_ques_num, ' +
          'COALESCE(SUM(likes_num),0) AS like_ques_num, ' +
          'COALESCE(SUM(CASE WHEN chkState=1 THEN 1 ELSE 0 END), 0) AS approvedNums ' +
          'FROM questions WHERE is_deleted = 0 GROUP BY creator',
      );
      const statsMap = new Map<string, any>();
      statsRows.forEach((r: any) => statsMap.set(r.creator, r));
      for (const item of list) {
        const creator = item.username || item.name;
        if (creator) {
          const stats = statsMap.get(creator);
          item.upload_ques_num = Number(stats?.upload_ques_num) || 0;
          item.like_ques_num = Number(stats?.like_ques_num) || 0;
          item.approvedNums = Number(stats?.approvedNums) || 0;
        }
        // 普通用户积分用与用户端完全一致的 computePoints 实时计算（上传×2 + 审核通过×5 + 答对×1 + 打卡×5）
        if (item.userId) {
          const points = await this.service.user.computePoints(item.userId);
          item.integral = points.integral;
        } else {
          // 管理员行无积分
          item.integral = 0;
        }
        // 不向前端暴露密码
        delete item.password;
      }
      const total = list.length;
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const result = list.slice((page - 1) * size, page * size);
      return { result, total };
    } catch (err) {
      return null;
    }
  }
  // 首页统计：近七日新增趋势 + 总量 + 科目/题型分布
  public async getStatistics() {
    const { app } = this;
    try {
      // 生成近七日日期标签（YYYY-MM-DD）
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push(`${d.getFullYear()}-${mm}-${dd}`);
      }
      // 把「按天聚合」的查询结果映射到近七日数组
      const mapCount = (rows: any): Array<{ date: string; value: number }> => {
        const m: Record<string, number> = {};
        (rows || []).forEach((r: any) => {
          m[String(r.d).slice(0, 10)] = Number(r.c) || 0;
        });
        return days.map(d => ({ date: d, value: m[d] || 0 }));
      };

      const [ userRows, questionRows, paperRows, answerRows ] = await Promise.all([
        app.mysql.query(
          "SELECT DATE_FORMAT(ctime, '%Y-%m-%d') AS d, COUNT(*) AS c FROM user WHERE ctime IS NOT NULL AND is_deleted = 0 GROUP BY DATE_FORMAT(ctime, '%Y-%m-%d')",
        ),
        app.mysql.query(
          "SELECT DATE_FORMAT(addDate, '%Y-%m-%d') AS d, COUNT(*) AS c FROM questions WHERE addDate IS NOT NULL AND is_deleted = 0 GROUP BY DATE_FORMAT(addDate, '%Y-%m-%d')",
        ),
        app.mysql.query(
          "SELECT DATE_FORMAT(ctime, '%Y-%m-%d') AS d, COUNT(*) AS c FROM examination_paper WHERE is_deleted = 0 GROUP BY DATE_FORMAT(ctime, '%Y-%m-%d')",
        ),
        app.mysql.query(
          "SELECT DATE_FORMAT(ctime, '%Y-%m-%d') AS d, COUNT(*) AS c FROM paper_record GROUP BY DATE_FORMAT(ctime, '%Y-%m-%d')",
        ),
      ]);

      const one = async (sql: string): Promise<number> => {
        const rows: any = await app.mysql.query(sql);
        return Number(rows?.[0]?.c) || 0;
      };
      const totals = {
        users: await one('SELECT COUNT(*) AS c FROM user WHERE is_deleted = 0'),
        questions: await one(
          'SELECT COUNT(*) AS c FROM questions WHERE is_deleted = 0',
        ),
        papers: await one(
          'SELECT COUNT(*) AS c FROM examination_paper WHERE is_deleted = 0',
        ),
        answers: await one('SELECT COUNT(*) AS c FROM paper_record'),
        comments: await one(
          'SELECT COUNT(*) AS c FROM comment WHERE is_deleted = 0',
        ),
        pendingFeedback: await one(
          'SELECT COUNT(*) AS c FROM question_feedback WHERE is_resolved = 0',
        ),
      };

      const subjectRows: any = await app.mysql.query(
        'SELECT subjectID, COUNT(*) AS c FROM questions WHERE is_deleted = 0 GROUP BY subjectID',
      );
      const subjectDist = subjectRows.map((r: any) => ({
        name: getSubjectName(Number(r.subjectID)),
        value: Number(r.c) || 0,
      }));

      const typeNameMap: Record<number, string> = {
        0: '单选题',
        1: '多选题',
        2: '判断题',
        3: '简答题',
      };
      const typeRows: any = await app.mysql.query(
        'SELECT questionType, COUNT(*) AS c FROM questions WHERE is_deleted = 0 GROUP BY questionType',
      );
      const typeDist = typeRows.map((r: any) => ({
        name: typeNameMap[Number(r.questionType)] || '其他',
        value: Number(r.c) || 0,
      }));

      // 最近上传的题目 / 最近创建的试卷
      const recentUploads: any = await app.mysql.query(
        'SELECT id, question, creator, addDate FROM questions WHERE is_deleted = 0 ORDER BY id DESC LIMIT 5',
      );
      const recentPapers: any = await app.mysql.query(
        'SELECT paper_id, paper_title, author, ctime FROM examination_paper WHERE is_deleted = 0 ORDER BY paper_id DESC LIMIT 5',
      );

      return {
        days,
        sevenDays: {
          newUsers: mapCount(userRows),
          uploads: mapCount(questionRows),
          papers: mapCount(paperRows),
          answers: mapCount(answerRows),
        },
        totals,
        subjectDist,
        typeDist,
        recentUploads,
        recentPapers,
      };
    } catch (err) {
      return null;
    }
  }
  // 未审核数量统计（导航栏红点）
  public async getPendingCounts() {
    const { app } = this;
    try {
      const one = async (sql: string) => {
        const rows: any = await app.mysql.query(sql);
        return Number(rows?.[0]?.c) || 0;
      };
      return {
        pendingQuestions: await one(
          'SELECT COUNT(*) AS c FROM questions WHERE chkState = 0 AND is_deleted = 0',
        ),
        pendingPapers: await one(
          'SELECT COUNT(*) AS c FROM examination_paper WHERE chkState = 0 AND is_deleted = 0',
        ),
        pendingComments: await one(
          'SELECT COUNT(*) AS c FROM comment WHERE status = 0 AND is_deleted = 0',
        ),
        unresolvedFeedback: await one(
          'SELECT COUNT(*) AS c FROM question_feedback WHERE is_resolved = 0',
        ),
      };
    } catch (err) {
      return null;
    }
  }
  // 所有未审核的题目
  public async getNoChkQuestions(params) {
    const { app } = this;
    const { currentPage, pageSize } = params;

    try {
      const result = await app.mysql.select('questions', {
        where: { chkState: 0, is_deleted: 0 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      // 获取所有未审核题目总数
      const count = await app.mysql.query(
        'select count(*) as count from questions where chkState = 0 and is_deleted = 0'
      );
      return { result, total: count[0].count };
    } catch (err) {
      return null;
    }
  }
  // 所有已审核的题目
  public async getAllChkQuestions(params) {
    const { app } = this;
    const { currentPage, pageSize } = params;

    try {
      const result = await app.mysql.select('questions', {
        where: { chkState: 1, is_deleted: 0 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      // 获取所有已审核题目总数
      const count = await app.mysql.query(
        'select count(*) as count from questions where chkState = 1 and is_deleted = 0'
      );
      return { result, total: count[0].count };
    } catch (err) {
      return null;
    }
  }
  // 审核题目
  public async chkQuestions(params: IChkQuestions) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'questions',
        { chkState: params.chkState, chkRemarks: params.chkRemarks || null },
        { where: { id: params.id } },
      );
      // 统计字段（获赞/上传/审核通过数）已改为实时计算，无需在此维护冗余字段
      // 审核结果通知上传者
      const question: any = await app.mysql.get('questions', { id: params.id });
      if (question) {
        const upload: any = await app.mysql.get('user_upload_question', {
          question_id: params.id,
        });
        if (upload?.user_id) {
          const stateText =
            Number(params.chkState) === 1
              ? '审核通过'
              : Number(params.chkState) === 2
                ? '审核不通过'
                : '待审核';
          // 审核建议：与默认状态文案相同时不再重复拼接，自定义建议才附上并通知用户
          const remark = String(params.chkRemarks || '').trim();
          const remarkText =
            remark && remark !== stateText ? `，审核建议：${remark}` : '';
          await this.service.notification.create({
            userId: upload.user_id,
            type: 'question_review',
            title: `题目${stateText}`,
            content: `你上传的题目「${question.question || ''}」${stateText}${remarkText}`,
          });
        }
      }
      return result;
    } catch (err) {
      return null;
    }
  }
  // 删除题目（软删除：标记 is_deleted，题目及其评论一并标记，不物理删除）
  public async deleteQuestions(params) {
    const { app } = this;
    const { id } = params;
    try {
      await app.mysql.update('questions', { is_deleted: 1 }, { where: { id } });
      await app.mysql.update(
        'comment',
        { is_deleted: 1 },
        { where: { question_id: id } },
      );
      // 从所有试卷中剔除该题
      await app.mysql.delete('paper_question', { question_id: id });
      return { success: true };
    } catch (err) {
      return null;
    }
  }
  // 审核试卷
  public async chkPaperQuestions(params) {
    const { app } = this;
    const { paperId, chkState } = params;
    try {
      const result = await app.mysql.update(
        'examination_paper',
        {
          chkState,
        },
        {
          where: {
            paper_id: paperId,
          },
        }
      );
      // 审核结果通知试卷作者
      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
      });
      if (paper?.author) {
        const author: any = await app.mysql.get('user', {
          username: paper.author,
        });
        if (author?.userId) {
          const stateText = Number(chkState) === 1 ? '审核通过' : '审核不通过';
          await this.service.notification.create({
            userId: author.userId,
            type: 'paper_review',
            title: `试卷${stateText}`,
            content: `你创建的试卷「${paper.paper_title || ''}」${stateText}`,
          });
        }
      }
      return result;
    } catch (err) {
      return null;
    }
  }
  // 所有未审核的试卷
  public async getNoChkPaper(params) {
    const { app } = this;
    const { currentPage, pageSize } = params;
    try {
      const result: any = await app.mysql.select('examination_paper', {
        where: { chkState: 0 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      // 获取所有未审核题目总数
      const count = await app.mysql.query(
        'select count(*) as count from examination_paper where chkState = 0'
      );
      return { result, total: count[0].count };
    } catch (err) {
      return null;
    }
  }
  // 所有已审核的试卷
  public async getAllChkPaper(params) {
    const { app } = this;
    const { currentPage, pageSize } = params;
    try {
      const result = await app.mysql.select('examination_paper', {
        where: { chkState: 1 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      // 获取所有已审核题目总数
      const count = await app.mysql.query(
        'select count(*) as count from examination_paper where chkState = 1'
      );
      return { result, total: count[0].count };
    } catch (err) {
      return null;
    }
  }
  // 删除试卷（软删除：标记 is_deleted，不物理删除）
  public async deletePaper(params) {
    const { app } = this;
    const { paperId } = params;
    try {
      const result = await app.mysql.update(
        'examination_paper',
        { is_deleted: 1 },
        { where: { paper_id: paperId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 删除用户（软删除：标记 is_deleted，不物理删除）
  public async deleteUser(params) {
    const { app } = this;
    const { userId } = params;
    try {
      const result = await app.mysql.update(
        'user',
        { is_deleted: 1 },
        { where: { userId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // ===== 已删除数据列表 + 恢复 =====
  // 恢复题目
  public async restoreQuestion(id: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'questions',
        { is_deleted: 0 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除题目列表
  public async getDeletedQuestions(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10 } = params || {};
    try {
      const result = await app.mysql.select('questions', {
        where: { is_deleted: 1 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      const count = await app.mysql.count('questions', { is_deleted: 1 });
      return { result, total: count };
    } catch (err) {
      return null;
    }
  }
  // 恢复试卷
  public async restorePaper(paperId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'examination_paper',
        { is_deleted: 0 },
        { where: { paper_id: paperId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除试卷列表
  public async getDeletedPapers(params) {
    const { app } = this;
    const { currentPage = 1, pageSize = 10 } = params || {};
    try {
      const result = await app.mysql.select('examination_paper', {
        where: { is_deleted: 1 },
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      const count = await app.mysql.count('examination_paper', {
        is_deleted: 1,
      });
      return { result, total: count };
    } catch (err) {
      return null;
    }
  }
  // 恢复用户
  public async restoreUser(userId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'user',
        { is_deleted: 0 },
        { where: { userId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除用户列表
  public async getDeletedUsers() {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT * FROM user WHERE is_deleted = 1',
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
