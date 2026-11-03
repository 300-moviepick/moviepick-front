import { createContext, useContext } from 'react';

// UserLayout이 한 번 조회한 안 읽은 알림 수를 헤더·마이페이지 사이드바가 함께 쓴다.
export const UnreadContext = createContext(null);

export function useUnread() {
  return useContext(UnreadContext);
}
