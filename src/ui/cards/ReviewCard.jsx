import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/format';
import { Badge, RatingBadge } from '../Badge';
import { IconEdit, IconEye, IconEyeOff, IconFlag, IconHeart, IconTrash } from '../icons';
import Poster, { Avatar } from '../Poster';
import styles from './ReviewCard.module.css';

/**
 * 리뷰 카드.
 * - 영화 상세: ReviewResponse { reviewId, author{memberId,nickname}, rating, content, spoiler, likeCount, likedByMe, createdAt, blinded, rewritten }
 * - 내 리뷰: ReviewWithMovieResponse { …, movie{movieId,title,posterUrl}, movieActive }
 * blinded면 rating·content가 null로 온다.
 * 버튼은 해당 콜백을 넘긴 경우에만 보인다.
 */
export default function ReviewCard({ review, isMine = false, onLike, likeBusy = false, onEdit, onDelete, onReport }) {
  const [revealed, setRevealed] = useState(false);
  const { movie } = review;
  const hideSpoiler = review.spoiler && !review.blinded && !revealed;
  const movieActive = review.movieActive !== false;

  return (
    <article className={`${styles.card} ${movie ? styles.withMovie : ''}`}>
      {movie && (
        <div className={styles.movie}>
          {movieActive ? (
            <Link to={`/movies/${movie.movieId}`} className={styles.movieLink}>
              <Poster src={movie.posterUrl} alt={movie.title} />
              <span className={styles.movieTitle}>{movie.title}</span>
            </Link>
          ) : (
            <div className={styles.movieLink}>
              <Poster src={movie.posterUrl} alt={movie.title} />
              <span className={styles.movieTitle}>{movie.title}</span>
              <Badge>공개 중지된 영화</Badge>
            </div>
          )}
        </div>
      )}

      <div className={styles.main}>
        <header className={styles.head}>
          {review.author && (
            <div className={styles.author}>
              <Avatar name={review.author.nickname} size={32} />
              <span className={styles.nickname}>{review.author.nickname}</span>
              {isMine && <Badge tone="primary">내 리뷰</Badge>}
            </div>
          )}
          <div className={styles.metaRow}>
            {!review.blinded && <RatingBadge value={review.rating} max="5.0" label="평점" />}
            <span className={styles.date}>{formatDateTime(review.createdAt)}</span>
            {review.rewritten && <Badge>다시 작성됨</Badge>}
            {review.spoiler && !review.blinded && <Badge tone="secondary">스포일러</Badge>}
          </div>
        </header>

        {review.blinded ? (
          <p className={styles.notice}>신고 처리로 숨겨진 리뷰입니다.</p>
        ) : hideSpoiler ? (
          <div className={styles.spoilerBox}>
            <IconEyeOff size={18} />
            <span>스포일러가 포함된 리뷰입니다.</span>
            <button type="button" className={styles.textBtn} onClick={() => setRevealed(true)}>
              <IconEye size={16} /> 내용 보기
            </button>
          </div>
        ) : (
          <p className={styles.content}>{review.content}</p>
        )}

        <footer className={styles.foot}>
          {onLike ? (
            <button
              type="button"
              className={`${styles.like} ${review.likedByMe ? styles.liked : ''}`}
              aria-pressed={!!review.likedByMe}
              disabled={likeBusy || isMine || review.blinded}
              title={isMine ? '내 리뷰에는 공감할 수 없습니다' : undefined}
              onClick={() => onLike(review)}
            >
              <IconHeart size={16} filled={review.likedByMe} />
              공감 {review.likeCount ?? 0}
            </button>
          ) : (
            <span className={styles.likeStatic}>
              <IconHeart size={16} /> 공감 {review.likeCount ?? 0}
            </span>
          )}
          <div className={styles.actions}>
            {onEdit && (
              <button type="button" className={styles.textBtn} onClick={() => onEdit(review)} disabled={!movieActive || review.blinded}>
                <IconEdit size={16} /> 수정
              </button>
            )}
            {onDelete && (
              <button type="button" className={`${styles.textBtn} ${styles.danger}`} onClick={() => onDelete(review)}>
                <IconTrash size={16} /> 삭제
              </button>
            )}
            {onReport && !isMine && !review.blinded && (
              <button type="button" className={styles.textBtn} onClick={() => onReport(review)}>
                <IconFlag size={16} /> 신고
              </button>
            )}
          </div>
        </footer>
      </div>
    </article>
  );
}
