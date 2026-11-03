import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 로그인이 필요한 동작에서 로그인 화면으로 보내고, 끝나면 지금 화면으로 돌아오게 한다
export function useGoLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    const here = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(here)}`);
  }, [navigate, location.pathname, location.search]);
}
