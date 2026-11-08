import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, commentApi, postApi, reviewApi } from '../../api/moviepick';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import { formatCount, formatDateTime } from '../../lib/format';
import { Badge, RatingBadge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconArrowLeft, IconEyeOff, IconFileText, IconMessage, IconSearch } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import Tabs from '../../ui/Tabs';
import { useToast } from '../../ui/toast/useToast';
import AdminPageHeader from './AdminPageHeader';
import styles from './Admin.module.css';

const PAGE_SIZE = 20;
const TABS = [
  { value: 'posts', label: '게시글' },
  { value: 'reviews', label: '리뷰' },
  { value: 'comments', label: '댓글' },
];

// 조치 종류별 대화상자 문구와 요청
const ACTIONS = {
  blindPost: {
    title: '게시글을 숨길까요?',
    message: (t) => `‘${t.title}’ 게시글이 일반 사용자에게 보이지 않게 됩니다.`,
    confirm: '숨김 처리',
    run: (t) => adminApi.blindPost(t.postId),
    done: '게시글을 숨김 처리했습니다.',
  },
  blindReview: {
    title: '리뷰를 숨길까요?',
    message: (t) => `#${t.reviewId} 리뷰의 평점·내용이 가려지고 ‘숨겨진 리뷰’로 표시됩니다.`,
    confirm: '숨김 처리',
    run: (t) => adminApi.blindReview(t.reviewId),
    done: '리뷰를 숨김 처리했습니다.',
  },
  blindComment: {
    title: '댓글을 숨길까요?',
    message: (t) => `#${t.commentId} 댓글의 내용이 가려지고 ‘관리자에 의해 가려진 댓글’로 표시됩니다.`,
    confirm: '숨김 처리',
    run: (t) => adminApi.blindComment(t.commentId),
    done: '댓글을 숨김 처리했습니다.',
  },
};

/**
 * 콘텐츠 관리 (Stitch 18번, D-5: 게시글·댓글·리뷰 관리를 하나로 통합).
 * 관리자 전용 목록 API가 없어 공개 목록을 사용한다:
 * - 게시글: GET /api/community/posts (숨김·삭제 글은 목록에 없음) → PATCH /api/admin/posts/{postId}/blind
 * - 리뷰: GET /api/movies/reviews (공개 영화의 공개·숨김 리뷰) → PATCH /api/admin/reviews/{reviewId}/blind
 * - 댓글: 게시글별 GET /api/community/posts/{postId}/comments (숨긴 댓글은 blinded=true, 안내 문구로 남음)
 *   → PATCH /api/admin/comments/{commentId}/blind
 */
