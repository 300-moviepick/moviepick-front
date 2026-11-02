import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { fieldErrorOf, messageOf } from '../../lib/apiErrors';
import { safeRedirect } from '../../lib/authRedirect';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextField } from '../../ui/Field';
import { IconAlert, IconArrowRight, IconEye, IconEyeOff, IconLock, IconUser } from '../../ui/icons';
import AuthVisual from './AuthVisual';
import SocialButtons from './SocialButtons';
import styles from './Auth.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = '이메일을 입력해 주세요.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = '올바른 이메일 형식이 아닙니다.';
  if (!password) errors.password = '비밀번호를 입력해 주세요.';
  else if (password.length > 72) errors.password = '비밀번호는 72자 이하여야 합니다.';
  return errors;
}

// 로그인 (Stitch 2번). POST /api/auth/login → AuthContext.login이 내 정보까지 불러온다.
export default function LoginScreen() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const justSignedUp = params.get('signedUp') === '1';

  const [form, setForm] = useState({ email: params.get('email') ?? '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const change = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(redirect, { replace: true });
    } catch (err) {
      const fieldErr = fieldErrorOf(err, ['email', 'password']);
      if (fieldErr) setErrors({ [fieldErr.field]: fieldErr.message });
      else setFormError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <div className={`mp-container ${styles.page}`}>
      <AuthVisual
        variant="login"
        title={
          <>
            오늘 밤,
            <br />
            <span className={styles.accent}>어떤 영화</span>를 볼까요?
          </>
        }
        description="찜해 둔 영화와 남긴 감상평, 커뮤니티 이야기를 이어서 확인하세요."
      />

      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.cardHead}>
          <Badge tone="primary">MEMBER ACCESS</Badge>
          <h1 id="login-title" className={styles.title}>
            다시 오신 것을 환영합니다
          </h1>
          <p className={styles.subtitle}>MoviePick 계정으로 로그인하세요.</p>
        </div>

        {justSignedUp && (
          <p className={styles.notice} role="status">
            회원가입이 완료되었습니다. 가입한 이메일로 로그인해 주세요.
          </p>
        )}

        <SocialButtons mode="login" redirect={redirect} />

        <div className={styles.divider}>
          <span>또는 이메일로 로그인</span>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          <TextField
            label="이메일"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="이메일 주소"
            icon={<IconUser size={18} />}
            value={form.email}
            onChange={change('email')}
            error={errors.email}
            maxLength={255}
            required
          />
          <TextField
            label="비밀번호"
            type={showPw ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            icon={<IconLock size={18} />}
            value={form.password}
            onChange={change('password')}
            error={errors.password}
            maxLength={72}
            required
            trailing={
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            }
          />

          {formError && (
            <p className={styles.formError} role="alert">
              <IconAlert size={16} />
              {formError}
            </p>
          )}

          <Button type="submit" variant="soft" size="lg" block loading={busy} iconRight={<IconArrowRight size={18} />}>
            로그인
          </Button>
        </form>

        <p className={styles.switch}>
          MoviePick이 처음이신가요?{' '}
          <Link to={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>회원가입하기</Link>
        </p>
      </section>
    </div>
  );
}
