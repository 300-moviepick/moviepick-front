import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useLogout } from '../hooks/useLogout';
import { IconButton } from '../ui/Button';
import {
  IconClose,
  IconDatabase,
  IconExternal,
  IconFileText,
  IconFlag,
  IconGrid,
  IconLogout,
  IconMenu,
  IconUsers,
} from '../ui/icons';
import Logo from '../ui/Logo';
import { Avatar } from '../ui/Poster';
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
];

// 관리자 화면 공통 틀 (Stitch 15~19번). RequireAdmin 뒤에서 쓴다.
export default function AdminLayout() {
  const { user } = useAuth();
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  // 모바일 상단 바에 보여 줄 현재 메뉴 이름 (사이드바가 서랍으로 숨는 폭에서만 보인다)
  const { pathname } = useLocation();
  const current = SECTIONS.flatMap((s) => s.items).find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  );

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
          {current && <span className={styles.currentMenu}>{current.label}</span>}
          <div className={styles.account}>
            <Avatar name={user?.nickname} size={32} />
            <div className={styles.accountText}>
              <strong>{user?.nickname}</strong>
              <span>{user?.email}</span>
            </div>
            <IconButton label="로그아웃" size="sm" onClick={logout}>
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
