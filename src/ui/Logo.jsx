import { Link } from 'react-router-dom';
import { IconClapperboard } from './icons';
import styles from './Logo.module.css';

// 클랩보드 아이콘 + "MoviePick" (D-4). tag: 'archive'(사용자) | 'admin'(관리자) | null
export default function Logo({ to = '/', tag = 'archive', size = 'md' }) {
  return (
    <Link to={to} className={`${styles.logo} ${size === 'sm' ? styles.sm : ''}`} aria-label="MoviePick 홈">
      <span className={styles.mark}>
        <IconClapperboard size={size === 'sm' ? 16 : 20} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>MoviePick</span>
        {tag === 'archive' && <span className={styles.sub}>CINEMA ARCHIVE</span>}
      </span>
      {tag === 'admin' && <span className={styles.admin}>ADMIN</span>}
    </Link>
  );
}
