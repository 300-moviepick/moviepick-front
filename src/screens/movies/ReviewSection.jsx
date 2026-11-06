import { useState } from 'react';
import { reviewApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import Button from '../../ui/Button';
import ReviewCard from '../../ui/cards/ReviewCard';
import { IconMessage } from '../../ui/icons';
import Modal, { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import ReportDialog from '../../ui/ReportDialog';
import SectionHeader from '../../ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import ReviewForm from './ReviewForm';
import styles from './MovieDetail.module.css';

const PAGE_SIZE = 10;
// 백엔드 ReviewSort 값
const SORTS = [
  { value: 'likes', label: '공감순' },
  { value: 'latest', label: '최신순' },
  { value: 'ratingDesc', label: '평점 높은순' },
  { value: 'ratingAsc', label: '평점 낮은순' },
];

/**
 * 영화 상세의 리뷰 영역: 작성 폼, 정렬, 목록, 공감, 본인 수정·삭제, 신고.
 * onChanged는 평균 평점·리뷰 수·myReviewId가 바뀌었을 때 영화 상세를 다시 불러오게 한다.
 */
export default function ReviewSection({ movieId, myReviewId, reviewCount, onChanged, onLogin, id }) {
  const { user } = useAuth();
  const toast = useToast();
  const [sort, setSort] = useState('likes');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reporting, setReporting] = useState(null);
  const [likeBusy, setLikeBusy] = useState(null);

  const list = useAsync(() => reviewApi.listByMovie(movieId, { sort, page, size: PAGE_SIZE }), [movieId, sort, page]);
  const reviews = list.data?.content ?? [];
  const isMine = (r) => Boolean(user) && r.author?.memberId === user.memberId;
  const myReviewOnPage = myReviewId ? reviews.find((r) => r.reviewId === myReviewId) : null;

  const refreshAll = () => {
    list.reload();
    onChanged?.();
  };

  const create = async (body) => {
    await reviewApi.create(movieId, body);
    toast.success('리뷰를 등록했습니다.');
    setSort('latest');
    setPage(0);
    refreshAll();
  };

  const update = async (body) => {
    await reviewApi.update(editing.reviewId, body);
    toast.success('리뷰를 수정했습니다.');
    setEditing(null);
    refreshAll();
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await reviewApi.remove(deleting.reviewId);
      toast.success('리뷰를 삭제했습니다.');
      setDeleting(null);
      refreshAll();
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleLike = async (review) => {
    if (!user) return onLogin();
    setLikeBusy(review.reviewId);
    try {
      const res = review.likedByMe ? await reviewApi.unlike(review.reviewId) : await reviewApi.like(review.reviewId);
      list.setData((d) =>
        d && {
          ...d,
          content: d.content.map((r) => (r.reviewId === review.reviewId ? { ...r, likedByMe: res.liked, likeCount: res.likeCount } : r)),
        },
      );
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setLikeBusy(null);
    }
  };

  const openReport = (review) => (user ? setReporting(review) : onLogin());

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`} id={id}>
      <SectionHeader
        id={`${id}-title`}
        title="실시간 한줄평 및 시네필 리뷰"
        sub={`${reviewCount ?? 0}개`}
        action={
          <Tabs
            ariaLabel="리뷰 정렬"
            items={SORTS}
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(0);
            }}
          />
        }
      />

      {/* 작성 영역 */}
      <div className={styles.writeBox}>
        {!user ? (
          <div className={styles.writePrompt}>
            <p>로그인하고 이 영화의 감상평을 남겨 보세요.</p>
            <Button size="sm" onClick={onLogin}>
              로그인
            </Button>
          </div>
        ) : myReviewId ? (
          <div className={styles.writePrompt}>
            <p>이미 이 영화에 리뷰를 남겼습니다. 목록의 ‘내 리뷰’에서 수정하거나 삭제할 수 있습니다.</p>
            {myReviewOnPage && (
              <Button size="sm" variant="secondary" onClick={() => setEditing(myReviewOnPage)}>
                내 리뷰 수정
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.writeHead}>
              <strong>{user.nickname}</strong>
              <span>님의 감상을 남겨 주세요</span>
            </div>
            <ReviewForm onSubmit={create} resetOnSuccess />
          </>
        )}
      </div>

      {/* 목록 */}
      {list.loading && !list.data ? (
        <LoadingState variant="list" count={3} />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} compact />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<IconMessage size={22} />} title="아직 리뷰가 없습니다" description="첫 번째 감상평을 남겨 보세요." compact />
      ) : (
        <>
          <div className={`${styles.reviewList} ${list.loading ? styles.stale : ''}`}>
            {reviews.map((r) => (
              <ReviewCard
                key={r.reviewId}
                review={r}
                isMine={isMine(r)}
                onLike={toggleLike}
                likeBusy={likeBusy === r.reviewId}
                onEdit={isMine(r) ? setEditing : undefined}
                onDelete={isMine(r) ? setDeleting : undefined}
                onReport={openReport}
              />
            ))}
          </div>
          <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={Boolean(editing)} title="리뷰 수정" onClose={() => setEditing(null)} size="lg">
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

      <ReportDialog
        open={Boolean(reporting)}
        targetLabel="리뷰"
        onSubmit={(body) => reviewApi.report(reporting.reviewId, body)}
        onClose={() => setReporting(null)}
        onDone={() => {
          setReporting(null);
          toast.success('신고가 접수되었습니다.');
        }}
      />
    </section>
  );
}
