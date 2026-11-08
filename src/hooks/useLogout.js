import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * 로그아웃. 먼저 메인으로 이동한 뒤 로그아웃한다.
 * 반대 순서면 로그인 필요 화면(/me, /admin 등)의 가드가 사용자 정보가 비는 순간
 * /login?redirect=… 로 먼저 보내 버린다. 로그아웃 요청이 실패해도 화면은 로그아웃 상태가 된다.
 */
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(async () => {
    navigate('/', { replace: true });
    await logout().catch(() => {});
  }, [logout, navigate]);
}
