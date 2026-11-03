import { ApiError } from '../api/client';
import Button from './Button';
import { IconAlert, IconFilm, IconHourglass, IconLock, IconRefresh } from './icons';
import styles from './StateViews.module.css';

/** 로딩 표시. variant: 'spinner' | 'grid'(포스터 카드 자리) | 'list'(목록 줄 자리) */
export function LoadingState({ variant = 'spinner', count = 8, label = '불러오는 중…' }) {
  if (variant === 'grid') {
    return (
      <div className={styles.skeletonGrid} aria-busy="true" aria-label={label}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={`${styles.skeleton} ${styles.skeletonPoster}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLineShort}`} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === 'list') {
    return (
      <div className={styles.skeletonList} aria-busy="true" aria-label={label}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
        ))}
      </div>
    );
  }
  return (
    <div className={styles.center} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.muted}>{label}</span>
    </div>
  );
}

// ApiError 상태 코드에 맞춘 기본 제목
function describe(error) {
  if (error instanceof ApiError) {
    if (error.status === 0) return { title: '서버에 연결할 수 없습니다', icon: IconAlert };
    if (error.status === 401) return { title: '로그인이 필요합니다', icon: IconLock };
    if (error.status === 403) return { title: '접근 권한이 없습니다', icon: IconLock };
    if (error.status === 404) return { title: '찾을 수 없습니다', icon: IconFilm };
  }
  return { title: '문제가 발생했습니다', icon: IconAlert };
}

/** 오류 표시. 서버 message를 그대로 보여 주고, onRetry가 있으면 다시 시도 버튼을 둔다. */
export function ErrorState({ error, title, onRetry, action, compact = false }) {
  const base = describe(error);
  const Icon = base.icon;
  const heading = title || base.title;
  const norm = (s) => String(s).trim().replace(/[.!]$/, '');
  // 서버 message가 제목과 같은 문장이면 한 번만 보여 준다
  const message = error?.message && norm(error.message) !== norm(heading) ? error.message : null;
  return (
    <div className={`${styles.box} ${compact ? styles.compact : ''}`} role="alert">
      <span className={`${styles.iconWrap} ${styles.iconError}`}>
        <Icon size={22} />
      </span>
      <h3 className={styles.title}>{heading}</h3>
      {message && <p className={styles.desc}>{message}</p>}
      {(onRetry || action) && (
        <div className={styles.actions}>
          {onRetry && (
            <Button variant="secondary" size="sm" icon={<IconRefresh size={16} />} onClick={onRetry}>
              다시 시도
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/** 빈 상태. icon은 아이콘 컴포넌트 요소. */
export function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div className={`${styles.box} ${compact ? styles.compact : ''}`}>
      <span className={styles.iconWrap}>{icon || <IconFilm size={22} />}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.desc}>{description}</p>}
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
}

/**
 * 백엔드 기능이 없는 영역 표시.
 * variant: 'banner'(가로 안내) | 'panel'(영역 대체) | 'badge'(작은 표시)
 * 이 컴포넌트 안의 내용은 동작하지 않는다는 것을 분명히 보여 줘야 한다.
 */
export function ComingSoon({ variant = 'panel', title = '준비 중인 기능입니다', description, children }) {
  if (variant === 'badge') {
    return <span className={styles.soonBadge}>준비 중</span>;
  }
  if (variant === 'banner') {
    return (
      <div className={styles.soonBanner} role="note">
        <IconHourglass size={18} />
        <div>
          <strong className={styles.soonTitle}>{title}</strong>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
        <span className={styles.soonBadge}>준비 중</span>
      </div>
    );
  }
  return (
    <section className={styles.soonPanel} aria-label={`${title} (준비 중)`}>
      <div className={styles.soonHead}>
        <span className={styles.soonBadge}>준비 중</span>
        <strong className={styles.soonTitle}>{title}</strong>
      </div>
      {description && <p className={styles.desc}>{description}</p>}
      {children && (
        <div className={styles.soonPreview} inert aria-hidden="true">
          {children}
        </div>
      )}
    </section>
  );
}
