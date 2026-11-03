import styles from './SectionHeader.module.css';

// 왼쪽 강조 막대가 있는 섹션 제목 (Stitch 공통). accent: primary | secondary
export default function SectionHeader({ title, sub, badge, action, accent = 'primary', as: Tag = 'h2', id }) {
  return (
    <div className={styles.head}>
      <div className={styles.titleRow}>
        <span className={`${styles.bar} ${styles[accent]}`} aria-hidden="true" />
        <Tag className={styles.title} id={id}>
          {title}
        </Tag>
        {sub && <span className={styles.sub}>{sub}</span>}
        {badge}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
