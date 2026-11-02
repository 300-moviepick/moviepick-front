import { Link } from 'react-router-dom';
import { formatCount, timeAgo } from '../../lib/format';
import { IconEye, IconHeart, IconMessage } from '../icons';
import { Avatar } from '../Poster';
import styles from './PostCard.module.css';

/**
 * 커뮤니티 게시글 카드. PostListResponse
 * { postId, title, author{memberId,nickname}, likeCount, commentCount, viewCount, createdAt }
 * variant: 'row'(목록) | 'compact'(홈 인기글)
 */
export default function PostCard({ post, variant = 'row' }) {
  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <Link to={`/community/${post.postId}`} className={styles.link}>
        <div className={styles.top}>
          <h3 className={styles.title}>{post.title}</h3>
          <span className={styles.time}>{timeAgo(post.createdAt)}</span>
        </div>
        <div className={styles.bottom}>
          <span className={styles.author}>
            <Avatar name={post.author?.nickname} size={24} />
            {post.author?.nickname}
          </span>
          <span className={styles.stats}>
            <span title="좋아요">
              <IconHeart size={14} /> {formatCount(post.likeCount)}
            </span>
            <span title="댓글">
              <IconMessage size={14} /> {formatCount(post.commentCount)}
            </span>
            {post.viewCount !== undefined && (
              <span title="조회수">
                <IconEye size={14} /> {formatCount(post.viewCount)}
              </span>
            )}
          </span>
        </div>
      </Link>
    </article>
  );
}
