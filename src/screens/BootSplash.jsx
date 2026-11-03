import Logo from '../ui/Logo';
import styles from './BootSplash.module.css';

// 앱 시작 시 로그인 상태 확인(AuthProvider booting) 동안 보여 주는 화면
export default function BootSplash() {
  return (
    <div className={`mp ${styles.splash}`} role="status" aria-live="polite">
      <div className={styles.center}>
        <div className={styles.logo}>
          <Logo to={null} size="lg" />
        </div>
        <div className={styles.bar} aria-hidden="true">
          <span />
        </div>
        <p className={styles.text}>로그인 상태를 확인하고 있습니다</p>
      </div>
    </div>
  );
}
