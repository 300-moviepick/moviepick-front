import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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

  const link = ({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`;

  const onLogout = async () => {
    await logout().catch(() => {});
    navigate('/');
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

        <nav className={styles.nav}>
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
