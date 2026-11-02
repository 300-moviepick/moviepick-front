import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UnreadContext } from '../hooks/unreadContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import UserFooter from './UserFooter';
import UserHeader from './UserHeader';
import styles from './UserLayout.module.css';

// 사용자 화면 공통 틀: 헤더 + 본문 + 푸터
export default function UserLayout() {
  const { user } = useAuth();
  const unread = useUnreadCount(Boolean(user));

  return (
    <UnreadContext.Provider value={unread}>
      <div className={`mp ${styles.shell}`}>
        <a href="#mp-main" className={styles.skip}>
          본문으로 건너뛰기
        </a>
        <UserHeader />
        <main id="mp-main" className={styles.main}>
          <Outlet />
        </main>
        <UserFooter />
      </div>
    </UnreadContext.Provider>
  );
}
