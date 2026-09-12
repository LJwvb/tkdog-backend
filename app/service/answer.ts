/* eslint-disable comma-dangle */
import { Service } from 'egg';
import { getNowFormatDate, getSubjectName } from '../utils';

interface IAnswerItem {
  questionId: number | string;
  userAnswer: string;
}

interface ISubmitPaperParams {
  userId: number | undefined;
  paperId: number | string;
  answers: IAnswerItem[];
}

// 去除 HTML 标签，保留纯文本
function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ldquo;|&rdquo;|&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// 规范化答案：去空白、去分隔符、转大写，多选排序后拼接
function normalizeAnswer(answer: unknown): string {
  if (answer == null) return '';
  if (Array.isArray(answer)) {
    return answer
      .map(x => String(x).trim())
      .filter(Boolean)
      .sort()
      .join('')
      .toUpperCase();
  }
  return String(answer)
    .trim()
    .toUpperCase()
    .replace(/[\s,，、;；]/g, '');
}

// 判断题语义归一：把「对/正确/√/true…」「错/错误/×/false…」统一映射为 对/错
function normalizeJudgement(text: string): '对' | '错' | null {
  const raw = stripHtml(text);
  if (!raw) return null;
  const t = raw
    .replace(/^[\s。.!！、,，:：;；]+|[\s。.!！、,，:：;；]+$/g, '')
    .toLowerCase();
  if (!t) return null;
  if (/^(对|正确|√|✓|✔|是|真|true|t|yes|y|1|right|r|ok)$/.test(t)) return '对';
  if (/^(错|错误|×|✗|✘|否|假|false|f|no|n|0|wrong|w)$/.test(t)) return '错';
  // 长句包含式：优先判断否定，避免「不对」被识别成「对」
  const hasNeg = /错|错误|×|✗|false|wrong|否|不/.test(t);
  const hasPos = /对|正确|√|✓|true|right|是/.test(t);
  if (hasPos && !hasNeg) return '对';
  if (hasNeg && !hasPos) return '错';
  return null;
}

// 提取答案中的选项字母（A-Z）
function extractLetters(text: string | undefined): string {
  return (stripHtml(text).toUpperCase().match(/[A-Z]/g) || []).join('');
}

// 字母去重排序（多选顺序无关）
function sortLetters(s: string): string {
  return [ ...new Set(s.split('').filter(c => /[A-Z]/.test(c))) ].sort().join('');
}

// 用户填了选项内容文本时，反查其对应的选项字母
function matchOptionValue(
  userAnswer: string,
  questionDetail: string | undefined,
): string | null {
  try {
    const opts = JSON.parse(questionDetail || '[]');
    if (!Array.isArray(opts)) return null;
    const trimmed = String(userAnswer).trim();
    for (const o of opts) {
      const code = String(o?.code ?? '').trim();
      const value = String(o?.value ?? '').trim();
      if (trimmed && (trimmed === code || trimmed === value)) return code;
    }
  } catch {
    // ignore
  }
  return null;
}

// 提取客观题（单选/多选/判断）的正确答案
function extractCorrectAnswer(
  questionType: number,
  answerHtml: string | undefined,
): string {
  const text = stripHtml(answerHtml);
  const qt = Number(questionType);

  // 判断题：语义归一到「对 / 错」
  if (qt === 2) {
    const j = normalizeJudgement(text);
    if (j) return j;
    return text;
  }

  // 单选题：常见「正确选项：B：...」或「答案为B」
  if (qt === 0) {
    let m = text.match(/正确选项\s*[:：]\s*([A-Za-z])/);
    if (m) return m[1].toUpperCase();
    m = text.match(/答案(?:为|是)?\s*[:：]?\s*([A-Za-z])/);
    if (m) return m[1].toUpperCase();
    return '';
  }

  // 多选题：常见「正确选项：A、C：...」
  if (qt === 1) {
    let m = text.match(/正确选项\s*[:：]\s*([A-Za-z、,，\s]+?)(?:[:：]|$|\n)/);
    if (m) {
      const letters = m[1].match(/[A-Za-z]/g);
      if (letters) return letters.join('').toUpperCase();
    }
    m = text.match(/答案(?:为|是)?\s*[:：]\s*([A-Za-z、,，\s]+)/);
    if (m) {
      const letters = m[1].match(/[A-Za-z]/g);
      if (letters) return letters.join('').toUpperCase();
    }
    return '';
  }

  return '';
}

