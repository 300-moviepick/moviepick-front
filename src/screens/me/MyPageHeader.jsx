import { Badge } from '../../ui/Badge';
import styles from './MyPage.module.css';

// 마이페이지 화면 공통 제목 (Stitch 4~7번 상단)
export default function MyPageHeader({ eyebrow, title, description, badge, actions }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        {eyebrow && <Badge tone="primary">{eyebrow}</Badge>}
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {badge}
        </div>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
  );
}
