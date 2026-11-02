import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Button from './Button';
import { IconLock } from './icons';
import { EmptyState } from './StateViews';

// 로그인한 사용자만. 비로그인이면 /login?redirect=현재주소 로 보낸다.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children ?? <Outlet />;
}

// 관리자만. 화면 표시 여부만 정하고, 실제 권한 판단은 서버(/api/admin/** → ADMIN)가 한다.
export function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="mp" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <EmptyState
          icon={<IconLock size={22} />}
          title="관리자만 볼 수 있는 화면입니다"
          description="관리자 권한이 있는 계정으로 로그인해 주세요."
          action={
            <Button to="/" variant="secondary">
              메인으로
            </Button>
          }
        />
      </div>
    );
  }
  return children ?? <Outlet />;
}
