import { useSearchParams } from 'react-router-dom';
import Button from '../../ui/Button';
import { IconAlert, IconLock } from '../../ui/icons';
import styles from './Auth.module.css';

// 백엔드 OAuth2LoginFailureHandler가 붙이는 고정 reason 코드
const REASONS = {
  MEMBER_SUSPENDED: {
    title: '정지된 계정입니다',
    description: '이용이 정지된 계정으로는 로그인할 수 없습니다.',
    icon: IconLock,
  },
  MEMBER_WITHDRAWN: {
    title: '탈퇴한 계정입니다',
    description: '탈퇴 처리된 계정으로는 로그인할 수 없습니다.',
    icon: IconLock,
  },
  OAUTH2_FAILED: {
    title: '소셜 로그인에 실패했습니다',
    description: '잠시 후 다시 시도하거나 다른 방법으로 로그인해 주세요.',
    icon: IconAlert,
  },
};

// 소셜 로그인 실패 시 백엔드가 보내는 고정 경로(/oauth2/fail?reason=코드)
export default function OAuthFailScreen() {
  const [params] = useSearchParams();
  const info = REASONS[params.get('reason')] ?? REASONS.OAUTH2_FAILED;
  const Icon = info.icon;

  return (
    <div className={`mp-container ${styles.resultWrap}`}>
      <section className={`${styles.card} ${styles.result}`} role="alert">
        <span className={`${styles.resultIcon} ${styles.resultIconError}`}>
          <Icon size={28} />
        </span>
        <h1 className={styles.title}>{info.title}</h1>
        <p className={styles.subtitle}>{info.description}</p>
        <div className={styles.actions}>
          <Button to="/login" variant="primary">
            로그인 화면으로
          </Button>
          <Button to="/" variant="secondary">
            메인으로
          </Button>
        </div>
      </section>
    </div>
  );
}
