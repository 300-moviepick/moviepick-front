import { IconChevronLeft, IconChevronRight } from './icons';
import styles from './Pagination.module.css';

// 보여 줄 페이지 번호 목록(0부터). 중간 생략은 '…'
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`);
    result.push(p);
  });
  return result;
}

/** PageResponse 기준 페이지 이동. page는 0부터 시작한다. */
export default function Pagination({ page, totalPages, onChange, summary }) {
  if (!totalPages || totalPages <= 1) {
    return summary ? <div className={styles.wrap}>{summary}</div> : null;
  }
  return (
    <nav className={styles.wrap} aria-label="페이지 이동">
      {summary && <div className={styles.summary}>{summary}</div>}
      <div className={styles.pages}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => onChange(page - 1)}
          disabled={page <= 0}
          aria-label="이전 페이지"
        >
          <IconChevronLeft size={18} />
        </button>
        {pageWindow(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className={styles.gap}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.page} ${p === page ? styles.current : ''}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.arrow}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="다음 페이지"
        >
          <IconChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
