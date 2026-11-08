import { ApiError } from '../api/client';

export function errorCodeOf(error) {
  return error instanceof ApiError ? error.body?.errorCode ?? null : null;
}

// 대상이 없는 경우. 숫자가 아닌 ID 등 형식이 틀린 주소(400)도 같은 "찾을 수 없음"으로 본다.
export function isNotFound(error) {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}

/**
 * 입력 검증 오류(400 INVALID_INPUT)는 서버가 "필드명: 메시지" 한 줄로 보낸다(GlobalExceptionHandler).
 * fields에 있는 필드면 { field, message }로 나눠 돌려주고, 아니면 null.
 */
export function fieldErrorOf(error, fields) {
  if (!(error instanceof ApiError) || error.status !== 400) return null;
  const match = /^(\w+):\s*(.+)$/s.exec(error.message || '');
  if (!match || !fields.includes(match[1])) return null;
  return { field: match[1], message: match[2] };
}

// 사용자에게 보여 줄 문장. 연결 실패는 따로 안내한다.
export function messageOf(error) {
  if (error instanceof ApiError && error.status === 0) {
    return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }
  return error?.message || '요청을 처리하지 못했습니다.';
}
