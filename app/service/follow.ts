import { Service } from 'egg';

export default class follow extends Service {
  // 关注用户
  public async follow(followerId: number, followedId: number) {
    const { app } = this;
    try {
      if (followerId === followedId) return null;
      const result = await app.mysql.insert('user_follow', {
        follower_id: followerId,
        followed_id: followedId,
        create_time: new Date(),
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 取消关注
  public async unfollow(followerId: number, followedId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.delete('user_follow', {
        follower_id: followerId,
        followed_id: followedId,
      });
      return result;
    } catch (err) {
      return null;
    }
  }
  // 关注列表（我关注的人）
  public async getFollowing(followerId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT u.userId, u.username, u.avatar, f.create_time ' +
          'FROM user_follow f JOIN user u ON f.followed_id = u.userId ' +
          'WHERE f.follower_id = ? ORDER BY f.create_time DESC',
        [ followerId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 粉丝列表（关注我的人）
  public async getFollowers(followedId: number) {
    const { app } = this;
    try {
      const result = await app.mysql.query(
        'SELECT u.userId, u.username, u.avatar, f.create_time ' +
          'FROM user_follow f JOIN user u ON f.follower_id = u.userId ' +
          'WHERE f.followed_id = ? ORDER BY f.create_time DESC',
        [ followedId ],
      );
      return result;
    } catch (err) {
      return null;
    }
  }
  // 是否已关注
  public async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const { app } = this;
    try {
      const row = await app.mysql.get('user_follow', {
        follower_id: followerId,
        followed_id: followedId,
      });
      return Boolean(row);
    } catch (err) {
      return false;
    }
  }
  // 关注/粉丝数量
  public async getCounts(userId: number) {
    const { app } = this;
    try {
      const following = await app.mysql.count('user_follow', { follower_id: userId });
      const followers = await app.mysql.count('user_follow', { followed_id: userId });
      return { following, followers };
    } catch (err) {
      return { following: 0, followers: 0 };
    }
  }
}
