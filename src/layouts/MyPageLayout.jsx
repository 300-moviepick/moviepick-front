import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useUnread } from '../hooks/unreadContext';
import { ComingSoon } from '../ui/StateViews';
import { IconBell, IconBookmark, IconLogout, IconMessage, IconSliders, IconUser } from '../ui/icons';
import { Avatar } from '../ui/Poster';
import styles from './MyPageLayout.module.css';

// 마이페이지 공통 틀 (Stitch 4~7번). UserLayout 안, 로그인 가드 뒤에서 쓴다.
export default function MyPageLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = useUnread();
  const { pathname } = useLocation();
  const navRef = useRef(null);

  // 좁은 화면에서는 메뉴가 가로 스크롤이 되므로, 현재 메뉴가 보이도록 메뉴 안에서만 가운데로 옮긴다
  // (페이지 전체 스크롤은 건드리지 않는다)
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const active = nav.querySelector('[aria-current="page"]');
    if (!active) return;
    const left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [pathname]);

  const link = ({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`;

  // 로그인 가드가 /login으로 보내기 전에 메인으로 먼저 이동한다(UserHeader와 같은 이유)
  const onLogout = async () => {
    navigate('/', { replace: true });
    await logout().catch(() => {});
  };

  return (
    <div className={`mp-container ${styles.wrap}`}>
      <aside className={styles.sidebar} aria-label="마이페이지 메뉴">
        <div className={styles.profile}>
          <Avatar name={user?.nickname} size={40} />
          <div className={styles.profileText}>
            <strong>{user?.nickname}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className={styles.nav} ref={navRef}>
          <p className={styles.group}>마이페이지</p>
          <NavLink to="/me/profile" className={link}>
            <IconUser size={18} /> 시네필 프로필
          </NavLink>
          <NavLink to="/me/wishlist" className={link}>
            <IconBookmark size={18} /> 내 찜 목록
          </NavLink>
          <NavLink to="/me/reviews" className={link}>
            <IconMessage size={18} /> 작성한 리뷰 관리
          </NavLink>

          <p className={styles.group}>알림 및 설정</p>
          <NavLink to="/me/notifications" className={link}>
            <IconBell size={18} /> 알림 센터
            {unread > 0 && <span className={styles.count}>{unread > 99 ? '99+' : unread}</span>}
          </NavLink>
          <NavLink to="/me/notification-settings" className={link}>
            <IconSliders size={18} /> 알림 설정
            <span className={styles.soon}>
              <ComingSoon variant="badge" />
            </span>
          </NavLink>
        </nav>

        <button type="button" className={styles.logout} onClick={onLogout}>
          <IconLogout size={16} /> 로그아웃
        </button>
      </aside>

      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  );
}
