import { Service } from 'egg';

export default class paper extends Service {
  // 组卷
  public async getPaperQuestions(params) {
    const { app } = this;
    try {
      const { ids, ...paperData } = params;
      // 插入试卷（不再存逗号分隔的 ids）
      const result: any = await app.mysql.insert('examination_paper', paperData);
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
    const { author, type } = params;
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
      // 我的试卷（参数化查询，避免 SQL 注入）
      const result: any = await app.mysql.query(
        'select * from examination_paper where author = ? and is_deleted = 0 order by paper_id desc',
        [ author ],
      );

      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取组卷详情
  public async getPaperQuestionsDetail(params) {
    const { app } = this;
    const { paperId, forTest } = params;

    try {
      const result: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
        is_deleted: 0,
      });
      // 通过关联表按顺序查题目
      const questions: any = await app.mysql.query(
        'SELECT q.* FROM paper_question pq ' +
          'JOIN questions q ON pq.question_id = q.id ' +
          'WHERE pq.paper_id = ? AND q.is_deleted = 0 ORDER BY pq.sort_order',
        [ paperId ],
      );
      // 在线做题模式下不返回答案，防止提前泄露
      if (forTest) {
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
  // 修改试卷公开/私密权限（仅作者本人可改）
  public async updatePaperPurview(params) {
    const { app } = this;
    const { paperId, purview, chkState, owner } = params;
    try {
      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
      });
      // 只能修改自己的试卷
      if (!paper || paper.author !== owner) return null;
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
}
