import styles from './Admin.module.css';

// 관리자 화면 공통 제목 (Stitch 15~19번 상단: "OPERATION CONSOLE / …")
export default function AdminPageHeader({ crumb, title, subtitle, description, actions }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <p className={styles.crumb}>
          OPERATION CONSOLE <span>/</span> <strong>{crumb}</strong>
        </p>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
  );
}
