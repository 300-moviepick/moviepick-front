import { Link } from 'react-router-dom';
import { IconClapperboard } from './icons';
import styles from './Logo.module.css';

// 클랩보드 아이콘 + "MoviePick" (D-4). tag: 'archive'(사용자) | 'admin'(관리자) | null
// to={null}이면 링크 없이 표시만 한다(로딩 화면 등).
export default function Logo({ to = '/', tag = 'archive', size = 'md' }) {
  const cls = `${styles.logo} ${size === 'sm' ? styles.sm : ''} ${size === 'lg' ? styles.lg : ''}`;
  const content = (
    <>
      <span className={styles.mark}>
        <IconClapperboard size={size === 'sm' ? 16 : size === 'lg' ? 28 : 20} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>MoviePick</span>
        {tag === 'archive' && <span className={styles.sub}>CINEMA ARCHIVE</span>}
      </span>
      {tag === 'admin' && <span className={styles.admin}>ADMIN</span>}
    </>
  );
  if (to === null) {
    return <span className={cls}>{content}</span>;
  }
  return (
    <Link to={to} className={cls} aria-label="MoviePick 홈">
      {content}
    </Link>
  );
}
