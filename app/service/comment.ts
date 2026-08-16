import { Service } from 'egg';

export default class comment extends Service {
  // 添加评论（关联题目，支持回复楼层）
  public async addComment(params) {
    const { app } = this;
    const { userId, questionId, parentId, replyUsername } = params;
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
        username: user.username,
        // 命中「待审核」词时先隐藏，等管理员审核通过后展示
        status: params.status === 0 ? 0 : 1,
        // 头像不再冗余存储，展示时从 user 表关联取
      };
      if (parentId) {
        data.parent_id = Number(parentId);
        data.reply_username = replyUsername || null;
      }
      // 评论图片（图片 URL 数组）
      if (Array.isArray(params.images) && params.images.length) {
        data.images = JSON.stringify(params.images);
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
      // 头像从 user 表关联取，题目题干从 questions 表关联取，避免冗余存储
      let sql =
        'SELECT c.id, c.user_id, c.question_id, c.content, c.username, c.create_time, ' +
        'c.parent_id, c.reply_username, c.status, c.is_pinned, c.images, u.avatar, q.question AS question_title ' +
        'FROM comment c ' +
        'LEFT JOIN user u ON c.user_id = u.userId ' +
        'LEFT JOIN questions q ON c.question_id = q.id';
      const where: string[] = [ 'c.is_deleted = 0' ];
      const values: any = [];
      if (questionId) {
        where.push('c.question_id = ?');
        values.push(Number(questionId));
      }
      if (onlyApproved) {
        where.push('c.status = 1');
      }
      if (where.length) {
        sql += ' WHERE ' + where.join(' AND ');
      }
      sql += ' ORDER BY c.is_pinned DESC, c.create_time DESC';
      const list: any = await app.mysql.query(sql, values);
      // 点赞数 + 当前用户是否已赞
      const likeRows: any = await app.mysql.query(
        'SELECT comment_id, COUNT(*) AS cnt FROM comment_like GROUP BY comment_id',
      );
      const likeMap = new Map<number, number>();
      likeRows.forEach((r: any) => likeMap.set(r.comment_id, Number(r.cnt) || 0));
      const likedSet = new Set<number>();
      if (userId) {
        const liked: any = await app.mysql.query(
          'SELECT comment_id FROM comment_like WHERE user_id = ?',
          [ userId ],
        );
        liked.forEach((r: any) => likedSet.add(r.comment_id));
      }
      list.forEach((c: any) => {
        c.like_count = likeMap.get(c.id) || 0;
        c.is_liked = likedSet.has(c.id) ? 1 : 0;
      });
      // 组装树后对顶层评论分页
      const tree = this.buildTree(list);
      const total = tree.length;
      const page = Number(currentPage) || 1;
      const size = Number(pageSize) || 10;
      const result = tree.slice((page - 1) * size, page * size);
      return { result, total };
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
  // 置顶/取消置顶评论（管理员）
  public async pinComment(id: number, pinned: boolean) {
    const { app } = this;
    try {
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
  // 删除评论（软删除：标记 is_deleted，级联标记其所有子回复，不物理删除）
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
      const result = await app.mysql.query(
        'UPDATE comment SET is_deleted = 1 WHERE id IN (?)',
        [ ids ],
      );
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
        'SELECT c.id, c.user_id, c.question_id, c.content, c.username, c.create_time, ' +
        'c.parent_id, c.reply_username, c.status, c.is_pinned, c.images, u.avatar, ' +
        'q.question AS question_title ' +
        'FROM comment c ' +
        'LEFT JOIN user u ON c.user_id = u.userId ' +
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
