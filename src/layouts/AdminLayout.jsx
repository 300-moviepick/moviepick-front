import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { IconButton } from '../ui/Button';
import {
  IconBell,
  IconClose,
  IconDatabase,
  IconExternal,
  IconFileText,
  IconFlag,
  IconGrid,
  IconLogout,
  IconMenu,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconUsers,
} from '../ui/icons';
import Logo from '../ui/Logo';
import { Avatar } from '../ui/Poster';
import { ComingSoon } from '../ui/StateViews';
import styles from './AdminLayout.module.css';

const SECTIONS = [
  {
    title: 'OPERATIONAL CORE',
    items: [
      { to: '/admin', label: '대시보드', icon: IconGrid, end: true },
      { to: '/admin/members', label: '회원 관리', icon: IconUsers },
      { to: '/admin/reports', label: '신고 관리', icon: IconFlag },
    ],
  },
  {
    title: 'CONTENT CONTROL',
    items: [
      // 게시글·댓글·리뷰 관리를 하나로 통합 (D-5)
      { to: '/admin/content', label: '콘텐츠 관리', icon: IconFileText },
      { to: '/admin/movies', label: '영화 데이터 관리', icon: IconDatabase },
    ],
  },
  {
    title: 'ADVANCED SERVICES',
    items: [
      { label: 'AI & 크레딧 통계', icon: IconSparkles, soon: true },
      { label: '알림 발송 관리', icon: IconBell, soon: true },
      { label: '시스템 설정', icon: IconSettings, soon: true },
    ],
  },
];

// 관리자 화면 공통 틀 (Stitch 15~19번). RequireAdmin 뒤에서 쓴다.
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout().catch(() => {});
    navigate('/');
  };

  return (
    <div className={`mp ${styles.shell}`}>
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label="관리자 메뉴">
        <div className={styles.brand}>
          <Logo to="/admin" tag="admin" />
          <IconButton label="메뉴 닫기" size="sm" className={styles.closeBtn} onClick={() => setOpen(false)}>
            <IconClose size={18} />
          </IconButton>
        </div>

        <nav className={styles.nav}>
          {SECTIONS.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{section.title}</p>
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.soon) {
                  return (
                    <span key={item.label} className={`${styles.item} ${styles.disabled}`} aria-disabled="true">
                      <Icon size={18} /> {item.label}
                      <span className={styles.soonTag}>
                        <ComingSoon variant="badge" />
                      </span>
                    </span>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} /> {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <NavLink to="/" className={styles.serviceLink}>
          <IconExternal size={16} /> 서비스 바로가기
        </NavLink>
      </aside>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className={styles.body}>
        <header className={styles.header}>
          <IconButton label="메뉴 열기" className={styles.menuBtn} onClick={() => setOpen(true)}>
            <IconMenu size={20} />
          </IconButton>
          <div className={styles.search} title="관리자 통합 검색은 준비 중입니다">
            <IconSearch size={18} />
            <input type="search" placeholder="관리자 통합 검색" disabled aria-label="관리자 통합 검색 (준비 중)" />
            <ComingSoon variant="badge" />
          </div>
          <div className={styles.account}>
            <Avatar name={user?.nickname} size={32} />
            <div className={styles.accountText}>
              <strong>{user?.nickname}</strong>
              <span>{user?.email}</span>
            </div>
            <IconButton label="로그아웃" size="sm" onClick={onLogout}>
              <IconLogout size={18} />
            </IconButton>
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
