import { useCallback, useEffect, useRef, useState } from 'react';

function sameDeps(a, b) {
  return a !== null && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}

/**
 * 비동기 데이터 조회 상태. deps가 바뀌거나 reload()를 부르면 다시 조회한다.
 * - data: 마지막으로 받은 값(다시 조회 중에도 이전 값을 유지해 화면 깜빡임을 줄인다)
 * - loading: 현재 deps에 대한 결과가 아직 없음
 * - setData: 낙관적 갱신(좋아요 수 등)
 * 상태 변경은 모두 Promise 콜백에서 하므로 effect 안에서 동기적으로 setState하지 않는다.
 */
export function useAsync(fn, deps = []) {
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ deps: null, data: undefined, error: null });
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  });

  const allDeps = [...deps, reloadKey];

  useEffect(() => {
    let active = true;
    const requestDeps = allDeps;
    Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => active && setResult({ deps: requestDeps, data, error: null }),
        (error) => active && setResult((prev) => ({ deps: requestDeps, data: prev.data, error })),
      );
    return () => {
      active = false;
    };
    // 호출하는 쪽이 넘긴 deps 배열로 다시 조회 시점을 정한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, allDeps);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const setData = useCallback((updater) => {
    setResult((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }));
  }, []);

  const settled = sameDeps(result.deps, allDeps);
  return {
    data: result.data,
    error: settled ? result.error : null,
    loading: !settled,
    reload,
    setData,
  };
}
