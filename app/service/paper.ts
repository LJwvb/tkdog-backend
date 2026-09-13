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
    const { type, userId, keyword } = params;
    // 分页参数：默认第 1 页每页 12 条，单页上限 50 防止一次拉太多
    const page = Math.max(1, Number(params.currentPage) || 1);
    const size = Math.min(50, Math.max(1, Number(params.pageSize) || 12));
    const offset = (page - 1) * size;
    // 关键词搜索（标题或标签），走 SQL 过滤而不是前端过滤已加载的那几页
    const kw = typeof keyword === 'string' ? keyword.trim() : '';
    const kwCond = kw ? ' AND (paper_title LIKE ? OR paper_tags LIKE ?)' : '';
    const kwParams = kw ? [ `%${kw}%`, `%${kw}%` ] : [];
    try {
      if (type === 'all') {
        // 两个分组各自分页，替代原「全表查询 + 前端一次性渲染」
        // purviewPaper：官方试卷（purview = -1）
        // personPaper：个人公开且审核通过（purview = 1 且 chkState = 1）
        const groups = [
          { key: 'purviewPaper', where: 'purview = -1' },
          { key: 'personPaper', where: 'purview = 1 AND chkState = 1' },
        ];
        const result: any = {};
        for (const g of groups) {
          const countRows: any = await app.mysql.query(
            `SELECT COUNT(*) AS total FROM examination_paper WHERE is_deleted = 0 AND ${g.where}${kwCond}`,
            kwParams,
          );
          const total = Number(countRows?.[0]?.total) || 0;
          const list: any = await app.mysql.query(
            `SELECT * FROM examination_paper WHERE is_deleted = 0 AND ${g.where}${kwCond} ` +
              'ORDER BY paper_id DESC LIMIT ? OFFSET ?',
            [ ...kwParams, size, offset ],
          );
          result[g.key] = { list, total, currentPage: page, pageSize: size };
        }
        return result;
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
      // 重建试卷-题目关联 + 更新审核状态，事务化：中途失败全部回滚，避免题目被清空但审核状态未更新
      const conn = await app.mysql.beginTransaction();
      try {
        await conn.delete('paper_question', { paper_id: paperId });
        const idList = String(ids)
          .split(',')
          .map((x: string) => x.trim())
          .filter((x: string) => x !== '');
        // 校验题目有效性：只保留存在且未删除的题目，避免试卷引用悬空题目
        const validSet = new Set<number>();
        if (idList.length) {
          const validRows: any = await conn.query(
            `SELECT id FROM questions WHERE id IN (${idList.map(() => '?').join(',')}) AND is_deleted = 0`,
            idList,
          );
          validRows.forEach((r: any) => validSet.add(Number(r.id)));
        }
        const finalIds = idList.filter((x: string) => validSet.has(Number(x)));
        for (let i = 0; i < finalIds.length; i++) {
          await conn.insert('paper_question', {
            paper_id: paperId,
            question_id: Number(finalIds[i]),
            sort_order: i,
          });
        }
        // 公开(1)重新审核；私有(3)/官方(-1)无需审核
        const chkState = Number(paper.purview) === 1 ? 0 : 1;
        await conn.update(
          'examination_paper',
          { chkState },
          { where: { paper_id: paperId } },
        );
        await conn.commit();
        return { chkState };
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    } catch (err) {
      return null;
    }
  }
}
