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

// 去掉 HTML / 空白 / 标点，只保留中英文数字，并转小写（用于宽松比较）
function normalizeText(input: string | undefined): string {
  return stripHtml(input)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '')
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

// 英文停用词
const STOPWORDS_EN = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'and', 'or', 'is', 'are', 'on', 'at',
  'for', 'with', 'as', 'by', 'this', 'that', 'it', 'be', 'we', 'you', 'i',
  'he', 'she', 'they', 'them', 'do', 'does', 'did', 'can', 'will', 'would',
]);

// 中文常见虚字（用于过滤无意义的 2 字片段）
const CHINESE_STOP_CHARS = /[的了吗呢吧啊呀哦着过得地和与或及并而但就都也还又再很太更最不没有在是会能可要将被把从对向于给为当如若因所其此该某各每之乎者也个们]/;

// 提取关键词：英文/数字词 + 中文 2 字片段（去停用）
function extractKeywords(text: string): string[] {
  const words = new Set<string>();
  (text.match(/[a-z0-9][a-z0-9.+#-]*/g) || []).forEach(w => {
    if (w.length >= 2 && !STOPWORDS_EN.has(w)) words.add(w);
  });
  const chinese = text.replace(/[a-z0-9]/g, '');
  for (let i = 0; i + 1 < chinese.length; i++) {
    const bigram = chinese.slice(i, i + 2);
    if (!CHINESE_STOP_CHARS.test(bigram)) words.add(bigram);
  }
  return [ ...words ];
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

// 主观题宽松判定：命中要点关键词即判对；未命中不判错（仍待对照）
function judgeSubjective(
  userAnswer: string,
  correctHtml: string | undefined,
): 1 | null {
  const userText = normalizeText(userAnswer);
  const refText = normalizeText(correctHtml);
  if (!userText || !refText) return null;
  // 直接包含关系
  if (refText.includes(userText) || userText.includes(refText)) return 1;
  const refKw = extractKeywords(refText);
  if (refKw.length === 0) return null;
  const userSet = new Set(extractKeywords(userText));
  const hits = refKw.filter(k => userSet.has(k));
  // 命中任意英文/数字关键词，或中文重合 >= 2 个片段，即认为答到要点
  const enHit = hits.filter(k => /^[a-z0-9]/.test(k)).length;
  if (enHit >= 1) return 1;
  if (hits.length >= 2) return 1;
  return null;
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

      for (const q of questions) {
        const qt = Number(q.questionType);
        const userAnswer = answerMap[String(q.id)] ?? '';
        let isCorrect: number | null = null;

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
            if (ok) {
              correctNum++;
            } else {
              wrongNum++;
            }
          }
        } else {
          // 简答/填空等主观题：宽松关键词匹配，命中给分，未命中仍待对照
          const ok = judgeSubjective(userAnswer, q.answer);
          if (ok === 1) {
            correctNum++;
            isCorrect = 1;
          } else {
            subjectiveNum++;
            isCorrect = null;
          }
        }

        detail.push({
          questionId: q.id,
          questionType: qt,
          question: q.question,
          questionDetail: q.questionDetail,
          correctAnswer: q.answer,
          userAnswer,
          isCorrect,
        });
      }

      const questionNum = questions.length;
      const score = correctNum;

      const recordRes: any = await app.mysql.insert('paper_record', {
        user_id: userId,
        paper_id: paperId,
        score,
        question_num: questionNum,
        correct_num: correctNum,
        wrong_num: wrongNum,
        subjective_num: subjectiveNum,
        ctime: getNowFormatDate(),
      });
      const recordId = recordRes.insertId;

      for (const d of detail) {
        await app.mysql.insert('answer_record', {
          record_id: recordId,
          user_id: userId,
          paper_id: paperId,
          question_id: d.questionId,
          user_answer: d.userAnswer,
          is_correct: d.isCorrect,
          ctime: getNowFormatDate(),
        });
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
      return result;
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
          'COALESCE(SUM(score),0) AS total_score, ' +
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
        total_score: Number(r.total_score) || 0,
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
  // 主观题待复核列表（管理员，is_correct 为 null 即待定）
  public async getSubjectiveReviews() {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT ar.*, u.username, q.question, q.answer AS correct_answer, p.paper_title ' +
          'FROM answer_record ar ' +
          'LEFT JOIN user u ON ar.user_id = u.userId ' +
          'LEFT JOIN questions q ON ar.question_id = q.id ' +
          'LEFT JOIN examination_paper p ON ar.paper_id = p.paper_id ' +
          'WHERE ar.is_correct IS NULL AND q.is_deleted = 0 ORDER BY ar.id DESC',
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 人工复核主观题：判对(1)或判错(0)
  public async reviewSubjective(id: number, correct: boolean) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'answer_record',
        { is_correct: correct ? 1 : 0 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
