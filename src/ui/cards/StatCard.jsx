import { ComingSoon } from '../StateViews';
import styles from './StatCard.module.css';

/**
 * 통계 카드. value가 undefined이면(데이터 API 없음) "준비 중"으로 표시한다.
 * loading이면 값 자리를 비워 둔다.
 * dense이면 767px 이하에서 아이콘·설명을 숨긴 축약형(라벨·숫자만)으로 그린다.
 */
export default function StatCard({ label, value, unit, hint, icon, tone = 'default', loading = false, dense = false }) {
  const unavailable = value === undefined && !loading;
  return (
    <div className={`${styles.card} ${styles[tone]} ${dense ? styles.dense : ''}`}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {unavailable ? (
        <div className={styles.soon}>
          <ComingSoon variant="badge" />
        </div>
      ) : (
        <div className={styles.valueRow}>
          <span className={`${styles.value} ${loading ? styles.loading : ''}`}>
            {loading ? ' ' : (value ?? '-')}
          </span>
          {unit && !loading && <span className={styles.unit}>{unit}</span>}
        </div>
      )}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
