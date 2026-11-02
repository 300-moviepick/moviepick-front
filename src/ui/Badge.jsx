import { IconStar } from './icons';
import styles from './Badge.module.css';

// tone: neutral | primary | soft | secondary | tertiary | gold | success | danger
export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`${styles.badge} ${styles[tone]} ${className}`}>{children}</span>;
}

// 필터·탭용 칩. active면 선택 상태.
export function Chip({ active = false, disabled = false, onClick, children, ...rest }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

// 금색 별점 배지. value가 null/undefined면 emptyText를 보여 준다.
export function RatingBadge({ value, max, label, emptyText = '평가 없음', size = 'md' }) {
  const has = value !== null && value !== undefined && !Number.isNaN(Number(value));
  return (
    <span className={`${styles.rating} ${size === 'sm' ? styles.ratingSm : ''}`} title={label}>
      <IconStar size={size === 'sm' ? 12 : 14} />
      {has ? (
        <>
          <span className={styles.ratingValue}>{Number(value).toFixed(1)}</span>
          {max && <span className={styles.ratingMax}>/ {max}</span>}
        </>
      ) : (
        <span className={styles.ratingMax}>{emptyText}</span>
      )}
      {label && <span className="mp-sr-only">{label}</span>}
    </span>
  );
}
