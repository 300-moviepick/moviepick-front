import { useCallback, useEffect, useState } from 'react';
import { wishlistApi } from '../api/moviepick';
import { errorCodeOf, messageOf } from '../lib/apiErrors';

// 영화별 찜 여부를 알려 주는 API가 없어서(C-07) 내 찜 목록 첫 페이지(최대 100개)로 판단한다.
const MAX_SIZE = 100;

/**
 * 로그인 상태에서 내 찜 영화 ID 집합을 관리한다.
 * - isWishlisted(movieId): 로그인 안 했으면 undefined(버튼 숨김), 아니면 boolean
 * - toggle(movieId): 추가/해제. 409 ALREADY_WISHLISTED·404 WISHLIST_NOT_FOUND는 서버 상태에 맞춰 보정한다
 * - truncated: 찜이 100개를 넘어 일부 영화의 표시가 정확하지 않을 수 있음
 */
export function useWishlistSet(enabled, { onError } = {}) {
  const [state, setState] = useState({ ids: new Set(), loaded: false, truncated: false });
  const [busy, setBusy] = useState(() => new Set());

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    wishlistApi
      .listMine({ page: 0, size: MAX_SIZE })
      .then((page) => {
        if (!active) return;
        setState({
          ids: new Set((page?.content ?? []).map((m) => m.movieId)),
          loaded: true,
          truncated: (page?.totalElements ?? 0) > MAX_SIZE,
        });
      })
      .catch(() => active && setState((s) => ({ ...s, loaded: true })));
    return () => {
      active = false;
    };
  }, [enabled]);

  const setHas = useCallback((movieId, has) => {
    setState((s) => {
      const ids = new Set(s.ids);
      if (has) ids.add(movieId);
      else ids.delete(movieId);
      return { ...s, ids };
    });
  }, []);

  const toggle = useCallback(
    async (movieId) => {
      const wasOn = state.ids.has(movieId);
      setBusy((b) => new Set(b).add(movieId));
      setHas(movieId, !wasOn);
      try {
        if (wasOn) await wishlistApi.remove(movieId);
        else await wishlistApi.add(movieId);
        return !wasOn;
      } catch (err) {
        const code = errorCodeOf(err);
        if (code === 'ALREADY_WISHLISTED') {
          setHas(movieId, true);
          return true;
        }
        if (code === 'WISHLIST_NOT_FOUND') {
          setHas(movieId, false);
          return false;
        }
        setHas(movieId, wasOn);
        onError?.(messageOf(err));
        return wasOn;
      } finally {
        setBusy((b) => {
          const next = new Set(b);
          next.delete(movieId);
          return next;
        });
      }
    },
    [state.ids, setHas, onError],
  );

  const isWishlisted = useCallback(
    (movieId) => (enabled && state.loaded ? state.ids.has(movieId) : undefined),
    [enabled, state],
  );

  return { isWishlisted, toggle, isBusy: (movieId) => busy.has(movieId), truncated: state.truncated };
}
