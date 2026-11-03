import styles from './Tabs.module.css';

/**
 * 탭·정렬 선택. items: [{ value, label, count?, disabled?, badge? }]
 * variant: 'pill'(기본, 둥근 버튼) | 'underline'
 */
export default function Tabs({ items, value, onChange, variant = 'pill', ariaLabel }) {
  return (
    <div className={`${styles.tabs} ${styles[variant]}`} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            onClick={() => onChange?.(item.value)}
          >
            {item.label}
            {item.count !== undefined && item.count !== null && <span className={styles.count}>{item.count}</span>}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
