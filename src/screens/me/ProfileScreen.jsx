import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { errorCodeOf, fieldErrorOf, messageOf } from '../../lib/apiErrors';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { Checkbox, TextField } from '../../ui/Field';
import { IconAlert, IconLock, IconUser } from '../../ui/icons';
import Modal from '../../ui/Modal';
import { Avatar } from '../../ui/Poster';
import { ComingSoon } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import MyPageHeader from './MyPageHeader';
import styles from './MyPage.module.css';

const ROLE_LABEL = { ADMIN: '관리자', USER: '일반 회원' };
const STATUS_LABEL = { ACTIVE: '정상', SUSPENDED: '이용 정지', WITHDRAWN: '탈퇴' };
const WITHDRAW_PHRASE = '탈퇴합니다';

// 닉네임 변경. PATCH /api/members/me { nickname } → 성공하면 AuthProvider의 내 정보도 다시 불러온다
function NicknameForm({ current, onSaved }) {
  const [value, setValue] = useState(current ?? '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const nick = value.trim();
    if (!nick) return setError('닉네임을 입력해 주세요.');
    if (nick.length > 50) return setError('닉네임은 50자 이하여야 합니다.');
    if (nick.toLowerCase().startsWith('withdrawn_')) return setError('사용할 수 없는 닉네임입니다.');
    if (nick === current) return setError('현재 닉네임과 같습니다.');
    setBusy(true);
    setError(null);
    try {
      await memberApi.updateMe({ nickname: nick });
      await onSaved(nick);
    } catch (err) {
      if (errorCodeOf(err) === 'DUPLICATE_NICKNAME') setError(err.message);
      else setError(fieldErrorOf(err, ['nickname'])?.message ?? messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.inlineForm} onSubmit={submit} noValidate>
      <TextField
        label="닉네임"
        aside="리뷰·커뮤니티에 표시됩니다"
        maxLength={50}
        showCount
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        error={error}
        disabled={busy}
      />
      <div className={styles.rowEnd}>
        <Button type="submit" variant="primary" loading={busy} disabled={value.trim() === current}>
          닉네임 저장
        </Button>
      </div>
    </form>
  );
}

/**
 * 회원 탈퇴 확인 대화상자. DELETE /api/members/me
 * 백엔드가 회원을 탈퇴 처리하고 모든 refresh 토큰을 무효화한다. 성공하면 화면도 로그아웃 상태로 바꾸고 메인으로 보낸다.
 */
function WithdrawDialog({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [agree, setAgree] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const ready = agree && phrase.trim() === WITHDRAW_PHRASE;

  const close = () => {
    if (busy) return;
    setAgree(false);
    setPhrase('');
    setError(null);
    onClose();
  };

  const withdraw = async () => {
    setBusy(true);
    setError(null);
    try {
      await memberApi.withdraw();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
      return;
    }
    // 서버에서는 이미 탈퇴·토큰 무효화가 끝났다. 로그인 가드가 /login으로 보내기 전에 메인으로 먼저 이동한 뒤,
    // 로그아웃 요청이 실패해도 화면은 로그아웃 상태로 만든다(AuthProvider logout의 finally)
    navigate('/', { replace: true });
    await logout().catch(() => {});
    toast.success('회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
  };

  return (
    <Modal
      open={open}
      title="회원 탈퇴"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            취소
          </Button>
          <Button variant="danger" disabled={!ready} loading={busy} onClick={withdraw}>
            탈퇴하기
          </Button>
        </>
      }
    >
      <div className={styles.withdraw}>
        <ul className={styles.withdrawList}>
          <li>탈퇴하면 이 계정으로 다시 로그인할 수 없습니다.</li>
          <li>작성한 리뷰와 게시글은 남아 있으며, 작성자는 ‘탈퇴한 회원’으로 표시됩니다.</li>
          <li>로그인된 모든 기기에서 로그아웃됩니다.</li>
        </ul>
        <Checkbox label="위 내용을 확인했습니다" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <TextField
          label={`확인을 위해 ‘${WITHDRAW_PHRASE}’를 입력해 주세요`}
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={WITHDRAW_PHRASE}
          autoComplete="off"
        />
        {error && (
          <p className={styles.formError} role="alert">
            <IconAlert size={16} />
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

// 프로필 및 계정 설정 (Stitch 4번). GET·PATCH /api/members/me
export default function ProfileScreen() {
  const { user, loadMe } = useAuth();
  const toast = useToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const onSaved = async () => {
    await loadMe().catch(() => {});
    toast.success('닉네임을 변경했습니다.');
  };

  return (
    <div className={styles.page}>
      <MyPageHeader
        eyebrow="MY CINEMA HUB"
        title="프로필 및 계정 설정"
        description="닉네임과 계정 정보를 관리합니다."
      />

      <section className={styles.profileGrid} aria-labelledby="profile-title">
        <div className={styles.profileCard}>
          <Avatar name={user?.nickname} size={88} />
          <strong className={styles.profileName}>{user?.nickname}</strong>
          <span className={styles.profileEmail}>{user?.email}</span>
          <div className={styles.badgeRow}>
            <Badge tone={user?.role === 'ADMIN' ? 'secondary' : 'primary'}>{ROLE_LABEL[user?.role] ?? user?.role}</Badge>
            <Badge tone={user?.status === 'ACTIVE' ? 'success' : 'secondary'}>{STATUS_LABEL[user?.status] ?? user?.status}</Badge>
          </div>
        </div>

        <div className={styles.panel}>
          <h2 id="profile-title" className={styles.panelTitle}>
            <IconUser size={18} /> 프로필 정보
          </h2>
          {/* key: 내 정보가 바뀌면 폼 초기값을 새로 잡는다 */}
          <NicknameForm key={user?.nickname} current={user?.nickname} onSaved={onSaved} />
          <div className={styles.readonlyRow}>
            <span className={styles.readonlyLabel}>로그인 이메일</span>
            <span className={styles.readonlyValue}>{user?.email}</span>
          </div>
          <ComingSoon variant="banner" title="한줄 소개 · 취향 태그 · 프로필 사진" description="프로필 꾸미기 기능은 준비 중입니다." />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="security-title">
        <div className={styles.panelHeadRow}>
          <h2 id="security-title" className={styles.panelTitle}>
            <IconLock size={18} /> 계정 보안 및 로그인 설정
          </h2>
          <ComingSoon variant="badge" />
        </div>
        <div className={styles.twoCol}>
          <ComingSoon variant="banner" title="비밀번호 변경 · 2단계 인증" description="계정 보안 기능은 준비 중입니다." />
          <ComingSoon variant="banner" title="로그인 기기 관리" description="현재 로그인된 기기 확인 기능은 준비 중입니다." />
        </div>
      </section>

      <section className={`${styles.panel} ${styles.dangerZone}`} aria-labelledby="danger-title">
        <div>
          <h2 id="danger-title" className={styles.panelTitle}>
            회원 탈퇴
          </h2>
          <p className={styles.muted}>탈퇴하면 이 계정으로 더 이상 로그인할 수 없습니다.</p>
        </div>
        <Button variant="ghost" onClick={() => setWithdrawOpen(true)}>
          회원 탈퇴
        </Button>
      </section>

      <WithdrawDialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}
