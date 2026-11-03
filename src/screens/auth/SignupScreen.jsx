import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { errorCodeOf, fieldErrorOf, messageOf } from '../../lib/apiErrors';
import { safeRedirect } from '../../lib/authRedirect';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextField } from '../../ui/Field';
import { IconAlert, IconArrowRight, IconEye, IconEyeOff, IconLock, IconUser } from '../../ui/icons';
import AuthVisual from './AuthVisual';
import SocialButtons from './SocialButtons';
import styles from './Auth.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const encoder = new TextEncoder();

// 백엔드 SignupRequest 검증과 같은 규칙
function validate({ email, password, passwordConfirm, nickname }) {
  const errors = {};
  const mail = email.trim();
  if (!mail) errors.email = '이메일을 입력해 주세요.';
  else if (mail.length > 255) errors.email = '이메일은 255자 이하여야 합니다.';
  else if (!EMAIL_RE.test(mail)) errors.email = '올바른 이메일 형식이 아닙니다.';
  else if (mail.toLowerCase().endsWith('@withdrawn.local')) errors.email = '사용할 수 없는 이메일입니다.';

  if (!password) errors.password = '비밀번호를 입력해 주세요.';
  else if (password.length < 8 || password.length > 72) errors.password = '비밀번호는 8자 이상 72자 이하여야 합니다.';
  else if (encoder.encode(password).length > 72)
    errors.password = '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다. (한글은 1자에 3바이트)';

  if (!passwordConfirm) errors.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.';
  else if (password !== passwordConfirm) errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';

  const nick = nickname.trim();
  if (!nick) errors.nickname = '닉네임을 입력해 주세요.';
  else if (nick.length > 50) errors.nickname = '닉네임은 50자 이하여야 합니다.';
  else if (nick.toLowerCase().startsWith('withdrawn_')) errors.nickname = '사용할 수 없는 닉네임입니다.';
  return errors;
}

// 회원가입 (Stitch 1번). POST /api/auth/members 후 같은 정보로 바로 로그인한다.
export default function SignupScreen() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (user && !busy) return <Navigate to={redirect} replace />;

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

    const email = form.email.trim();
    setBusy(true);
    try {
      await authApi.signup({ email, password: form.password, nickname: form.nickname.trim() });
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === 'DUPLICATE_EMAIL') setErrors({ email: err.message });
      else if (code === 'DUPLICATE_NICKNAME') setErrors({ nickname: err.message });
      else {
        const fieldErr = fieldErrorOf(err, ['email', 'password', 'nickname']);
        if (fieldErr) setErrors({ [fieldErr.field]: fieldErr.message });
        else setFormError(messageOf(err));
      }
      setBusy(false);
      return;
    }

    // 가입은 끝났으므로, 자동 로그인에 실패하면 로그인 화면으로 안내한다
    try {
      await login(email, form.password);
      navigate(redirect, { replace: true });
    } catch {
      navigate(`/login?signedUp=1&email=${encodeURIComponent(email)}`, { replace: true });
    }
  };

  const pwField = (key, label, placeholder, autoComplete) => (
    <TextField
      label={label}
      type={showPw ? 'text' : 'password'}
      name={key}
      autoComplete={autoComplete}
      placeholder={placeholder}
      icon={<IconLock size={18} />}
      value={form[key]}
      onChange={change(key)}
      error={errors[key]}
      maxLength={72}
      required
      trailing={
        key === 'password' && (
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        )
      }
    />
  );

  return (
    <div className={`mp-container ${styles.page}`}>
      <AuthVisual
        variant="signup"
        title={
          <>
            시네필을 위한
            <br />
            <span className={styles.accent}>단 하나의 공간</span>
          </>
        }
        description="영화 탐색부터 감상 기록, 커뮤니티까지 MoviePick에서 시작하세요."
      />

      <section className={styles.card} aria-labelledby="signup-title">
        <div className={styles.cardHead}>
          <Badge tone="primary">QUICK &amp; SECURE SETUP</Badge>
          <h1 id="signup-title" className={styles.title}>
            MoviePick 회원가입
          </h1>
          <p className={styles.subtitle}>간단한 정보만 입력하면 바로 시작할 수 있습니다.</p>
        </div>

        <SocialButtons mode="signup" redirect={redirect} />
        <p className={styles.help}>소셜 계정으로 가입하면 닉네임은 계정 정보로 자동 설정되며, 마이페이지에서 바꿀 수 있습니다.</p>

        <div className={styles.divider}>
          <span>또는 이메일로 회원가입</span>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          <TextField
            label="이메일 주소"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="이메일 주소"
            aside="로그인 아이디로 사용됩니다"
            icon={<IconUser size={18} />}
            value={form.email}
            onChange={change('email')}
            error={errors.email}
            maxLength={255}
            required
          />
          {pwField('password', '비밀번호', '8자 이상 입력', 'new-password')}
          {pwField('passwordConfirm', '비밀번호 확인', '비밀번호를 한 번 더 입력', 'new-password')}
          <TextField
            label="닉네임"
            name="nickname"
            autoComplete="nickname"
            placeholder="리뷰와 커뮤니티에 표시됩니다"
            value={form.nickname}
            onChange={change('nickname')}
            error={errors.nickname}
            maxLength={50}
            showCount
            required
          />

          {formError && (
            <p className={styles.formError} role="alert">
              <IconAlert size={16} />
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" block loading={busy} iconRight={<IconArrowRight size={18} />}>
            회원가입 완료하기
          </Button>
        </form>

        <p className={styles.switch}>
          이미 MoviePick 계정이 있으신가요?{' '}
          <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>로그인하기</Link>
        </p>
      </section>
    </div>
  );
}
