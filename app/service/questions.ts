import { Service } from 'egg';
import { compareTwoStrings } from 'string-similarity';
import { getSubjectName, getCatalogName, getNowFormatDate } from '../utils';

// 批量导入：规范化客观题答案字母（A,C -> AC，去分隔符、转大写）
function importNormalizeAnswer(ans: unknown): string {
  if (ans == null) return '';
  if (Array.isArray(ans)) {
    return ans
      .map(x => String(x).trim())
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .replace(/[\s,，、;；]/g, '');
  }
  return String(ans)
    .trim()
    .toUpperCase()
    .replace(/[\s,，、;；]/g, '');
}

// 批量导入：判断题答案语义归一
function importJudgement(ans: unknown): string {
  const t = String(ans ?? '').trim().toLowerCase();
  if (/^(对|正确|√|✓|✔|是|真|true|t|yes|y|1|right|r|ok)$/.test(t)) return '正确';
  if (/^(错|错误|×|✗|✘|否|假|false|f|no|n|0|wrong|w)$/.test(t)) return '错误';
  return String(ans ?? '').trim();
}

interface IQuestion {
  type?: 'all'; // all:全部
  currentPage: number; // 当前页
  pageSize: number; // 每页条数
  catalogID: number; // 章节ID
  subjectID?: number; // 科目ID
  refresh?: boolean; // 是否刷新
  ids?: string; // 题目ID
}

interface IUploadQuestions {
  subjectID: number; // 科目ID
  catalogID: number; // 章节ID
  question: string; // 题干
  answer: string; // 答案
  addDate: string; // 添加时间
  tags: string; // 标签
  questionType: 0 | 1 | 2 | 3 | 4; // 题目类型 0: '单选题' 1: '多选题' 2: '判断题' 3: '填空题'4: '简答题'
  number?: number; // 试题编号
  difficulty: 0 | 1 | 2; // 难度 0:'简单'1:'中等'2:'困难'
  chkState?: 0 | 1 | 2; // 审核状态 0:未审核 1:审核通过 2:审核不通过
  chkRemarks?: string; // 审核备注
  creator: string; // 创建人（用户名，展示用）
  creator_id?: number; // 创建人 user.userId（权限/归属判断用）
  userId?: number; // 上传者 userId（用于关联表）
}