export default function AdminContentScreen() {
  const toast = useToast();
  const [tab, setTab] = useState('posts');
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [commentPost, setCommentPost] = useState(null); // { postId, title }
  const [pending, setPending] = useState(null); // { type, target }
  const [busy, setBusy] = useState(false);

  const list = useAsync(() => {
    if (tab === 'posts') return postApi.list({ q: q || undefined, page, size: PAGE_SIZE });
    if (tab === 'reviews') return reviewApi.listAll({ sort: 'latest', page, size: PAGE_SIZE });
    if (commentPost) return commentApi.list(commentPost.postId, { page, size: PAGE_SIZE });
    return Promise.resolve(null);
  }, [tab, page, q, commentPost?.postId]);

  const changeTab = (v) => {
    setTab(v);
    setPage(0);
  };

  const openComments = (post) => {
    setCommentPost({ postId: post.postId, title: post.title });
    setTab('comments');
    setPage(0);
  };

  const runAction = async () => {
    const def = ACTIONS[pending.type];
    setBusy(true);
    try {
      await def.run(pending.target);
      toast.success(def.done);
      setPending(null);
      list.reload();
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const items = list.data?.content ?? [];

  const renderTable = () => {
    if (tab === 'comments' && !commentPost) {
      return (
        <EmptyState
          icon={<IconMessage size={22} />}
          title="게시글을 먼저 선택하세요"
          description="전체 댓글 목록 API가 없어 게시글별로 댓글을 확인합니다. ‘게시글’ 탭에서 ‘댓글 보기’를 누르세요."
          action={
            <Button size="sm" variant="secondary" onClick={() => changeTab('posts')}>
              게시글 목록으로
            </Button>
          }
          compact
        />
      );
    }
    if (list.loading && !list.data) return <LoadingState variant="list" count={5} />;
    if (list.error) return <ErrorState error={list.error} onRetry={list.reload} />;
    if (items.length === 0) return <EmptyState icon={<IconFileText size={22} />} title="표시할 콘텐츠가 없습니다" compact />;

    if (tab === 'posts') {
      return (
        <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>반응</th>
              <th>작성일</th>
              <th aria-label="조치" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.postId}>
                <td className={styles.mono}>#{p.postId}</td>
                <td className={styles.ellipsisCell}>
                  <Link to={`/community/${p.postId}`} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
                    {p.title}
                  </Link>
                </td>
                <td>{p.author?.nickname}</td>
                <td className={`${styles.mono} ${styles.reactions}`}>
                  좋아요 {formatCount(p.likeCount)} · 댓글 {formatCount(p.commentCount)} · 조회 {formatCount(p.viewCount)}
                </td>
                <td className={styles.mono}>{formatDateTime(p.createdAt)}</td>
                <td className={styles.actionsCell}>
                  <Button size="sm" variant="ghost" icon={<IconMessage size={14} />} onClick={() => openComments(p)}>
                    댓글 보기
                  </Button>
                  <Button size="sm" variant="secondary" icon={<IconEyeOff size={14} />} onClick={() => setPending({ type: 'blindPost', target: p })}>
                    숨김
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (tab === 'reviews') {
      return (
        <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
          <thead>
            <tr>
              <th>번호</th>
              <th>영화 / 내용</th>
              <th>작성자</th>
              <th>평점</th>
              <th>작성일</th>
              <th aria-label="조치" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.reviewId}>
                <td className={styles.mono}>#{r.reviewId}</td>
                <td className={styles.ellipsisCell}>
                  <Link to={`/movies/${r.movie?.movieId}`} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
                    {r.movie?.title}
                  </Link>
                  <small>{r.blinded ? '숨겨진 리뷰' : r.content}</small>
                </td>
                <td>{r.author?.nickname}</td>
                <td>{r.blinded ? <Badge tone="secondary">숨김</Badge> : <RatingBadge value={r.rating} size="sm" />}</td>
                <td className={styles.mono}>{formatDateTime(r.createdAt)}</td>
                <td className={styles.actionsCell}>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<IconEyeOff size={14} />}
                    disabled={r.blinded}
                    onClick={() => setPending({ type: 'blindReview', target: r })}
                  >
                    {r.blinded ? '숨김됨' : '숨김'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className={`${styles.table} ${list.loading ? styles.stale : ''}`}>
        <thead>
          <tr>
            <th>번호</th>
            <th>내용</th>
            <th>작성자</th>
            <th>작성일</th>
            <th aria-label="조치" />
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.commentId}>
              <td className={styles.mono}>#{c.commentId}</td>
              <td className={styles.ellipsisCell}>
                {/* 숨긴 댓글은 서버가 원문 대신 안내 문구를 보낸다 */}
                {c.blinded ? <small>{c.content}</small> : <span>{c.content}</span>}
              </td>
              <td>{c.author?.nickname}</td>
              <td className={styles.mono}>{formatDateTime(c.createdAt)}</td>
              <td className={styles.actionsCell}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<IconEyeOff size={14} />}
                  disabled={c.blinded}
                  onClick={() => setPending({ type: 'blindComment', target: c })}
                >
                  {c.blinded ? '숨김됨' : '숨김'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const def = pending ? ACTIONS[pending.type] : null;

  return (
    <div className={styles.page}>
      <AdminPageHeader
        crumb="CONTENT CONTROL"
        title="콘텐츠 관리"
        subtitle="Content Moderation Hub"
        description="게시글·리뷰·댓글을 숨깁니다. 신고 기반 처리는 ‘신고 관리’에서 하세요."
      />

      <div className={styles.statGrid}>
        <ComingSoon variant="banner" title="콘텐츠 현황 통계" description="전체·숨김·자동 감지 건수 집계는 준비 중입니다." />
        <ComingSoon variant="banner" title="자동 감지 필터 · 정상 복구" description="금칙어 감지, 숨김 해제, 일괄 처리는 준비 중입니다." />
      </div>

      <div className={styles.toolbar}>
        <Tabs ariaLabel="콘텐츠 종류" items={TABS} value={tab} onChange={changeTab} />
        {tab === 'posts' && (
          <form
            className={styles.searchBox}
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(new FormData(e.currentTarget).get('q')?.toString().trim() ?? '');
              setPage(0);
            }}
          >
            <IconSearch size={16} />
            <input name="q" type="search" defaultValue={q} maxLength={50} placeholder="게시글 제목·본문 검색" aria-label="게시글 검색" />
          </form>
        )}
      </div>

      {tab === 'comments' && commentPost && (
        <div className={styles.contextBar}>
          <Button size="sm" variant="ghost" icon={<IconArrowLeft size={14} />} onClick={() => changeTab('posts')}>
            게시글 목록
          </Button>
          <span>
            <strong>#{commentPost.postId}</strong> {commentPost.title} 의 댓글
          </span>
        </div>
      )}

      <section className={styles.panel} aria-label="콘텐츠 목록">
        <div className={styles.tableWrap}>{renderTable()}</div>
        {list.data && items.length > 0 && <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={setPage} summary={`총 ${formatCount(list.data.totalElements)}건`} />}
        <p className={styles.footnote}>
          관리자 전용 목록 API가 없어 공개 목록을 사용합니다. 이미 숨김·삭제된 게시글은 목록에 나오지 않습니다.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(pending)}
        title={def?.title ?? ''}
        message={def ? def.message(pending.target) : ''}
        confirmText={def?.confirm ?? ''}
        danger
        loading={busy}
        onConfirm={runAction}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
