import { Service } from 'egg';
import fs from 'fs';
import path from 'path';

// 解析评论图片 URL 数组（只保留本站上传的图片路径）
function parseImageUrls(imagesJson: string | null | undefined): string[] {
  if (!imagesJson) return [];
  try {
    const arr = JSON.parse(imagesJson);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (u: any) => typeof u === 'string' && /^\/public\/uploads\/[\w.-]+$/.test(u),
    );
  } catch {
    return [];
  }
}

// 删除评论关联的图片文件（只处理本站 uploads 目录，防路径穿越）
function deleteImageFiles(app: any, urls: string[]) {
  if (!urls.length) return;
  const dir = path.join(app.baseDir, 'app/public/uploads');
  for (const url of urls) {
    const m = /^\/public\/uploads\/([\w.-]+)$/.exec(url);
    if (!m) continue;
    const target = path.join(dir, m[1]);
    if (fs.existsSync(target)) {
      try {
        fs.unlinkSync(target);
      } catch {
        // 忽略删除失败
      }
    }
  }
}

export default class comment extends Service {
  // 添加评论（关联题目，支持回复楼层）
  public async addComment(params) {
    const { app } = this;
    const { userId, questionId, parentId } = params;
    try {
      // 查找用户是否存在
      const user: any = await app.mysql.get('user', { userId });
      if (!user) {
        return null;
      }
      const data: any = {
        user_id: userId,
        question_id: questionId,
        content: params.content,
        // 命中「待审核」词时先隐藏，等管理员审核通过后展示
        status: params.status === 0 ? 0 : 1,
        // 用户名/头像不再冗余存储，展示时从 user 表关联取
      };
      if (parentId) {
        data.parent_id = Number(parentId);
      }
      // 评论图片：只保留本站上传的图片 URL
      const images = parseImageUrls(
        Array.isArray(params.images) ? JSON.stringify(params.images) : null,
      );
      if (images.length) {
        data.images = JSON.stringify(images);
      }
      const result: any = await app.mysql.insert('comment', data);
      // 通知题目上传者收到新评论（评论者本人不通知），并携带题目/评论ID用于点击跳转定位
      const upload: any = await app.mysql.get('user_upload_question', {
        question_id: questionId,
      });
      if (upload?.user_id && upload.user_id !== userId) {
        const question: any = await app.mysql.get('questions', {
          id: questionId,
        });
        await this.service.notification.create({
          userId: upload.user_id,
          type: 'comment',
          title: '收到新评论',
          content: `你的题目「${question?.question || ''}」收到一条新评论`,
          questionId: Number(questionId),
          commentId: result.insertId,
        });
      }
      return result;
    } catch (err) {
      return null;
    }
  }
  // 获取评论列表（可传 questionId 查某题的评论；onlyApproved=true 仅返回审核通过的）
  // 顶层评论分页返回：result 为当前页的顶层评论树，total 为顶层评论总数
  public async getCommentList(params) {
    const { app } = this;
    const { questionId, onlyApproved, currentPage = 1, pageSize = 10, userId } = params || {};
    try {
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;

      // 顶层评论 WHERE 条件
      const rootWhere: string[] = [ 'c.is_deleted = 0', 'c.parent_id IS NULL' ];
      const rootValues: any = [];
      if (questionId) {
        rootWhere.push('c.question_id = ?');
        rootValues.push(Number(questionId));
      }
      if (onlyApproved) {
        rootWhere.push('c.status = 1');
      }
      const rootWhereSql = ' WHERE ' + rootWhere.join(' AND ');

      // 1. 顶层评论总数（替代原全量查询后内存计数）
      const totalRows: any = await app.mysql.query(
        `SELECT COUNT(*) AS count FROM comment c${rootWhereSql}`,
        rootValues,
      );
      const total = Number(totalRows[0].count) || 0;

      // 2. 数据库分页查顶层评论（替代原全量查 + 内存 slice）
      const rootList: any = await app.mysql.query(
        'SELECT c.id, c.user_id, c.question_id, c.content, u.username, c.create_time, ' +
          'c.parent_id, c.status, c.is_pinned, c.images, u.avatar, q.question AS question_title ' +
          'FROM comment c ' +
          'LEFT JOIN user u ON c.user_id = u.userId ' +
          'LEFT JOIN questions q ON c.question_id = q.id' +
          rootWhereSql +
          ' ORDER BY c.is_pinned DESC, c.create_time DESC LIMIT ? OFFSET ?',
        [ ...rootValues, size, (page - 1) * size ],
      );

      if (rootList.length === 0) {
        return { result: [], total };
      }

      const rootIds = rootList.map((c: any) => Number(c.id));

      // 3. 查该题下所有回复（题目级别回复数量可控；管理端全量时不过滤 questionId）
      const replyWhere: string[] = [ 'c.is_deleted = 0', 'c.parent_id IS NOT NULL' ];
      const replyValues: any = [];
      if (questionId) {
        replyWhere.push('c.question_id = ?');
        replyValues.push(Number(questionId));
      }
      if (onlyApproved) {
        replyWhere.push('c.status = 1');
      }
      const replyWhereSql = ' WHERE ' + replyWhere.join(' AND ');
      const replyList: any = await app.mysql.query(
        'SELECT c.id, c.user_id, c.question_id, c.content, u.username, c.create_time, ' +
          'c.parent_id, pu.username AS reply_username, c.status, c.is_pinned, c.images, u.avatar ' +
          'FROM comment c ' +
          'LEFT JOIN user u ON c.user_id = u.userId ' +
          'LEFT JOIN comment pc ON c.parent_id = pc.id ' +
          'LEFT JOIN user pu ON pc.user_id = pu.userId' +
          replyWhereSql,
        replyValues,
      );

      // 合并顶层评论 + 回复
      const list = [ ...rootList, ...replyList ];

      // 4. 点赞数：传了 questionId 时只查该题评论的点赞（替代原全表 GROUP BY）
      const likeMap = new Map<number, number>();
      if (questionId) {
        const likeRows: any = await app.mysql.query(
          'SELECT cl.comment_id, COUNT(*) AS cnt FROM comment_like cl ' +
            'JOIN comment c ON cl.comment_id = c.id ' +
            'WHERE c.question_id = ? GROUP BY cl.comment_id',
          [ Number(questionId) ],
        );
        likeRows.forEach((r: any) => likeMap.set(Number(r.comment_id), Number(r.cnt) || 0));
      } else {
        // 管理端全量评论时全表查（数据量可控）
        const likeRows: any = await app.mysql.query(
          'SELECT comment_id, COUNT(*) AS cnt FROM comment_like GROUP BY comment_id',
        );
        likeRows.forEach((r: any) => likeMap.set(Number(r.comment_id), Number(r.cnt) || 0));
      }

      // 5. 当前用户是否已赞
      const likedSet = new Set<number>();
      if (userId) {
        const liked: any = await app.mysql.query(
          'SELECT comment_id FROM comment_like WHERE user_id = ?',
          [ userId ],
        );
        liked.forEach((r: any) => likedSet.add(Number(r.comment_id)));
      }

      list.forEach((c: any) => {
        c.like_count = likeMap.get(Number(c.id)) || 0;
        c.is_liked = likedSet.has(Number(c.id)) ? 1 : 0;
      });

      // 6. 组装树，只保留当前页顶层评论的子树（过滤掉父节点不在当前页的回复）
      const tree = this.buildTree(list).filter((node: any) => rootIds.includes(Number(node.id)));
      return { result: tree, total };
    } catch (err) {
      return null;
    }
  }
  // 组装评论树（任意层级嵌套），并为每条回复记录被回复评论的内容
  private buildTree(list: any[]): any[] {
    const map = new Map<number, any>();
    list.forEach(c => {
      map.set(c.id, { ...c, children: [], reply_to_content: '' });
    });
    const roots: any[] = [];
    list.forEach(c => {
      const node = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        const parent = map.get(c.parent_id);
        node.reply_to_content = parent.content || '';
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    // 子回复按时间倒序（最新的在前），顶层保持倒序
    const sortChildren = (nodes: any[]) => {
      nodes.forEach(n => {
        if (n.children && n.children.length) {
          n.children.sort((a: any, b: any) => b.id - a.id);
          sortChildren(n.children);
        }
      });
    };
    sortChildren(roots);
    return roots;
  }
  // 审核通过评论（待审核 → 通过）
  public async approveComment(id) {
    const { app } = this;
    try {
      const result = await app.mysql.update(
        'comment',
        { status: 1 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 点赞评论
  public async likeComment(userId: number, commentId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('comment_like', {
        user_id: userId,
        comment_id: commentId,
        create_time: new Date(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 取消点赞评论
  public async unlikeComment(userId: number, commentId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('comment_like', {
        user_id: userId,
        comment_id: commentId,
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 置顶/取消置顶评论（管理员；同一题目下同时只允许一条置顶）
  public async pinComment(id: number, pinned: boolean) {
    const { app } = this;
    try {
      if (pinned) {
        // 找到该评论所属题目，便于清空同题下其它置顶
        const target: any = await app.mysql.get('comment', { id });
        if (!target) return null;
        // 只允许置顶顶层评论（回复类评论置顶后无法排到最前）
        if (target.parent_id) return null;
        // 先取消同题下其它评论的置顶，保证只保留这一条
        await app.mysql.query(
          'UPDATE comment SET is_pinned = 0 WHERE question_id = ? AND id != ?',
          [ target.question_id, id ],
        );
      }
      const result = await app.mysql.update(
        'comment',
        { is_pinned: pinned ? 1 : 0 },
        { where: { id } },
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 删除评论（软删除：标记 is_deleted，级联标记其所有子回复，并清理关联图片文件）
  public async deleteComment(id) {
    const { app } = this;
    try {
      const rootId = Number(id);
      // 递归收集所有后代评论 ID
      const collect = async (parentId: number, acc: number[]) => {
        const children: any = await app.mysql.select('comment', {
          where: { parent_id: parentId },
        });
        for (const c of children) {
          acc.push(c.id);
          await collect(c.id, acc);
        }
      };
      const ids = [ rootId ];
      await collect(rootId, ids);
      // 读取待删评论的图片，用于清理磁盘文件
      const rows: any = await app.mysql.query(
        'SELECT images FROM comment WHERE id IN (?)',
        [ ids ],
      );
      const urls = rows.flatMap((r: any) => parseImageUrls(r.images));
      const result = await app.mysql.query(
        'UPDATE comment SET is_deleted = 1, images = NULL WHERE id IN (?)',
        [ ids ],
      );
      deleteImageFiles(app, urls);
      return result;
    } catch (err) {
      return null;
    }
  }
  // 已删除评论列表（管理端恢复用，平铺展示，含题目题干与用户头像）
  public async getDeletedComments() {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT c.id, c.user_id, c.question_id, c.content, u.username, c.create_time, ' +
          'c.parent_id, pu.username AS reply_username, c.status, c.is_pinned, c.images, u.avatar, ' +
          'q.question AS question_title ' +
          'FROM comment c ' +
          'LEFT JOIN user u ON c.user_id = u.userId ' +
          'LEFT JOIN comment pc ON c.parent_id = pc.id ' +
          'LEFT JOIN user pu ON pc.user_id = pu.userId ' +
          'LEFT JOIN questions q ON c.question_id = q.id ' +
          'WHERE c.is_deleted = 1 ORDER BY c.create_time DESC',
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 恢复评论（连同其子回复一并恢复，与删除时的级联行为对称）
  public async restoreComment(id) {
    const { app } = this;
    try {
      const rootId = Number(id);
      const collect = async (parentId: number, acc: number[]) => {
        const children: any = await app.mysql.select('comment', {
          where: { parent_id: parentId },
        });
        for (const c of children) {
          acc.push(c.id);
          await collect(c.id, acc);
        }
      };
      const ids = [ rootId ];
      await collect(rootId, ids);
      const result = await app.mysql.query(
        'UPDATE comment SET is_deleted = 0 WHERE id IN (?)',
        [ ids ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
}
