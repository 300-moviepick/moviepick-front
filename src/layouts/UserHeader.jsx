import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useUnread } from '../hooks/unreadContext';
import { useLogout } from '../hooks/useLogout';
import { Badge } from '../ui/Badge';
import Button, { IconButton } from '../ui/Button';
import { IconBell, IconChevronDown, IconClose, IconLogout, IconMenu, IconSearch, IconSettings, IconUser } from '../ui/icons';
import Logo from '../ui/Logo';
import { Avatar } from '../ui/Poster';
import styles from './UserHeader.module.css';

const NAV = [
  { to: '/movies', label: '영화 탐색' },
  { to: '/community', label: '커뮤니티' },
  { to: '/ai', label: 'AI 영화 추천', badge: 'BETA' },
  { to: '/support', label: '후원하기' },
];

// 메인 홈(Stitch 0번) 헤더 기준의 사용자 공통 헤더
export default function UserHeader() {
  const { user, isAdmin } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const searchRef = useRef(null);
  const userRef = useRef(null);
  const unread = useUnread();

  // ⌘K / Ctrl+K로 검색창 이동
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // 사용자 메뉴 바깥을 누르거나 Esc를 누르면 닫기
  useEffect(() => {
    if (!userOpen) return undefined;
    const onDown = (e) => {
      if (!userRef.current?.contains(e.target)) setUserOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setUserOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setUserOpen(false);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const keyword = new FormData(e.currentTarget).get('keyword')?.toString().trim();
    closeAll();
    navigate(keyword ? `/movies?keyword=${encodeURIComponent(keyword)}` : '/movies');
  };

  const onLogout = () => {
    closeAll();
    logout();
  };

  return (
    <header className={styles.header}>
      <div className={`mp-container ${styles.inner}`}>
        <Logo />

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="주 메뉴">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={closeAll}
            >
              {item.label}
              {item.badge && <Badge tone="tertiary">{item.badge}</Badge>}
            </NavLink>
          ))}
        </nav>

        <form className={styles.search} role="search" onSubmit={onSearch}>
          <IconSearch size={18} />
          <label htmlFor="mp-header-search" className="mp-sr-only">
            영화 검색
          </label>
          <input
            ref={searchRef}
            id="mp-header-search"
            name="keyword"
            type="search"
            placeholder="영화 제목 검색"
            defaultValue={params.get('keyword') ?? ''}
            key={params.get('keyword') ?? ''}
            autoComplete="off"
          />
        </form>

        <Link to="/movies" className={`${styles.bell} ${styles.searchLink}`} aria-label="영화 검색" onClick={closeAll}>
          <IconSearch size={20} />
        </Link>

        <div className={styles.right}>
          {user ? (
            <>
              <Link to="/me/notifications" className={styles.bell} aria-label={`알림${unread ? ` ${unread}개 안 읽음` : ''}`} onClick={closeAll}>
                <IconBell size={20} />
                {unread > 0 && <span className={styles.bellCount}>{unread > 99 ? '99+' : unread}</span>}
              </Link>
              <div className={styles.userMenu} ref={userRef}>
                <button
                  type="button"
                  className={styles.userBtn}
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                  onClick={() => setUserOpen((v) => !v)}
                >
                  <Avatar name={user.nickname} size={32} />
                  <span className={styles.userName}>{user.nickname}</span>
                  <IconChevronDown size={16} />
                </button>
                {userOpen && (
                  <div className={styles.dropdown} role="menu">
                    <div className={styles.dropdownHead}>
                      <strong>{user.nickname}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/me/profile" role="menuitem" className={styles.dropdownItem} onClick={closeAll}>
                      <IconUser size={18} /> 마이페이지
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" role="menuitem" className={styles.dropdownItem} onClick={closeAll}>
                        <IconSettings size={18} /> 관리자 콘솔
                      </Link>
                    )}
                    <button type="button" role="menuitem" className={styles.dropdownItem} onClick={onLogout}>
                      <IconLogout size={18} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Button to="/login" variant="ghost" size="sm" onClick={closeAll}>
                로그인
              </Button>
              <Button to="/signup" variant="primary" size="sm" onClick={closeAll}>
                회원가입
              </Button>
            </div>
          )}
          <IconButton
            label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
            className={styles.menuBtn}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}
