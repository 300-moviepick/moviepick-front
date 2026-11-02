import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { postApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { messageOf } from '../../lib/apiErrors';
import { Badge, Chip } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextArea, TextField } from '../../ui/Field';
import { IconAlert, IconArrowLeft, IconArrowRight, IconLock } from '../../ui/icons';
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../ui/StateViews';
import { useToast } from '../../ui/toast/useToast';
import styles from './Community.module.css';

const TITLE_MAX = 100;
const CONTENT_MAX = 5000;

// 작성 폼 본체. initial이 있으면 수정 모드(바뀐 필드만 PATCH로 보낸다)
function PostForm({ initial, onSubmit }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const editing = Boolean(initial);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!title.trim()) found.title = '제목을 입력해 주세요.';
    else if (title.trim().length > TITLE_MAX) found.title = `제목은 ${TITLE_MAX}자 이하여야 합니다.`;
    if (!content.trim()) found.content = '내용을 입력해 주세요.';
    else if (content.length > CONTENT_MAX) found.content = `내용은 ${CONTENT_MAX}자 이하여야 합니다.`;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    const body = {};
    if (!editing || title.trim() !== initial.title) body.title = title.trim();
    if (!editing || content !== initial.content) body.content = content;
    if (editing && Object.keys(body).length === 0) {
      setFormError('바뀐 내용이 없습니다.');
      return;
    }

    setBusy(true);
    try {
      await onSubmit(body);
    } catch (err) {
      setFormError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <form className={styles.editorLayout} onSubmit={submit} noValidate>
      <div className={styles.editorMain}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <strong>카테고리</strong>
            <ComingSoon variant="badge" />
          </div>
          <div className={styles.categoryRow}>
            {['심층 비평·해석', '자유 수다·관람 후기', '개봉 예정·영화제 소식', '영화 추천 질문'].map((c) => (
              <Chip key={c} disabled>
                {c}
              </Chip>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <TextField
            label="게시글 제목"
            required
            maxLength={TITLE_MAX}
            showCount
            placeholder="제목을 입력해 주세요"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((er) => ({ ...er, title: undefined }));
            }}
            error={errors.title}
          />
        </section>

        <section className={styles.panel}>
          <TextArea
            label="본문"
            required
            rows={16}
            maxLength={CONTENT_MAX}
            showCount
            placeholder="영화에 대한 감상, 해석, 추천 이야기를 자유롭게 적어 주세요. 결말이 포함되면 제목에 [스포일러]라고 적어 주세요."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrors((er) => ({ ...er, content: undefined }));
            }}
            error={errors.content}
          />
        </section>
      </div>

      <aside className={styles.editorSide}>
        <section className={styles.panel}>
          <strong className={styles.sideTitle}>게시글 게시</strong>
          {formError && (
            <p className={styles.formError} role="alert">
              <IconAlert size={16} />
              {formError}
            </p>
          )}
          <Button type="submit" variant="soft" size="lg" block loading={busy} iconRight={<IconArrowRight size={18} />}>
            {editing ? '수정 완료' : '게시글 등록하기'}
          </Button>
          <Button variant="ghost" block onClick={() => navigate(-1)} disabled={busy}>
            작성 취소
          </Button>
        </section>
        <ComingSoon
          title="게시 옵션"
          description="관련 영화 연결, 이미지 첨부, 스포일러 가림 표시, 임시 저장은 아직 제공되지 않습니다."
        />
      </aside>
    </form>
  );
}

// 새 글 작성 (Stitch 10번). POST /api/community/posts → 상세로 이동
export function PostCreateScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = async (body) => {
    const res = await postApi.create(body);
    toast.success('게시글을 등록했습니다.');
    navigate(`/community/${res.postId}`, { replace: true });
  };

  return (
    <div className={`mp-container ${styles.page}`}>
      <EditorHeader title="새 게시글 작성" />
      <PostForm onSubmit={create} />
    </div>
  );
}

// 게시글 수정. 본인 글만(서버도 POST_ACCESS_DENIED로 막음). PATCH /api/community/posts/{postId}
export function PostEditScreen() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const post = useAsync(() => postApi.detail(postId), [postId]);

  const update = async (body) => {
    await postApi.update(postId, body);
    toast.success('게시글을 수정했습니다.');
    navigate(`/community/${postId}`, { replace: true });
  };

  let content;
  if (post.loading && !post.data) {
    content = <LoadingState label="게시글을 불러오는 중…" />;
  } else if (post.error) {
    const notFound = post.error instanceof ApiError && post.error.status === 404;
    content = notFound ? (
      <EmptyState title="게시글을 찾을 수 없습니다" description="삭제되었거나 숨김 처리된 게시글입니다." action={<Button to="/community">목록으로</Button>} />
    ) : (
      <ErrorState error={post.error} onRetry={post.reload} />
    );
  } else if (post.data.author?.memberId !== user?.memberId) {
    content = (
      <EmptyState
        icon={<IconLock size={22} />}
        title="본인이 작성한 게시글만 수정할 수 있습니다"
        action={<Button to={`/community/${postId}`}>게시글로 돌아가기</Button>}
      />
    );
  } else {
    content = <PostForm initial={post.data} onSubmit={update} />;
  }

  return (
    <div className={`mp-container ${styles.page}`}>
      <EditorHeader title="게시글 수정" back={`/community/${postId}`} />
      {content}
    </div>
  );
}

function EditorHeader({ title, back = '/community' }) {
  return (
    <header className={styles.editorHeader}>
      <Link to={back} className={styles.backLink}>
        <IconArrowLeft size={16} /> 돌아가기
      </Link>
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>{title}</h1>
        <Badge tone="primary">CRITIC STUDIO</Badge>
      </div>
      <p className={styles.pageDesc}>영화에 대한 비평, 해석, 감상을 다른 시네필과 나눠 보세요.</p>
    </header>
  );
}