// 客观题宽松判定：判断语义一致 / 单选字母一致 / 多选字母集合一致
function isObjectiveCorrect(
  questionType: number,
  userAnswer: string,
  correct: string,
  questionDetail: string | undefined,
): boolean {
  if (questionType === 2) {
    const cj = normalizeJudgement(correct);
    const uj = normalizeJudgement(userAnswer);
    if (cj && uj) return cj === uj;
    // 无法语义识别时回退到文本比较
    return normalizeAnswer(userAnswer) === normalizeAnswer(correct);
  }

  const std = extractLetters(correct);
  let user = extractLetters(userAnswer);
  if (!user) {
    const code = matchOptionValue(userAnswer, questionDetail);
    if (code) user = code.toUpperCase();
  }
  if (!std) return false;

  if (questionType === 0) {
    // 单选：取用户填的首个字母与标准答案比较
    return user.charAt(0) === std.charAt(0);
  }
  // 多选：字母集合相等（顺序无关）
  return sortLetters(user) === sortLetters(std);
}

// 难度权重：简单(0)=1、中等(1)=2、困难(2)=3，其余按简单处理
function difficultyWeight(difficulty: number): number {
  if (difficulty === 2) return 3;
  if (difficulty === 1) return 2;
  return 1;
}

// 按难度权重动态分配每题满分（整数、总和=100，最大余数法）
function computeQuestionScores(questions: any[]): number[] {
  const weights = questions.map(q => difficultyWeight(Number(q.difficulty)));
  const totalWeight =
    weights.reduce((s, w) => s + w, 0) || questions.length || 1;
  const ideals = weights.map(w => (100 * w) / totalWeight);
  const bases = ideals.map(v => Math.floor(v));
  const remainder = 100 - bases.reduce((s, b) => s + b, 0);
  // 余数按小数部分从大到小分配，保证每题为整数且总和恒等于 100
  const order = ideals
    .map((v, i) => ({ i, frac: v - bases[i] }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    bases[order[k].i] += 1;
  }
  return bases;
}

export default class answer extends Service {
  // 提交整卷作答并自动判分
  public async submitPaper(params: ISubmitPaperParams) {
    const { app } = this;
    const { userId, paperId, answers } = params;
    try {
      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: paperId,
      });
      if (!paper) return null;

      const questions: any = await app.mysql.query(
        'SELECT q.* FROM paper_question pq ' +
          'JOIN questions q ON pq.question_id = q.id ' +
          'WHERE pq.paper_id = ? AND q.is_deleted = 0 ORDER BY pq.sort_order',
        [ paperId ],
      );
      if (!questions || questions.length === 0) return null;

      const answerMap: Record<string, string> = {};
      (answers || []).forEach(a => {
        if (a && a.questionId != null) {
          answerMap[String(a.questionId)] = a.userAnswer ?? '';
        }
      });

      let correctNum = 0;
      let wrongNum = 0;
      let subjectiveNum = 0;
      const detail: any[] = [];
      // 满分 100，按难度权重动态分配每题满分（整数、总和=100）
      const questionNum = questions.length;
      const questionScores = computeQuestionScores(questions);

      questions.forEach((q: any, index: number) => {
        const qt = Number(q.questionType);
        const userAnswer = answerMap[String(q.id)] ?? '';
        const maxScore = questionScores[index];
        let isCorrect: number | null = null;
        let qScore: number | null = null; // 该题得分

        if (qt === 0 || qt === 1 || qt === 2) {
          const correct = extractCorrectAnswer(qt, q.answer);
          const normalizedCorrect = normalizeAnswer(correct);
          if (!normalizedCorrect) {
            // 无法提取正确答案时按主观题处理，不误判
            subjectiveNum++;
            isCorrect = null;
          } else {
            const ok = isObjectiveCorrect(qt, userAnswer, correct, q.questionDetail);
            isCorrect = ok ? 1 : 0;
            qScore = ok ? maxScore : 0;
            if (ok) {
              correctNum++;
            } else {
              wrongNum++;
            }
          }
        } else {
          // 简答/填空等主观题：全部交给 AI 批改（交卷后逐题评分并计入成绩）
          subjectiveNum++;
          isCorrect = null;
        }

        detail.push({
          questionId: q.id,
          questionType: qt,
          question: q.question,
          questionDetail: q.questionDetail,
          correctAnswer: q.answer,
          userAnswer,
          isCorrect,
          score: qScore,
          maxScore,
        });
      });

      // 客观题得分合计（整数）；主观题待 AI 批改后由 applyAiGrade 累加
      const score = detail.reduce((sum, d) => sum + (d.score || 0), 0);

      let recordId = 0;
      const conn = await app.mysql.beginTransaction();
      try {
        const recordRes: any = await conn.insert('paper_record', {
          user_id: userId,
          paper_id: paperId,
          score,
          question_num: questionNum,
          correct_num: correctNum,
          wrong_num: wrongNum,
          subjective_num: subjectiveNum,
          ctime: getNowFormatDate(),
        });
        recordId = recordRes.insertId;

        for (const d of detail) {
          await conn.insert('answer_record', {
            record_id: recordId,
            user_id: userId,
            paper_id: paperId,
            question_id: d.questionId,
            user_answer: d.userAnswer,
            is_correct: d.isCorrect,
            score: d.score,
            max_score: d.maxScore,
            ctime: getNowFormatDate(),
          });
        }

        // 客观题答对 +1 积分/题（落库），主观题答对后由 AI 批改时加分
        if (correctNum > 0) {
          await conn.query('UPDATE user SET integral = integral + ? WHERE userId = ?', [ correctNum, userId ]);
        }
        await conn.commit();
      } catch (err) {
        // 任一步失败回滚：避免半成品答题记录与积分错乱
        await conn.rollback();
        throw err;
      }

      return {
        recordId,
        score,
        questionNum,
        correctNum,
        wrongNum,
        subjectiveNum,
        detail,
      };
    } catch (err) {
      return null;
    }
  }

  // 根据 recordId 获取历史答题记录详情（只读，用于回看）
  public async getRecordDetail(recordId: number, userId?: number) {
    const { app } = this;
    try {
      const record: any = await app.mysql.get('paper_record', { id: recordId });
      if (!record) return null;
      // 越权校验：只能看自己的记录
      if (userId && Number(record.user_id) !== userId) return null;

      const paper: any = await app.mysql.get('examination_paper', {
        paper_id: record.paper_id,
      });
      if (!paper) return null;

      // 按试卷题目顺序查询
      const questions: any[] = (await app.mysql.query(
        'SELECT q.* FROM paper_question pq ' +
          'JOIN questions q ON pq.question_id = q.id ' +
          'WHERE pq.paper_id = ? ORDER BY pq.sort_order',
        [ record.paper_id ],
      )) as any[];

      // 查询该次答题的所有 answer_record
      const answers: any[] = (await app.mysql.select('answer_record', {
        where: { record_id: recordId },
      })) as any[];
      const answerMap: Record<string, any> = {};
      answers.forEach((a: any) => {
        answerMap[String(a.question_id)] = a;
      });

      const detail: any[] = questions.map((q: any) => {
        const a = answerMap[String(q.id)] || {};
        return {
          questionId: q.id,
          questionType: Number(q.questionType),
          question: q.question,
          questionDetail: q.questionDetail,
          correctAnswer: q.answer,
          userAnswer: a.user_answer ?? '',
          isCorrect: a.is_correct ?? null,
          score: a.score ?? null,
          maxScore: a.max_score ?? null,
          aiComment: a.ai_comment ?? '',
        };
      });

      return {
        paperInfo: paper,
        questions,
        result: {
          recordId,
          score: record.score,
          questionNum: questions.length,
          correctNum: record.correct_num,
          wrongNum: record.wrong_num,
          subjectiveNum: record.subjective_num,
          detail,
        },
      };
    } catch (err) {
      return null;
    }
  }

  // AI 判分落库：按该题满分把 AI 得分折算为整数得分，并重算整卷总分写回 paper_record
  public async applyAiGrade(
    recordId: number,
    questionId: number,
    aiScore: number,
  ) {
    const { app } = this;
    // 该题满分（submitPaper 时已按整数分配写入）
    const ar: any = await app.mysql.get('answer_record', {
      record_id: recordId,
      question_id: questionId,
    });
    const maxScore = Number(ar?.max_score) || 1;
    // AI 给 0-100 分，折算为本题整数得分
    const earned = Math.max(0, Math.min(maxScore, Math.round((aiScore / 100) * maxScore)));
    const passScore = Number((this.config as any)?.aiJudge?.passScore) || 60;
    const isCorrect = aiScore >= passScore;
    // 主观题首次判对时 +1 积分（避免重复加分）
    const wasCorrect = Number(ar?.is_correct) === 1;
    if (isCorrect && !wasCorrect && ar?.user_id) {
      await app.mysql.query('UPDATE user SET integral = integral + 1 WHERE userId = ?', [ ar.user_id ]);
    }

    await app.mysql.update(
      'answer_record',
      { is_correct: isCorrect ? 1 : 0, score: earned },
      { where: { record_id: recordId, question_id: questionId } },
    );

    const rows: any = await app.mysql.query(
      'SELECT ' +
        'COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END),0) AS correct_num, ' +
        'COALESCE(SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END),0) AS wrong_num, ' +
        'COALESCE(SUM(CASE WHEN is_correct IS NULL THEN 1 ELSE 0 END),0) AS subjective_num, ' +
        'COALESCE(SUM(score),0) AS total_score ' +
        'FROM answer_record WHERE record_id = ?',
      [ recordId ],
    );
    const r = rows[0] || {};
    const correctNum = Number(r.correct_num) || 0;
    const wrongNum = Number(r.wrong_num) || 0;
    const subjectiveNum = Number(r.subjective_num) || 0;
    const totalScore = Math.min(100, Number(r.total_score) || 0);
    await app.mysql.update(
      'paper_record',
      {
        score: totalScore,
        correct_num: correctNum,
        wrong_num: wrongNum,
        subjective_num: subjectiveNum,
      },
      { where: { id: recordId } },
    );
    return { correctNum, wrongNum, subjectiveNum, score: totalScore };
  }

  // 我的答题记录（含试卷标题）
  public async getMyPaperRecords(params) {
    const { app } = this;
    const { userId } = params;
    try {
      const result: any = await app.mysql.query(
        'SELECT pr.*, p.paper_title, p.paper_tags FROM paper_record pr ' +
          'LEFT JOIN examination_paper p ON pr.paper_id = p.paper_id ' +
          'WHERE pr.user_id = ? AND p.is_deleted = 0 ORDER BY pr.id DESC',
        [ userId ],
      );
      // decimal 列驱动返回字符串，统一转成 number 供前端使用
      return result.map((r: any) => ({ ...r, score: Number(r.score) || 0 }));
    } catch (err) {
      return null;
    }
  }

  // 答题统计
  public async getAnswerStats(userId) {
    const { app } = this;
    try {
      const rows: any = await app.mysql.query(
        'SELECT COUNT(*) AS attempt_num, ' +
          'COALESCE(SUM(question_num),0) AS question_num, ' +
          'COALESCE(SUM(correct_num),0) AS correct_num, ' +
          'COALESCE(SUM(wrong_num),0) AS wrong_num, ' +
          'COALESCE(SUM(subjective_num),0) AS subjective_num, ' +
          'COALESCE(ROUND(AVG(score),1),0) AS avg_score ' +
          'FROM paper_record WHERE user_id = ?',
        [ userId ],
      );
      const r = rows[0] || {};
      const correctNum = Number(r.correct_num) || 0;
      const wrongNum = Number(r.wrong_num) || 0;
      const objectiveNum = correctNum + wrongNum;
      const correctRate =
        objectiveNum > 0 ? Math.round((correctNum / objectiveNum) * 100) : 0;

      // 按科目统计正确率（仅客观题，主观题不参与）
      const subjectRows: any = await app.mysql.query(
        'SELECT q.subjectID, ' +
          'COALESCE(SUM(CASE WHEN ar.is_correct = 1 THEN 1 ELSE 0 END),0) AS correct_num, ' +
          'COALESCE(SUM(CASE WHEN ar.is_correct = 0 THEN 1 ELSE 0 END),0) AS wrong_num ' +
          'FROM answer_record ar JOIN questions q ON ar.question_id = q.id ' +
          'WHERE ar.user_id = ? AND ar.is_correct IS NOT NULL ' +
          'GROUP BY q.subjectID',
        [ userId ],
      );
      const subjectStats = (subjectRows || [])
        .map((s: any) => {
          const c = Number(s.correct_num) || 0;
          const w = Number(s.wrong_num) || 0;
          const total = c + w;
          return {
            subjectID: s.subjectID,
            subjectName: getSubjectName(s.subjectID),
            correct_num: c,
            wrong_num: w,
            total,
            rate: total > 0 ? Math.round((c / total) * 100) : 0,
          };
        })
        .sort((a: any, b: any) => b.total - a.total);

      // 最近 10 次答题得分趋势（按时间升序）
      const recentRows: any = await app.mysql.query(
        'SELECT score, ctime FROM paper_record WHERE user_id = ? ORDER BY id DESC LIMIT 10',
        [ userId ],
      );
      const recentScores = recentRows
        .slice()
        .reverse()
        .map((s: any) => ({ score: Number(s.score) || 0, ctime: s.ctime }));

      return {
        attempt_num: Number(r.attempt_num) || 0,
        question_num: Number(r.question_num) || 0,
        correct_num: correctNum,
        wrong_num: wrongNum,
        subjective_num: Number(r.subjective_num) || 0,
        avg_score: Number(r.avg_score) || 0,
        correct_rate: correctRate,
        subjectStats,
        recentScores,
      };
    } catch (err) {
      return null;
    }
  }

  // 错题本（自动汇总答错的题目，按题目去重，取最近一次错答；可传 subjectID 按科目筛选）
  public async getWrongQuestions(params) {
    const { app } = this;
    const { userId, subjectID, currentPage = 1, pageSize = 10 } = params;
    try {
      const hasSubject =
        subjectID !== undefined && subjectID !== null && subjectID !== '';
      const subjectCond = hasSubject ? ' AND q.subjectID = ?' : '';
      const listValues: any = hasSubject
        ? [ userId, subjectID, pageSize, (currentPage - 1) * pageSize ]
        : [ userId, pageSize, (currentPage - 1) * pageSize ];
      const result: any = await app.mysql.query(
        'SELECT q.*, t.user_answer AS last_wrong_answer, t.ctime AS wrong_time ' +
          'FROM (' +
          '  SELECT ar.*, ROW_NUMBER() OVER (PARTITION BY ar.question_id ORDER BY ar.id DESC) AS rn ' +
          '  FROM answer_record ar WHERE ar.user_id = ? AND ar.is_correct = 0' +
          ') t ' +
          'JOIN questions q ON q.id = t.question_id ' +
          'WHERE t.rn = 1 AND q.is_deleted = 0' +
          subjectCond +
          ' ORDER BY t.id DESC LIMIT ? OFFSET ?',
        listValues,
      );
      const totalValues: any = hasSubject ? [ userId, subjectID ] : [ userId ];
      const totalRows: any = await app.mysql.query(
        'SELECT COUNT(DISTINCT ar.question_id) AS count FROM answer_record ar ' +
          'JOIN questions q ON q.id = ar.question_id ' +
          'WHERE ar.user_id = ? AND ar.is_correct = 0 AND q.is_deleted = 0' +
          subjectCond,
        totalValues,
      );
      // 按科目统计错题分布（统计全部科目，不受当前筛选影响）
      const subjectRows: any = await app.mysql.query(
        'SELECT q.subjectID, COUNT(DISTINCT ar.question_id) AS cnt ' +
          'FROM answer_record ar JOIN questions q ON q.id = ar.question_id ' +
          'WHERE ar.user_id = ? AND ar.is_correct = 0 AND q.is_deleted = 0 GROUP BY q.subjectID',
        [ userId ],
      );
      const subjectStats = subjectRows.map((r: any) => ({
        subjectID: r.subjectID,
        subjectName: getSubjectName(Number(r.subjectID)),
        count: Number(r.cnt) || 0,
      }));
      return {
        total: totalRows[0].count,
        data: result,
        subjectStats,
      };
    } catch (err) {
      return null;
    }
  }
  // 一键清空错题
  public async clearWrongQuestions(userId) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'DELETE FROM answer_record WHERE user_id = ? AND is_correct = 0',
        [ userId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
