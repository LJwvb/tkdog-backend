import { Service } from 'egg';

export default class paper extends Service {
  // 组卷
  public async getPaperQuestions(params) {
    const { app } = this;
    try {
      const { ids, userId, ...paperData } = params;
      // 插入试卷（不再存逗号分隔的 ids）
      const result: any = await app.mysql.insert('examination_paper', {
        ...paperData,
        // 作者归属用唯一 user_id（不可变）；管理员创建（无 userId）时为 NULL
        user_id: userId ?? null,
      });
      const paperId = result.insertId;
      // 插入试卷-题目关联
      const idList = String(ids)
        .split(',')
        .map(x => x.trim())
        .filter(x => x !== '');
      for (let i = 0; i < idList.length; i++) {
        await app.mysql.insert('paper_question', {
          paper_id: paperId,
          question_id: Number(idList[i]),
          sort_order: i,
        });
      }
      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取组卷列表
  public async getPaperQuestionsList(params) {
    const { app } = this;
    const { type, userId } = params;
    try {
      if (type === 'all') {
        // 获取所有组卷（未删除）
        const result: any = await app.mysql.query(
          'select * from examination_paper where is_deleted = 0 order by paper_id desc',
        );
        const purviewPaper = result.filter((item: any) => item.purview === -1); // 官方的试卷
        const personPaper = result.filter(
          (item: any) => item.purview === 1 && item?.chkState === 1,
        ); // 个人审核通过公开的试卷

        return {
          purviewPaper,
          personPaper,
        };
      }
      // 我的试卷（按唯一 user_id，避免用户名修改后查不到自己的试卷）
      const result: any = await app.mysql.query(
        'select * from examination_paper where user_id = ? and is_deleted = 0 order by paper_id desc',
        [ userId ],
      );

      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取组卷详情
  // 权限规则：
  //   - forTest=true（在线做题）→ 永远隐藏答案
  //   - 游客（未登录且非管理员）→ 一律隐藏答案，含公开试卷
  //   - 公开试卷（官方 -1 / 个人公开且审核通过 1+chkState=1）→ 已登录用户均可查看答案
  //   - 私有试卷（3）→ 仅作者本人或管理员可查看（按唯一 user_id 判断，避免用户名修改后错乱）
  // 说明：该接口为公开接口，答案是否下发必须在服务端判定，
  //       不能信任前端传入的 forTest 参数，否则任意人可绕过前端拿到全部答案。
  public async getPaperQuestionsDetail(params) {
    const { app } = this;
    const { paperId, forTest, userId, isAdmin } = params;

    try {
      const result: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
        is_deleted: 0,
      });
      if (!result) return null;
      // 通过关联表按顺序查题目
      const questions: any = await app.mysql.query(
        'SELECT q.* FROM paper_question pq ' +
          'JOIN questions q ON pq.question_id = q.id ' +
          'WHERE pq.paper_id = ? AND q.is_deleted = 0 ORDER BY pq.sort_order',
        [ paperId ],
      );
      // 试卷是否公开：官方试卷（-1），或个人公开且审核通过（1 + chkState=1）
      const isPublicPaper =
        Number(result.purview) === -1 ||
        (Number(result.purview) === 1 && Number(result.chkState) === 1);
      // 是否允许返回答案：
      //   管理员可见全部；游客一律隐藏；
      //   公开试卷已登录用户均可见；私有试卷仅作者本人可见（按 user_id）
      let canSeeAnswer = false;
      if (isAdmin) {
        canSeeAnswer = true;
      } else if (userId) {
        canSeeAnswer = isPublicPaper || Number(result.user_id) === userId;
      }
      if (forTest || !canSeeAnswer) {
        questions.forEach((q: any) => {
          delete q.answer;
        });
      }

      return {
        paperInfo: result,
        questions,
      };
    } catch (err) {
      return null;
    }
  }
  // 修改试卷公开/私密权限（仅作者本人可改，按 user_id 判断）
  public async updatePaperPurview(params) {
    const { app } = this;
    const { paperId, purview, chkState, ownerId } = params;
    try {
      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
      });
      // 只能修改自己的试卷（作者归属用唯一 user_id）
      if (!paper || Number(paper.user_id) !== ownerId) return null;
      const result = await app.mysql.update(
        'examination_paper',
        { purview, chkState },
        { where: { paper_id: paperId } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 编辑自己的试卷题目（增删题目；公开试卷需重新审核，私有无需；按 user_id 判断作者）
  public async updatePaperQuestions(params) {
    const { app } = this;
    const { paperId, ids, ownerId } = params;
    try {
      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
      });
      if (!paper || Number(paper.user_id) !== ownerId) return null;
      // 重建试卷-题目关联
      await app.mysql.delete('paper_question', { paper_id: paperId });
      const idList = String(ids)
        .split(',')
        .map((x: string) => x.trim())
        .filter((x: string) => x !== '');
      for (let i = 0; i < idList.length; i++) {
        await app.mysql.insert('paper_question', {
          paper_id: paperId,
          question_id: Number(idList[i]),
          sort_order: i,
        });
      }
      // 公开(1)重新审核；私有(3)/官方(-1)无需审核
      const chkState = Number(paper.purview) === 1 ? 0 : 1;
      await app.mysql.update(
        'examination_paper',
        { chkState },
        { where: { paper_id: paperId } },
      );
      return { chkState };
    } catch (err) {
      return null;
    }
  }
}
