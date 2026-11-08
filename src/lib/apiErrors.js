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

// AI 기능이 꺼져 있음. 컨트롤러가 등록되지 않아 404 PATH_NOT_FOUND가 된다.
// 같은 404라도 AI_RECOMMENDATION_NO_CANDIDATES 등은 꺼짐이 아니므로 status가 아니라 errorCode로 구분한다.
export function isAiOff(error) {
  return error instanceof ApiError && error.status === 404 && errorCodeOf(error) === 'PATH_NOT_FOUND';
}

// AI 추천 오류 코드별 안내. 없는 코드는 서버 message를 그대로 쓴다.
const AI_ERROR_MESSAGES = {
  AI_CREDIT_INSUFFICIENT: 'AI 크레딧이 부족합니다. 충전소에서 크레딧을 충전해 주세요.',
  AI_RECOMMENDATION_IN_PROGRESS: '같은 추천 요청을 처리하고 있습니다. 잠시 후 다시 시도해 주세요.',
  AI_CREDIT_REQUEST_ALREADY_FINALIZED: '이미 처리가 끝난 요청입니다. 다시 추천받기를 누르면 새 요청으로 보냅니다.',
  AI_RECOMMENDATION_FAILED: 'AI 추천을 만들지 못했습니다. 사용한 크레딧은 복구되었습니다.',
  AI_RECOMMENDATION_NO_CANDIDATES: '추천할 수 있는 영화를 찾지 못했습니다. 질문을 바꿔 다시 시도해 주세요.',
};

export function aiMessageOf(error) {
  return AI_ERROR_MESSAGES[errorCodeOf(error)] ?? messageOf(error);
}
