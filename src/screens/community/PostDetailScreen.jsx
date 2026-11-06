import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { commentApi, postApi } from '../../api/moviepick';
import { useAuth } from '../../auth/useAuth';
import { useAsync } from '../../hooks/useAsync';
import { useGoLogin } from '../../hooks/useGoLogin';
import { messageOf } from '../../lib/apiErrors';
import { formatCount, formatDateTime } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextArea } from '../../ui/Field';
import { IconArrowLeft, IconEdit, IconEye, IconFlag, IconHeart, IconMessage, IconShare, IconTrash } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import Pagination from '../../ui/Pagination';
import { Avatar } from '../../ui/Poster';
import ReportDialog from '../../ui/ReportDialog';
import SectionHeader from '../../ui/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import CommentItem from './CommentItem';
import styles from './Community.module.css';

const COMMENT_PAGE_SIZE = 20;

/*
 * 게시글 상세 (Stitch 11번).
 * 주의: GET /api/community/posts/{postId}는 조회수를 올리므로, 댓글 작성·삭제 뒤에 게시글을 다시 부르지 않고
 * 화면의 댓글 수만 직접 맞춘다(댓글 수 미갱신 문제 BUG-006 대응).
 */
export default function PostDetailScreen() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const goLogin = useGoLogin();

  const post = useAsync(() => postApi.detail(postId), [postId]);
  const [commentPage, setCommentPage] = useState(0);
  const comments = useAsync(() => commentApi.list(postId, { page: commentPage, size: COMMENT_PAGE_SIZE }), [postId, commentPage]);

  const [postLikeBusy, setPostLikeBusy] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [report, setReport] = useState(null); // { type: 'post' | 'comment', id }
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const [likeBusyId, setLikeBusyId] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);

  const data = post.data && String(post.data.postId) === String(postId) ? post.data : null;

  if (!data) {
    if (post.error) {
      const notFound = post.error instanceof ApiError && (post.error.status === 404 || post.error.status === 400);
      return (
        <div className={`mp-container ${styles.page}`}>
          {notFound ? (
            <EmptyState
              icon={<IconMessage size={22} />}
              title="게시글을 찾을 수 없습니다"
              description="삭제되었거나 숨김 처리된 게시글입니다."
              action={
                <Button to="/community" variant="secondary" icon={<IconArrowLeft size={16} />}>
                  목록으로
                </Button>
              }
            />
          ) : (
            <ErrorState error={post.error} onRetry={post.reload} />
          )}
        </div>
      );
    }
    return (
      <div className={`mp-container ${styles.page}`}>
        <LoadingState label="게시글을 불러오는 중…" />
      </div>
    );
  }

  const mine = Boolean(user) && data.author?.memberId === user.memberId;
  const edited = data.updatedAt && data.createdAt && data.updatedAt !== data.createdAt;
  const adjustCommentCount = (delta) => post.setData((d) => d && { ...d, commentCount: Math.max(0, (d.commentCount ?? 0) + delta) });

  const toggleLike = async () => {
    if (!user) return goLogin();
    setPostLikeBusy(true);
    try {
      const res = data.likedByMe ? await postApi.unlike(postId) : await postApi.like(postId);
      post.setData((d) => d && { ...d, likedByMe: res.liked, likeCount: res.likeCount });
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setPostLikeBusy(false);
    }
  };

  const removePost = async () => {
    setDeleteBusy(true);
    try {
      await postApi.remove(postId);
      toast.success('게시글을 삭제했습니다.');
      navigate('/community', { replace: true });
    } catch (err) {
      toast.error(messageOf(err));
      setDeleteBusy(false);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('게시글 주소를 복사했습니다.');
    } catch {
      toast.error('주소를 복사하지 못했습니다.');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const value = commentText.trim();
    if (!value) return setCommentError('댓글 내용을 입력해 주세요.');
    setCommentBusy(true);
    setCommentError(null);
    try {
      await commentApi.create(postId, { content: value });
      setCommentText('');
      adjustCommentCount(1);
      // 오래된 순 정렬이라 새 댓글은 마지막 페이지에 있다
      const newTotal = (comments.data?.totalElements ?? 0) + 1;
      const lastPage = Math.max(0, Math.ceil(newTotal / COMMENT_PAGE_SIZE) - 1);
      if (lastPage === commentPage) comments.reload();
      else setCommentPage(lastPage);
    } catch (err) {
      setCommentError(messageOf(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const saveComment = async (comment, content) => {
    const res = await commentApi.update(comment.commentId, { content });
    comments.setData((d) => d && { ...d, content: d.content.map((c) => (c.commentId === comment.commentId ? { ...c, content: res.content } : c)) });
    toast.success('댓글을 수정했습니다.');
  };

  const removeComment = async () => {
    try {
      await commentApi.remove(deletingComment.commentId);
      toast.success('댓글을 삭제했습니다.');
      adjustCommentCount(-1);
      setDeletingComment(null);
      // 마지막 댓글을 지워 페이지가 비면 앞 페이지로
      if ((comments.data?.content.length ?? 0) <= 1 && commentPage > 0) setCommentPage(commentPage - 1);
      else comments.reload();
    } catch (err) {
      toast.error(messageOf(err));
    }
  };

  const toggleCommentLike = async (comment) => {
    if (!user) return goLogin();
    setLikeBusyId(comment.commentId);
    try {
      const res = comment.likedByMe ? await commentApi.unlike(comment.commentId) : await commentApi.like(comment.commentId);
      comments.setData(
        (d) =>
          d && {
            ...d,
            content: d.content.map((c) => (c.commentId === comment.commentId ? { ...c, likedByMe: res.liked, likeCount: res.likeCount } : c)),
          },
      );
    } catch (err) {
      toast.error(messageOf(err));
    } finally {
      setLikeBusyId(null);
    }
  };

  const openReport = (type, id) => (user ? setReport({ type, id }) : goLogin());
  const commentList = comments.data?.content ?? [];

  return (
    <div className={`mp-container ${styles.page}`}>
      <nav className={styles.breadcrumb} aria-label="위치">
        <Link to="/community" className={styles.backLink}>
          <IconArrowLeft size={16} /> 시네마 라운지
        </Link>
      </nav>

      <article className={styles.article}>
        <header className={styles.articleHead}>
          {data.status === 'BLINDED' && <Badge tone="danger">숨김 처리된 게시글 (관리자만 볼 수 있음)</Badge>}
          <h1 className={styles.articleTitle}>{data.title}</h1>
          <div className={styles.authorRow}>
            <Avatar name={data.author?.nickname} size={40} />
            <div className={styles.authorText}>
              <strong>
                {data.author?.nickname} {mine && <Badge tone="primary">내 글</Badge>}
              </strong>
              <span>
                {formatDateTime(data.createdAt)}
                {edited && ' (수정됨)'}
              </span>
            </div>
            <div className={styles.articleStats}>
              <span title="조회수">
                <IconEye size={15} /> {formatCount(data.viewCount)}
              </span>
              <span title="좋아요">
                <IconHeart size={15} /> {formatCount(data.likeCount)}
              </span>
              <span title="댓글">
                <IconMessage size={15} /> {formatCount(data.commentCount)}
              </span>
            </div>
          </div>
          {mine && (
            <div className={styles.ownerActions}>
              <Button to={`/community/${postId}/edit`} variant="secondary" size="sm" icon={<IconEdit size={15} />}>
                수정
              </Button>
              <Button variant="ghost" size="sm" icon={<IconTrash size={15} />} onClick={() => setDeletingPost(true)}>
                삭제
              </Button>
            </div>
          )}
        </header>

        <div className={styles.articleBody}>{data.content}</div>

        <footer className={styles.articleFoot}>
          <button
            type="button"
            className={`${styles.bigAction} ${data.likedByMe ? styles.bigActionOn : ''}`}
            aria-pressed={!!data.likedByMe}
            onClick={toggleLike}
            disabled={postLikeBusy || mine}
            title={mine ? '내 글에는 좋아요할 수 없습니다' : undefined}
          >
            <IconHeart size={20} filled={data.likedByMe} />
            <span>좋아요 {formatCount(data.likeCount)}</span>
          </button>
          <button type="button" className={styles.bigAction} onClick={share}>
            <IconShare size={20} />
            <span>공유</span>
          </button>
          {!mine && (
            <button type="button" className={styles.bigAction} onClick={() => openReport('post', data.postId)}>
              <IconFlag size={20} />
              <span>신고</span>
            </button>
          )}
        </footer>
      </article>

      <section className={styles.commentsSection} aria-labelledby="comments-title">
        <SectionHeader id="comments-title" title="시네필 토론 및 댓글" sub={`${formatCount(data.commentCount)}개`} />

        {user ? (
          <form className={styles.commentForm} onSubmit={submitComment}>
            <TextArea
              label={`${user.nickname}(으)로 댓글 작성`}
              rows={3}
              maxLength={500}
              showCount
              placeholder="영화에 대한 생각을 자유롭게 남겨 주세요."
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                setCommentError(null);
              }}
              error={commentError}
              disabled={commentBusy}
            />
            <div className={styles.rowEnd}>
              <Button type="submit" variant="primary" loading={commentBusy}>
                댓글 등록
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.loginPrompt}>
            <p>로그인하고 토론에 참여해 보세요.</p>
            <Button size="sm" onClick={goLogin}>
              로그인
            </Button>
          </div>
        )}

        {comments.loading && !comments.data ? (
          <LoadingState variant="list" count={2} />
        ) : comments.error ? (
          <ErrorState error={comments.error} onRetry={comments.reload} compact />
        ) : commentList.length === 0 ? (
          <EmptyState icon={<IconMessage size={22} />} title="첫 번째 댓글을 남겨 보세요" compact />
        ) : (
          <>
            <ul className={`${styles.commentList} ${comments.loading ? styles.stale : ''}`}>
              {commentList.map((c) => (
                <CommentItem
                  key={c.commentId}
                  comment={c}
                  isMine={Boolean(user) && c.author?.memberId === user.memberId}
                  onLike={toggleCommentLike}
                  likeBusy={likeBusyId === c.commentId}
                  onSave={saveComment}
                  onDelete={setDeletingComment}
                  onReport={(comment) => openReport('comment', comment.commentId)}
                />
              ))}
            </ul>
            <Pagination page={comments.data.page} totalPages={comments.data.totalPages} onChange={setCommentPage} />
          </>
        )}
      </section>

      <ConfirmDialog
        open={deletingPost}
        title="게시글을 삭제할까요?"
        message="삭제한 게시글은 되돌릴 수 없습니다."
        confirmText="삭제"
        danger
        loading={deleteBusy}
        onConfirm={removePost}
        onClose={() => setDeletingPost(false)}
      />
      <ConfirmDialog
        open={Boolean(deletingComment)}
        title="댓글을 삭제할까요?"
        message="삭제한 댓글은 되돌릴 수 없습니다."
        confirmText="삭제"
        danger
        onConfirm={removeComment}
        onClose={() => setDeletingComment(null)}
      />
      <ReportDialog
        open={Boolean(report)}
        targetLabel={report?.type === 'comment' ? '댓글' : '게시글'}
        onSubmit={(body) => (report.type === 'comment' ? commentApi.report(report.id, body) : postApi.report(report.id, body))}
        onClose={() => setReport(null)}
        onDone={() => {
          setReport(null);
          toast.success('신고가 접수되었습니다.');
        }}
      />
    </div>
  );
}
