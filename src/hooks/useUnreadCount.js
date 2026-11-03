import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationApi } from '../api/moviepick';

// 알림 읽음 처리 후 화면에서 dispatch하면 헤더·사이드바의 안 읽은 수가 다시 조회된다.
export const NOTIFICATIONS_CHANGED = 'mp:notifications-changed';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

/**
 * 안 읽은 알림 수. 로그인 상태에서만 조회한다.
 * 주기적 반복 조회는 하지 않고, 화면 이동·창 포커스·읽음 처리 이벤트 때만 다시 조회한다(서버 부하 C-10).
 * 실패하면 null(배지 숨김).
 */
export function useUnreadCount(enabled) {
  const { pathname } = useLocation();
  const [state, setState] = useState({ count: null, tick: 0 });

  useEffect(() => {
    if (!enabled) return undefined;
    const bump = () => setState((s) => ({ ...s, tick: s.tick + 1 }));
    window.addEventListener('focus', bump);
    window.addEventListener(NOTIFICATIONS_CHANGED, bump);
    return () => {
      window.removeEventListener('focus', bump);
      window.removeEventListener(NOTIFICATIONS_CHANGED, bump);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    notificationApi
      .unreadCount()
      .then((res) => active && setState((s) => ({ ...s, count: res?.unreadCount ?? 0 })))
      .catch(() => active && setState((s) => ({ ...s, count: null })));
    return () => {
      active = false;
    };
  }, [enabled, pathname, state.tick]);

  return enabled ? state.count : null;
}
