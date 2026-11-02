import { useState } from 'react';
import { messageOf } from '../../lib/apiErrors';
import { formatDateTime } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { TextArea } from '../../ui/Field';
import { IconEdit, IconFlag, IconHeart, IconTrash } from '../../ui/icons';
import { Avatar } from '../../ui/Poster';
import styles from './Community.module.css';

/**
 * 댓글 한 개. CommentListResponse { commentId, author{memberId,nickname}, content, likeCount, likedByMe, createdAt, blinded }
 * 수정은 PATCH /api/community/comments/{commentId} (onSave가 처리). 숨김 댓글(blinded)은 조작할 수 없다.
 */
export default function CommentItem({ comment, isMine, onLike, likeBusy, onSave, onDelete, onReport }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.content);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setText(comment.content);
    setError(null);
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return setError('댓글 내용을 입력해 주세요.');
    if (value === comment.content) return setEditing(false);
    setBusy(true);
    setError(null);
    try {
      await onSave(comment, value);
      setEditing(false);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={styles.comment}>
      <Avatar name={comment.author?.nickname} size={32} />
      <div className={styles.commentBody}>
        <div className={styles.commentHead}>
          <strong>{comment.author?.nickname}</strong>
          {isMine && <Badge tone="primary">내 댓글</Badge>}
          <span className={styles.time}>{formatDateTime(comment.createdAt)}</span>
        </div>

        {comment.blinded ? (
          <p className={styles.blinded}>{comment.content || '관리자에 의해 가려진 댓글입니다.'}</p>
        ) : editing ? (
          <form className={styles.commentEdit} onSubmit={save}>
            <TextArea
              label="댓글 수정"
              rows={3}
              maxLength={500}
              showCount
              value={text}
              onChange={(e) => setText(e.target.value)}
              error={error}
              disabled={busy}
              autoFocus
            />
            <div className={styles.rowEnd}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={busy}>
                취소
              </Button>
              <Button type="submit" size="sm" loading={busy}>
                수정 완료
              </Button>
            </div>
          </form>
        ) : (
          <p className={styles.commentText}>{comment.content}</p>
        )}

        {!editing && !comment.blinded && (
          <div className={styles.commentActions}>
            <button
              type="button"
              className={`${styles.textBtn} ${comment.likedByMe ? styles.liked : ''}`}
              aria-pressed={!!comment.likedByMe}
              onClick={() => onLike(comment)}
              disabled={likeBusy || isMine}
              title={isMine ? '내 댓글에는 좋아요할 수 없습니다' : undefined}
            >
              <IconHeart size={15} filled={comment.likedByMe} /> {comment.likeCount ?? 0}
            </button>
            {isMine ? (
              <>
                <button type="button" className={styles.textBtn} onClick={startEdit}>
                  <IconEdit size={15} /> 수정
                </button>
                <button type="button" className={`${styles.textBtn} ${styles.danger}`} onClick={() => onDelete(comment)}>
                  <IconTrash size={15} /> 삭제
                </button>
              </>
            ) : (
              <button type="button" className={styles.textBtn} onClick={() => onReport(comment)}>
                <IconFlag size={15} /> 신고
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
