// 화면 표시용 형식 함수. 서버 값이 없으면 null/빈 문자열을 돌려 화면이 대체 표시를 고르게 한다.

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

/**
 * TMDB 상대 경로(/abc.jpg)를 이미지 주소로 바꾼다.
 * 이미 완성된 주소(posterUrl 등)는 그대로 둔다. size 예: w92, w185, w342, w500, w780, original
 */
export function tmdbImage(path, size = 'w500') {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function yearOf(date) {
  if (!date) return '';
  return String(date).slice(0, 4);
}

// 2026-11-02 → 2026.11.02
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${formatDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 방금 전 / n분 전 / n시간 전 / n일 전 / 날짜
export function timeAgo(value, now = Date.now()) {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return String(value);
  const diff = Math.max(0, now - t) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return formatDate(value);
}

// 1234 → 1,234 / 12345 → 1.2만
export function formatCount(n) {
  if (n === null || n === undefined) return '';
  const v = Number(n);
  if (Number.isNaN(v)) return String(n);
  if (v >= 10000) return `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}만`;
  return v.toLocaleString('ko-KR');
}

export function formatRuntime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}시간 ${m}분` : `${m}분`;
}

// 닉네임 첫 글자(아바타용)
export function initialOf(name) {
  if (!name) return '?';
  return String(name).trim().slice(0, 2).toUpperCase();
}
