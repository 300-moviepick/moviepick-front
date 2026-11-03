import { Link } from 'react-router-dom';
import { yearOf } from '../../lib/format';
import { RatingBadge } from '../Badge';
import { IconHeart } from '../icons';
import Poster from '../Poster';
import styles from './MovieCard.module.css';

/**
 * 영화 카드. MovieListResponse / WishlistMovieResponse 모양을 받는다.
 * movie: { movieId, title, posterUrl, releaseDate, voteAverage?, averageRating? }
 * wishlisted가 boolean이면 찜 버튼을 보여 준다(undefined면 숨김).
 */
export default function MovieCard({ movie, wishlisted, onToggleWishlist, wishlistBusy = false, meta }) {
  const showWish = typeof wishlisted === 'boolean';
  return (
    <article className={styles.card}>
      <Link to={`/movies/${movie.movieId}`} className={styles.link}>
        <Poster src={movie.posterUrl} alt={movie.title} className={styles.poster} />
        <div className={styles.body}>
          <div className={styles.row}>
            <span className={styles.year}>{yearOf(movie.releaseDate)}</span>
            {meta}
          </div>
          <h3 className={styles.title}>{movie.title}</h3>
          <div className={styles.ratings}>
            {movie.averageRating !== undefined && (
              <RatingBadge value={movie.averageRating} size="sm" label="MoviePick 평점" emptyText="평가 없음" />
            )}
            {movie.voteAverage !== undefined && movie.voteAverage !== null && (
              <span className={styles.tmdb} title="TMDB 평점">
                TMDB {Number(movie.voteAverage).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
      {showWish && (
        <button
          type="button"
          className={`${styles.wish} ${wishlisted ? styles.wishOn : ''}`}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? `${movie.title} 찜 해제` : `${movie.title} 찜하기`}
          disabled={wishlistBusy}
          onClick={() => onToggleWishlist?.(movie)}
        >
          <IconHeart size={18} filled={wishlisted} />
        </button>
      )}
    </article>
  );
}
