import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCsrf, refreshAccessToken } from '../../api/client';
import { useAuth } from '../../auth/useAuth';
import { messageOf } from '../../lib/apiErrors';
import { consumeRedirect } from '../../lib/authRedirect';
import Button from '../../ui/Button';
import { IconAlert, IconCheck, IconSparkles } from '../../ui/icons';
import styles from './Auth.module.css';

const STEPS = ['보안 토큰 준비', '로그인 세션 확인', '회원 정보 불러오기'];

/**
 * 소셜 로그인 성공 후 백엔드가 보내는 고정 경로(/oauth2/success).
 * 백엔드가 refresh 쿠키를 심어 두었으므로 CSRF → refresh → 내 정보 순서로 로그인 상태를 만든다.
 * (AuthProvider는 이 경로에서 refresh를 건너뛴다.)
 */
export default function OAuthSuccessScreen() {
  const { loadMe } = useAuth();
  const navigate = useNavigate();
  // current: 진행 중인 단계 번호, STEPS.length면 완료
  const [state, setState] = useState({ current: 0, failed: false, error: null });
  const startedRef = useRef(false);

  useEffect(() => {
    // StrictMode에서 두 번 실행되지 않게 한다
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      let step = 0;
      try {
        await fetchCsrf();
        step = 1;
        setState({ current: 1, failed: false, error: null });

        if (!(await refreshAccessToken())) {
          throw new Error('로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.');
        }
        step = 2;
        setState({ current: 2, failed: false, error: null });

        await loadMe();
        setState({ current: STEPS.length, failed: false, error: null });
        const target = consumeRedirect();
        setTimeout(() => navigate(target, { replace: true }), 500);
      } catch (e) {
        setState({ current: step, failed: true, error: messageOf(e) });
      }
    })();
  }, [loadMe, navigate]);

  const done = state.current >= STEPS.length;

  return (
    <div className={`mp-container ${styles.resultWrap}`}>
      <section className={`${styles.card} ${styles.result}`} aria-live="polite">
        <span className={`${styles.resultIcon} ${state.failed ? styles.resultIconError : ''}`}>
          {state.failed ? <IconAlert size={28} /> : <IconSparkles size={28} />}
        </span>
        <h1 className={styles.title}>{state.failed ? '로그인을 마치지 못했습니다' : done ? '로그인되었습니다' : '소셜 로그인 처리 중'}</h1>
        <p className={styles.subtitle}>
          {state.failed ? state.error : done ? '잠시 후 이전 화면으로 이동합니다.' : '잠시만 기다려 주세요.'}
        </p>

        <ol className={styles.steps}>
          {STEPS.map((label, i) => {
            const status = state.failed && i === state.current ? 'fail' : i < state.current ? 'done' : i === state.current ? 'run' : 'wait';
            const cls = { fail: styles.stepFail, done: styles.stepDone, run: styles.stepRun, wait: '' }[status];
            return (
              <li key={label} className={`${styles.step} ${cls}`}>
                <span className={styles.stepMark} aria-hidden="true">
                  {status === 'done' && <IconCheck size={16} />}
                  {status === 'run' && <span className={styles.mini} />}
                  {status === 'fail' && <IconAlert size={16} />}
                  {status === 'wait' && <span className={styles.dot} />}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        {state.failed && (
          <div className={styles.actions}>
            <Button to="/login" variant="primary">
              로그인 화면으로
            </Button>
            <Button to="/" variant="secondary">
              메인으로
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
