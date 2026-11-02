import { Link } from 'react-router-dom';
import { timeAgo } from '../../lib/format';
import { Badge } from '../Badge';
import { IconCheck, IconFilm } from '../icons';
import styles from './NotificationCard.module.css';

const TYPE_LABEL = { MOVIE_RELEASE: '찜한 영화 개봉' };

/**
 * 알림 카드. NotificationResponse { notificationId, type, movieId, title, message, read, createdAt }
 * onRead가 있으면 읽지 않은 알림에 읽음 버튼을 보여 준다.
 */
export default function NotificationCard({ notification, onRead, readBusy = false, onOpen }) {
  const n = notification;
  const body = (
    <>
      <span className={styles.icon}>
        <IconFilm size={20} />
      </span>
      <div className={styles.main}>
        <div className={styles.meta}>
          <Badge tone="tertiary">{TYPE_LABEL[n.type] || n.type}</Badge>
          <span className={styles.time}>{timeAgo(n.createdAt)}</span>
          {!n.read && <span className={styles.dot} aria-label="읽지 않음" />}
        </div>
        <strong className={styles.title}>{n.title}</strong>
        <p className={styles.message}>{n.message}</p>
      </div>
    </>
  );

  return (
    <article className={`${styles.card} ${n.read ? styles.read : styles.unread}`}>
      {n.movieId ? (
        <Link to={`/movies/${n.movieId}`} className={styles.link} onClick={() => onOpen?.(n)}>
          {body}
        </Link>
      ) : (
        <div className={styles.link}>{body}</div>
      )}
      {onRead && !n.read && (
        <button
          type="button"
          className={styles.readBtn}
          onClick={() => onRead(n)}
          disabled={readBusy}
          aria-label="읽음으로 표시"
          title="읽음으로 표시"
        >
          <IconCheck size={18} />
        </button>
      )}
    </article>
  );
}
