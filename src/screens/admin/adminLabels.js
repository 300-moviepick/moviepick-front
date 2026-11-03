// 관리자 화면 공용 라벨 (백엔드 enum 값 → 표시 문구)

export const MEMBER_STATUS = {
  ACTIVE: { label: '정상', tone: 'success' },
  SUSPENDED: { label: '이용 정지', tone: 'secondary' },
  WITHDRAWN: { label: '탈퇴', tone: 'neutral' },
};

export const MEMBER_ROLE = {
  ADMIN: { label: '관리자', tone: 'soft' },
  USER: { label: '일반 회원', tone: 'neutral' },
};

export const REPORT_STATUS = {
  PENDING: { label: '처리 대기', tone: 'gold' },
  ACCEPTED: { label: '승인(조치)', tone: 'secondary' },
  REJECTED: { label: '반려', tone: 'neutral' },
};

export const REPORT_TARGET = {
  POST: { label: '게시글', tone: 'primary' },
  COMMENT: { label: '댓글', tone: 'tertiary' },
  REVIEW: { label: '리뷰', tone: 'gold' },
};

// CommunityReportRequest 허용 사유
export const REPORT_REASON = {
  SPAM: '스팸·홍보',
  ABUSE: '욕설·비방',
  SPOILER: '스포일러',
  ADULT: '음란·선정적 내용',
  ETC: '기타',
};

export const labelOf = (map, key) => map[key] ?? { label: key ?? '-', tone: 'neutral' };
