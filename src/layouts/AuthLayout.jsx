import { NavLink, Outlet } from 'react-router-dom';
import { IconArrowLeft } from '../ui/icons';
import Logo from '../ui/Logo';
import styles from './AuthLayout.module.css';

// 로그인·회원가입·소셜 로그인 결과 화면 공통 틀 (Stitch 1·2번)
export default function AuthLayout() {
  return (
    <div className={`mp ${styles.shell}`}>
      <header className={styles.header}>
        <div className={`mp-container ${styles.inner}`}>
          <Logo />
          <nav className={styles.nav} aria-label="인증 메뉴">
            <NavLink to="/" end className={styles.back}>
              <IconArrowLeft size={16} /> 메인 홈으로 돌아가기
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              로그인
            </NavLink>
            <NavLink to="/signup" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              회원가입
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={`mp-container ${styles.footInner}`}>
          <span>© {new Date().getFullYear()} MoviePick</span>
          <span className={styles.footLinks} aria-label="안내 (준비 중)">
            <span>이용약관</span>
            <span>개인정보처리방침</span>
            <span>고객지원</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
