// 개발 서버 전용 공통 컴포넌트 미리보기 (/__ui). 운영 빌드에는 포함되지 않는다(App.jsx에서 import.meta.env.DEV일 때만 로드).
// 아래 값은 컴포넌트 모양 확인용 자리 표시 값이며 실제 서비스 데이터가 아니다.
import { useState } from 'react';
import { Badge, Chip, RatingBadge } from '../../ui/Badge';
import Button, { IconButton } from '../../ui/Button';
import MovieCard from '../../ui/cards/MovieCard';
import NotificationCard from '../../ui/cards/NotificationCard';
import PostCard from '../../ui/cards/PostCard';
import ReviewCard from '../../ui/cards/ReviewCard';
import StatCard from '../../ui/cards/StatCard';
import { Checkbox, Select, TextArea, TextField, Toggle } from '../../ui/Field';
import { IconHeart, IconPlus, IconSearch, IconShare, IconTrash, IconUsers } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import { ApiError } from '../../api/client';
import styles from './UiGalleryScreen.module.css';

const NOW = new Date().toISOString();
const SAMPLE_MOVIE = { movieId: 0, title: '영화 제목 자리', posterUrl: null, releaseDate: '2000-01-01', voteAverage: 0, averageRating: null };
const SAMPLE_REVIEW = {
  reviewId: 0,
  author: { memberId: 0, nickname: '닉네임' },
  rating: 3.5,
  content: '리뷰 본문 자리 표시 텍스트입니다.',
  spoiler: true,
  likeCount: 0,
  likedByMe: false,
  createdAt: NOW,
  blinded: false,
  rewritten: true,
};
const SAMPLE_POST = { postId: 0, title: '게시글 제목 자리', author: { memberId: 0, nickname: '닉네임' }, likeCount: 0, commentCount: 0, viewCount: 0, createdAt: NOW };
const SAMPLE_NOTI = { notificationId: 0, type: 'MOVIE_RELEASE', movieId: null, title: '알림 제목 자리', message: '알림 메시지 자리', read: false, createdAt: NOW };

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>{title}</h2>
      {children}
    </section>
  );
}

