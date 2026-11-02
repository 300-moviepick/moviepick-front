// 로그인 후 돌아갈 주소 처리.
// - 이메일 로그인: /login?redirect=/me/wishlist 처럼 쿼리로 전달
// - 소셜 로그인: 백엔드가 /oauth2/success로 고정 이동시키므로, 시작 전에 sessionStorage에 저장해 두고 성공 화면에서 꺼낸다

const KEY = 'mp:post-login-redirect';

// 같은 사이트 안의 경로만 허용한다(외부 주소·프로토콜 상대 주소 차단)
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  // 로그인 관련 화면으로 되돌아가지 않게 한다
  if (/^\/(login|signup|oauth2)(\/|\?|$)/.test(value)) return fallback;
  return value;
}

export function rememberRedirect(value) {
  try {
    sessionStorage.setItem(KEY, safeRedirect(value));
  } catch {
    // 저장소를 쓸 수 없으면 메인으로 돌아간다
  }
}

export function consumeRedirect() {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return safeRedirect(value);
  } catch {
    return '/';
  }
}
