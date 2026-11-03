import { Badge } from '../ui/Badge';
import styles from './UserFooter.module.css';

// 대상 페이지가 아직 없어 링크 대신 텍스트로 둔다.
const LINKS = ['서비스 소개', '이용약관', '개인정보처리방침', '고객 문의'];

export default function UserFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`mp-container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.brandRow}>
              <strong className={styles.name}>MoviePick</strong>
              <Badge tone="primary">CINEMA ARCHIVE</Badge>
            </div>
            <p className={styles.desc}>영화 정보 탐색과 감상평 공유, 시네필 커뮤니티를 위한 서비스입니다.</p>
          </div>
          <ul className={styles.links} aria-label="안내 (준비 중)">
            {LINKS.map((label) => (
              <li key={label} className={styles.link} aria-disabled="true" title="준비 중">
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} MoviePick</span>
          <span>영화 메타데이터와 이미지는 TMDB API를 사용하며, TMDB의 보증·인증을 받은 서비스가 아닙니다.</span>
        </div>
      </div>
    </footer>
  );
}