export default function UiGalleryScreen() {
  const [tab, setTab] = useState('a');
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [toggle, setToggle] = useState(true);
  const toast = useToast();

  return (
    <div className={`mp-container ${styles.page}`}>
      <header className={styles.header}>
        <Badge tone="tertiary">DEV ONLY</Badge>
        <h1 className={styles.h1}>공통 컴포넌트 미리보기</h1>
        <p className={styles.muted}>개발 서버에서만 열리는 화면입니다. 표시 값은 모양 확인용 자리 표시 값입니다.</p>
      </header>

      <Section title="버튼">
        <div className={styles.row}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger" icon={<IconTrash size={16} />}>
            Danger
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="soft" iconRight={<IconPlus size={16} />}>
            Soft
          </Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <IconButton label="공유">
            <IconShare size={18} />
          </IconButton>
          <IconButton label="삭제" variant="danger">
            <IconTrash size={18} />
          </IconButton>
        </div>
      </Section>

      <Section title="배지·칩·평점">
        <div className={styles.row}>
          <Badge>neutral</Badge>
          <Badge tone="primary">primary</Badge>
          <Badge tone="soft">soft</Badge>
          <Badge tone="secondary">secondary</Badge>
          <Badge tone="tertiary">BETA</Badge>
          <Badge tone="gold">gold</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="danger">danger</Badge>
          <Chip active>선택됨</Chip>
          <Chip>기본</Chip>
          <Chip disabled>비활성</Chip>
          <RatingBadge value={4.5} max="5.0" />
          <RatingBadge value={null} />
        </div>
      </Section>

      <Section title="입력">
        <div className={styles.grid2}>
          <TextField label="텍스트" placeholder="입력" icon={<IconSearch size={18} />} hint="도움말" />
          <TextField label="오류" required error="오류 메시지" defaultValue="값" />
          <TextArea label="여러 줄" placeholder="내용" showCount maxLength={100} defaultValue="" />
          <div className={styles.stack}>
            <Select label="선택" options={[{ value: 'a', label: '옵션 A' }, { value: 'b', label: '옵션 B' }]} />
            <Checkbox label="체크박스" description="설명" defaultChecked />
            <Toggle label="스위치" description="설명" checked={toggle} onChange={(e) => setToggle(e.target.checked)} />
            <Toggle label="비활성 스위치" disabled />
          </div>
        </div>
      </Section>

      <Section title="탭·페이지">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'a', label: '전체', count: 0 },
            { value: 'b', label: '탭 B' },
            { value: 'c', label: '비활성', disabled: true },
          ]}
        />
        <Tabs variant="underline" value={tab} onChange={setTab} items={[{ value: 'a', label: '밑줄 A' }, { value: 'b', label: '밑줄 B' }]} />
        <Pagination page={page} totalPages={12} onChange={setPage} summary={`${page + 1} / 12 페이지`} />
      </Section>

      <Section title="카드">
        <div className={styles.cards}>
          <MovieCard movie={SAMPLE_MOVIE} wishlisted={false} />
          <MovieCard movie={{ ...SAMPLE_MOVIE, averageRating: 4.2 }} wishlisted />
        </div>
        <ReviewCard review={SAMPLE_REVIEW} onLike={() => {}} onReport={() => {}} />
        <ReviewCard review={{ ...SAMPLE_REVIEW, blinded: true, spoiler: false, rating: null, content: null }} isMine onDelete={() => {}} />
        <div className={styles.grid2}>
          <PostCard post={SAMPLE_POST} />
          <PostCard post={SAMPLE_POST} variant="compact" />
        </div>
        <NotificationCard notification={SAMPLE_NOTI} onRead={() => {}} />
        <NotificationCard notification={{ ...SAMPLE_NOTI, read: true }} />
        <div className={styles.grid4}>
          <StatCard label="연결된 값" value="0" unit="명" icon={<IconUsers size={18} />} tone="primary" />
          <StatCard label="불러오는 중" loading />
          <StatCard label="API 없음" hint="집계 API가 없습니다" />
          <StatCard label="위험" value="0" unit="건" tone="danger" icon={<IconHeart size={18} />} />
        </div>
      </Section>

      <Section title="상태">
        <LoadingState />
        <LoadingState variant="grid" count={4} />
        <LoadingState variant="list" count={2} />
        <ErrorState error={new ApiError(0, null)} onRetry={() => {}} />
        <ErrorState error={new ApiError(403, { message: '접근 권한이 없습니다.' })} compact />
        <EmptyState title="빈 상태" description="표시할 항목이 없습니다." action={<Button size="sm">동작</Button>} />
        <ComingSoon variant="banner" title="배너형 준비 중" description="백엔드 기능이 없는 영역입니다." />
        <ComingSoon title="영역형 준비 중" description="아래 미리보기는 동작하지 않습니다.">
          <div className={styles.row}>
            <Chip>필터 A</Chip>
            <Chip>필터 B</Chip>
          </div>
        </ComingSoon>
      </Section>

      <Section title="대화상자·토스트">
        <div className={styles.row}>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            확인 대화상자
          </Button>
          <Button variant="secondary" onClick={() => toast.success('성공 토스트')}>
            성공 토스트
          </Button>
          <Button variant="secondary" onClick={() => toast.error('오류 토스트')}>
            오류 토스트
          </Button>
        </div>
        <ConfirmDialog
          open={confirm}
          title="삭제할까요?"
          message="확인 대화상자 미리보기입니다."
          danger
          confirmText="삭제"
          onConfirm={() => setConfirm(false)}
          onClose={() => setConfirm(false)}
        />
      </Section>
    </div>
  );
}