export default class questions extends Service {
  // 获取题目
  public async getQuestions(params: IQuestion) {
    const { app } = this;
    const {
      type,
      catalogID: catalogIDParams,
      subjectID: subjectIDParams,
      ids,
      pageSize = 10,
      currentPage,
    } = params;
    try {
      // const allSubjectList: any = [];
      const userSubjectList: any = [];
      const homeSubjectList: any = [];

      const subjectIdList: any = [];
      const subjectNameList: any = [];
      const catalogIdList: any = [];
      const catalogNameList: any = [];

      if (type === 'all') {
        const result = await app.mysql.select('questions', {
          where: {
            subjectID: subjectIDParams,
            is_deleted: 0,
          },
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
        });
        const total = await app.mysql.count('questions', {
          subjectID: subjectIDParams,
          is_deleted: 0,
        });
        // catalogID 语义：0=最新（默认） 1=热门（浏览数超阈值自动提升）
        // 一次性提升热门题（浏览数超阈值），避免逐条 UPDATE
        await app.mysql.query(
          'UPDATE questions SET catalogID = 1 WHERE browses_num > 10 AND catalogID = 0 AND is_deleted = 0',
        );

        return {
          result,
          total,
        };
      }

      if (type === 'home') {
        const result: any = await app.mysql.query(
          'select * from questions where catalogID = ? and subjectID = ? and chkState = 1 and is_deleted = 0 order by rand() limit ? offset ?',
          [ catalogIDParams, subjectIDParams, pageSize, (currentPage - 1) * pageSize ],
        );
        result.forEach((item: any) => {
          item.tags = item?.tags?.split(',');
          homeSubjectList.push(item);
        });

        const chkStateQuestion: any = await app.mysql.select('questions', {
          where: {
            chkState: 1,
            is_deleted: 0,
          },
        });
        chkStateQuestion.forEach((item: any) => {
          if (subjectIdList.indexOf(item.subjectID) === -1) {
            subjectIdList.push(item.subjectID);
          }
          if (catalogIdList.indexOf(item.catalogID) === -1) {
            catalogIdList.push(item.catalogID);
          }
        });
        subjectIdList
          .sort((a: any, b: any) => a - b)
          .forEach((subjectID: any) => {
            subjectNameList.push({
              subjectID,
              subjectName: getSubjectName(subjectID),
            });
          });
        catalogIdList
          .sort((a: any, b: any) => a - b)
          .forEach((catalogID: any) => {
            catalogNameList.push({
              catalogID,
              catalogName: getCatalogName(catalogID),
            });
          });

        return {
          result: homeSubjectList,
          subjectNameList,
          catalogNameList,
        };
      }
      if (type === 'user') {
        const questionIds: any =
          ids && ids.split(',').filter((x: string) => x !== '');
        // 空ids 直接返回空结果，避免 `in ()` SQL 语法错误
        if (!questionIds || questionIds.length === 0) {
          return { result: [], total: 0 };
        }
        // 参数化查询：egg-mysql 对 `in (?)` 传数组会自动展开占位符，避免 SQL 注入
        const result: any = await app.mysql.query(
          'select * from questions where id in (?) and chkState = 1 and is_deleted = 0 limit ? offset ?',
          [ questionIds, pageSize, (currentPage - 1) * pageSize ],
        );
        const total = await app.mysql.count('questions', {
          id: questionIds,
          is_deleted: 0,
        });
        result.forEach((item: any) => {
          item.tags = item?.tags?.split(',');
          userSubjectList.push(item);
        });
        return {
          result: userSubjectList,
          total,
        };
      }
    } catch (err) {
      return null;
    }
  }
  // 题目详情
  public async getQuestionDetail(params) {
    const { app } = this;
    const { id } = params;
    try {
      const result = await app.mysql.get('questions', { id, is_deleted: 0 });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 题目是否审核通过（未审核/不通过均返回 false，用于拦截点赞/评论/浏览等操作）
  public async isApproved(id): Promise<boolean> {
    const question: any = await this.getQuestionDetail({ id });
    return Boolean(question && Number(question.chkState) === 1);
  }

  // 点赞题目
  public async likeQuestions(params) {
    const { app } = this;
    const { id, userId } = params;
    try {
      // 原子自增，避免并发下"先查后写"丢计数
      const result: any = await app.mysql.query(
        'UPDATE questions SET likes_num = likes_num + 1 WHERE id = ?',
        [ id ],
      );
      // 记录点赞关系（关联表，直接使用 userId）
      await app.mysql.insert('user_like_question', {
        user_id: userId,
        question_id: id,
      });

      return result;
    } catch (err) {
      return null;
    }
  }
  // 取消点赞题目
  public async cancelLikeQuestions(params) {
    const { app } = this;
    const { id, userId } = params;
    try {
      // 原子自减，并用 GREATEST 保证不出现负数
      const result: any = await app.mysql.query(
        'UPDATE questions SET likes_num = GREATEST(likes_num - 1, 0) WHERE id = ?',
        [ id ],
      );
      // 删除点赞关系（关联表，直接使用 userId）
      await app.mysql.delete('user_like_question', {
        user_id: userId,
        question_id: id,
      });

      return result;
    } catch (err) {
      return null;
    }
  }
  // 浏览数（原子自增）
  public async addBrowsesNum(params) {
    const { app } = this;
    const { id } = params;
    try {
      const result: any = await app.mysql.query(
        'UPDATE questions SET browses_num = browses_num + 1 WHERE id = ?',
        [ id ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 上传题目
  public async uploadQuestions(params: IUploadQuestions) {
    const { app } = this;
    try {
      const { userId, ...questionData } = params;
      const result: any = await app.mysql.insert('questions', questionData);
      // 记录上传关系（关联表，直接使用 userId）
      await app.mysql.insert('user_upload_question', {
        user_id: userId,
        question_id: result.insertId,
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 编辑题目（管理员或本人；本人编辑已审核通过的题需重新审核）
  public async updateQuestion(params) {
    const { app } = this;
    const { id, needReview, ...updateData } = params;
    try {
      if (needReview) {
        const question: any = await app.mysql.get('questions', { id });
        // 审核通过(1)或审核不通过(2)的题，编辑后都重新进入审核(0)
        if (question && Number(question.chkState) !== 0) {
          updateData.chkState = 0;
        }
      }
      const result = await app.mysql.update('questions', updateData, {
        where: { id },
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 查询题目上传关系（用于判断是否本人上传）
  public async getQuestionUpload(questionId: number) {
    return await this.app.mysql.get('user_upload_question', {
      question_id: questionId,
    });
  }
  // 批量导入题目
  public async importQuestions(params) {
    const { app } = this;
    const { userId, creator, creator_id, isAdmin, questions } = params;
    try {
      if (!Array.isArray(questions) || questions.length === 0) {
        return { imported: 0 };
      }
      let imported = 0;
      for (const raw of questions) {
        const q: any = this.normalizeImportItem(raw);
        if (!q) continue;
        const insertData = {
          subjectID: q.subjectID,
          questionType: q.questionType,
          difficulty: q.difficulty,
          question: q.question,
          answer: q.answer,
          questionDetail: q.questionDetail,
          tags: q.tags,
          creator,
          creator_id: creator_id ?? null,
          addDate: getNowFormatDate(),
          chkState: isAdmin ? 1 : 0,
          catalogID: 0,
          browses_num: 0,
          likes_num: 0,
        };
        const result: any = await app.mysql.insert('questions', insertData);
        if (userId) {
          await app.mysql.insert('user_upload_question', {
            user_id: userId,
            question_id: result.insertId,
          });
        }
        imported++;
      }
      return { imported };
    } catch (err) {
      return null;
    }
  }
  // 规范化单条导入数据，非法项返回 null
  private normalizeImportItem(raw: any): any | null {
    if (!raw || !raw.question || raw.questionType == null || raw.answer == null) {
      return null;
    }
    const qt = Number(raw.questionType);
    const difficultyNum = Number(raw.difficulty);
    const subjectID = Number(raw.subjectID);
    if (![ 0, 1, 2, 3 ].includes(qt)) return null;

    let answer = '';
    let questionDetail = '';
    if (qt === 0 || qt === 1) {
      const ans = importNormalizeAnswer(raw.answer);
      if (!ans) return null;
      const opts = (Array.isArray(raw.options) ? raw.options : []).map(o => ({
        code: String(o?.code ?? '').trim(),
        value: String(o?.value ?? '').trim(),
      }));
      answer = `正确选项：${ans}`;
      questionDetail = JSON.stringify(opts);
    } else if (qt === 2) {
      answer = importJudgement(raw.answer);
      questionDetail = JSON.stringify([
        { code: '正确', value: '' },
        { code: '错误', value: '' },
      ]);
    } else {
      answer = String(raw.answer).trim();
      questionDetail = raw.questionDetail ? String(raw.questionDetail) : '';
    }

    return {
      subjectID: Number.isNaN(subjectID) ? 12 : subjectID,
      questionType: qt,
      difficulty: Number.isNaN(difficultyNum) ? 0 : difficultyNum,
      question: String(raw.question).trim(),
      answer,
      questionDetail,
      tags: raw.tags ? String(raw.tags) : '',
    };
  }
  // 智能组卷：按科目/难度/题型随机抽取已审核题目
  public async randomPickQuestions(params) {
    const { app } = this;
    const { subjectID, difficulty, counts } = params || {};
    try {
      const spec: Record<number, number> = {
        0: Number(counts?.single) || 0,
        1: Number(counts?.multiple) || 0,
        2: Number(counts?.judge) || 0,
        3: Number(counts?.essay) || 0,
      };
      const picked: any[] = [];
      for (const qt of [ 0, 1, 2, 3 ]) {
        // 后端同样限制单题型抽题上限，避免超大数据集
        const n = Math.min(50, Math.max(0, Number(spec[qt]) || 0));
        if (!n) continue;
        const where: string[] = [ 'chkState = 1', 'is_deleted = 0', 'questionType = ?' ];
        const values: any[] = [ String(qt) ];
        if (subjectID !== undefined && subjectID !== null && subjectID !== '') {
          where.push('subjectID = ?');
          values.push(subjectID);
        }
        if (difficulty !== undefined && difficulty !== null && difficulty !== '') {
          where.push('difficulty = ?');
          values.push(difficulty);
        }
        const rows: any = await app.mysql.query(
          `select * from questions where ${where.join(' and ')} order by rand() limit ${Number(n)}`,
          values,
        );
        picked.push(...rows);
      }
      return picked;
    } catch (err) {
      return null;
    }
  }
  // 每日一题
  public async getDailyQuestions() {
    // 从所有已审核的题目中随机获取1道题目
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'select * from questions where chkState = 1 and is_deleted = 0 order by rand() limit 1',
      );
      return result;
    } catch (err) {
      return null;
    }
  }

  // 相似题目（结构化特征加权 + string-similarity 题干 Dice 系数综合评分）
  public async getSimilarQuestions(params) {
    const { app } = this;
    const { id } = params;
    try {
      const questionId = Number(id);
      // 当前题目
      const current: any = await app.mysql.get('questions', {
        id: questionId,
      });
      if (!current) return [];

      // 候选集：同科目或标签/关键词可能相关的已审核题目（缩小扫描范围）
      const all: any = await app.mysql.query(
        'select * from questions where chkState = 1 and is_deleted = 0',
      );

      // 当前题目的标签集合 + 技术关键词集合
      const currentTags = new Set(
        String(current.tags || '')
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean),
      );
      const currentKeywords = this.extractKeywords(current.question);

      const scored: any = [];
      for (const item of all) {
        if (item.id === questionId) continue; // 跳过自己

        let score = 0;
        // 同科目：权重最高
        if (item.subjectID === current.subjectID) score += 3;
        // 同题型
        if (item.questionType === current.questionType) score += 2;
        // 同难度
        if (item.difficulty === current.difficulty) score += 1;
        // 标签交集
        const itemTags = new Set(
          String(item.tags || '')
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean),
        );
        let tagOverlap = 0;
        currentTags.forEach(t => {
          if (itemTags.has(t)) tagOverlap++;
        });
        score += tagOverlap * 2;
        // 题干技术关键词重叠
        const itemKeywords = this.extractKeywords(item.question);
        let kwOverlap = 0;
        currentKeywords.forEach(k => {
          if (itemKeywords.includes(k)) kwOverlap++;
        });
        score += kwOverlap;
        // 题干文本相似度：string-similarity（Dice 系数，0~1），权重 4
        // 用于捕捉"换了说法但本质相同"的重复题
        const dice = compareTwoStrings(
          String(current.question || ''),
          String(item.question || ''),
        );
        score += dice * 4;

        if (score > 0) {
          scored.push({ item, score });
        }
      }

      // 按得分降序，取前 5 条
      scored.sort((a: any, b: any) => b.score - a.score);
      return scored.slice(0, 5).map((s: any) => ({
        id: s.item.id,
        subjectID: s.item.subjectID,
        catalogID: s.item.catalogID,
        question: s.item.question,
        difficulty: s.item.difficulty,
        questionType: s.item.questionType,
      }));
    } catch (err) {
      return null;
    }
  }

  // 提取题干中的技术关键词（英文/数字词，过滤常见无意义词）
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    const stopWords = new Set([
      'the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'is', 'are',
      'on', 'at', 'for', 'with', 'as', 'by', 'this', 'that',
    ]);
    const matches = text.match(/[a-zA-Z][a-zA-Z0-9.+#-]*/g) || [];
    const keywords = matches
      .map((w: string) => w.toLowerCase())
      .filter((w: string) => w.length >= 2 && !stopWords.has(w));
    return [ ...new Set(keywords) ];
  }
  // 搜索题目（参数化查询，避免 SQL 注入）
  public async searchQuestions(params) {
    const { app } = this;
    const {
      keyword,
      questionType,
      difficulty,
      subjectID,
      tags,
      currentPage,
      pageSize = 10,
    } = params;
    try {
      const hasKeyword =
        keyword !== undefined && keyword !== null && String(keyword).trim() !== '';
      const hasType =
        questionType !== undefined && questionType !== null && questionType !== '';
      const hasDifficulty =
        difficulty !== undefined && difficulty !== null && difficulty !== '';
      const hasSubject =
        subjectID !== undefined && subjectID !== null && subjectID !== '';
      const hasTags =
        tags !== undefined && tags !== null && String(tags).trim() !== '';

      const where: string[] = [ 'chkState = 1', 'is_deleted = 0' ];
      const values: any[] = [];
      if (hasKeyword) {
        where.push('question like ?');
        values.push(`%${String(keyword).trim()}%`);
      }
      if (hasType) {
        where.push('questionType = ?');
        values.push(questionType);
      }
      if (hasDifficulty) {
        where.push('difficulty = ?');
        values.push(difficulty);
      }
      if (hasSubject) {
        where.push('subjectID = ?');
        values.push(Number(subjectID));
      }
      if (hasTags) {
        where.push('tags like ?');
        values.push(`%${String(tags).trim()}%`);
      }
      const whereSql = where.join(' and ');
      const page = Number(pageSize) || 10;
      const offset = (Number(currentPage) - 1) * page;

      const result = await app.mysql.query(
        `select * from questions where ${whereSql} limit ${page} offset ${offset}`,
        values,
      );
      const totalRows = await app.mysql.query(
        `select count(*) as count from questions where ${whereSql}`,
        values,
      );
      return {
        result,
        total: totalRows[0].count,
      };
    } catch (err) {
      return null;
    }
  }
  // 标签统计（从题目逗号分隔 tags 字段聚合）
  public async getTagStats() {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        "SELECT tags FROM questions WHERE tags IS NOT NULL AND tags != '' AND is_deleted = 0",
      );
      const map = new Map<string, number>();
      rows.forEach((r: any) => {
        String(r.tags)
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
          .forEach((t: string) => {
            map.set(t, (map.get(t) || 0) + 1);
          });
      });
      return Array.from(map.entries())
        .map(([ tag, count ]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      return null;
    }
  }
  // 重命名标签：把某标签在所有题目里替换为新标签
  public async renameTag(oldTag: string, newTag: string) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT id, tags FROM questions WHERE is_deleted = 0',
      );
      let updated = 0;
      for (const r of rows) {
        const tags = String(r.tags || '')
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean);
        if (tags.includes(oldTag)) {
          const newTags = tags.map(t => (t === oldTag ? newTag : t)).join(',');
          await app.mysql.update(
            'questions',
            { tags: newTags },
            { where: { id: r.id } },
          );
          updated++;
        }
      }
      return { updated };
    } catch (err) {
      return null;
    }
  }
  // 删除标签：从所有题目中移除该标签
  public async deleteTag(tag: string) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT id, tags FROM questions WHERE is_deleted = 0',
      );
      let updated = 0;
      for (const r of rows) {
        const tags = String(r.tags || '')
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean);
        if (tags.includes(tag)) {
          const newTags = tags.filter((t: string) => t !== tag).join(',');
          await app.mysql.update(
            'questions',
            { tags: newTags },
            { where: { id: r.id } },
          );
          updated++;
        }
      }
      return { updated };
    } catch (err) {
      return null;
    }
  }
}
