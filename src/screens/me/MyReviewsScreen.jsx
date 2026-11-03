import { useState } from 'react';
import { reviewApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import { Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import ReviewCard from '../../ui/cards/ReviewCard';
import StatCard from '../../ui/cards/StatCard';
import { IconArrowRight, IconMessage, IconStar } from '../../ui/icons';
import Modal, { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import ReviewForm from '../movies/ReviewForm';
import MyPageHeader from './MyPageHeader';
import styles from './MyPage.module.css';

const PAGE_SIZE = 10;

/**
 * 작성한 리뷰 관리 (Stitch 6번). GET /api/members/me/reviews (최신순)
 * - movieActive=false(공개 중지된 영화)면 영화 링크·수정을 막는다
 * - 평균 평점·공감 합계는 전체 집계 API가 없어 표시하지 않는다(현재 페이지로 계산하면 틀린 값이 됨)
 */
export default function MyReviewsScreen() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const list = useAsync(() => reviewApi.listMine({ page, size: PAGE_SIZE }), [page]);

  const data = list.data;
  const reviews = data?.content ?? [];
  const total = data?.totalElements;

  const update = async (body) => {
    await reviewApi.update(editing.reviewId, body);
    toast.success('리뷰를 수정했습니다.');
    setEditing(null);
    list.reload();
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await reviewApi.remove(deleting.reviewId);
      toast.success('리뷰를 삭제했습니다.');
      setDeleting(null);
      if (reviews.length <= 1 && page > 0) setPage(page - 1);
      else list.reload();
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <MyPageHeader eyebrow="ARCHIVE & CRITIQUES" title="작성한 리뷰 관리" description="내가 남긴 별점과 감상평을 한곳에서 관리하세요." />

      <div className={styles.statGrid}>
        <StatCard
          label="작성한 리뷰"
          value={total !== undefined ? total.toLocaleString('ko-KR') : list.error ? '-' : undefined}
          unit="편"
          icon={<IconMessage size={18} />}
          tone="primary"
          loading={list.loading && !data}
          dense
        />
        <StatCard label="평균 평점" icon={<IconStar size={18} />} hint="전체 집계 기능 준비 중" dense />
        <StatCard label="받은 공감" hint="전체 집계 기능 준비 중" dense />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.chips}>
          <Chip active>전체</Chip>
          <Chip disabled>스포일러 포함</Chip>
          <ComingSoon variant="badge" />
        </div>
        <span className={styles.muted}>최신 작성순</span>
      </div>

      {list.loading && !data ? (
        <LoadingState variant="list" count={3} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<IconMessage size={22} />}
          title="아직 작성한 리뷰가 없습니다"
          description="본 영화를 찾아 첫 번째 감상평을 남겨 보세요."
          action={
            <Button to="/movies" iconRight={<IconArrowRight size={16} />}>
              영화 탐색하기
            </Button>
          }
        />
      ) : (
        <>
          <div className={`${styles.reviewList} ${list.loading ? styles.stale : ''}`}>
            {reviews.map((r) => (
              <ReviewCard key={r.reviewId} review={r} isMine onEdit={setEditing} onDelete={setDeleting} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={Boolean(editing)} title={editing?.movie ? `‘${editing.movie.title}’ 리뷰 수정` : '리뷰 수정'} onClose={() => setEditing(null)} size="lg">
        {editing && <ReviewForm initial={editing} submitLabel="수정 완료" onSubmit={update} onCancel={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="리뷰를 삭제할까요?"
        message="삭제한 리뷰는 목록에서 사라집니다. 같은 영화에 다시 작성할 수 있습니다."
        confirmText="삭제"
        danger
        loading={deleteBusy}
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
