import { useState } from 'react';
import { messageOf } from '../../lib/apiErrors';
import Button from '../../ui/Button';
import { Checkbox, TextArea } from '../../ui/Field';
import { IconAlert } from '../../ui/icons';
import RatingInput from '../../ui/RatingInput';
import styles from './MovieDetail.module.css';

/**
 * 리뷰 작성·수정 폼. 규칙은 백엔드와 같다: 평점 0.5~5.0(0.5 단위), 내용 1~1000자, 스포일러 여부.
 * onSubmit(body)는 Promise. 실패하면 서버가 보낸 메시지만 그대로 보여 준다.
 */
export default function ReviewForm({ initial, submitLabel = '리뷰 등록하기', onSubmit, onCancel, resetOnSuccess = false }) {
  const [rating, setRating] = useState(initial?.rating != null ? Number(initial.rating) : null);
  const [content, setContent] = useState(initial?.content ?? '');
  const [spoiler, setSpoiler] = useState(Boolean(initial?.spoiler));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!rating) found.rating = '별점을 선택해 주세요.';
    if (!content.trim()) found.content = '내용을 입력해 주세요.';
    else if (content.length > 1000) found.content = '내용은 1000자 이내로 입력해 주세요.';
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await onSubmit({ rating, content: content.trim(), spoiler });
      if (resetOnSuccess) {
        setRating(null);
        setContent('');
        setSpoiler(false);
      }
    } catch (err) {
      setServerError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.reviewForm} onSubmit={submit} noValidate>
      <RatingInput value={rating} onChange={(v) => {
        setRating(v);
        setErrors((er) => ({ ...er, rating: undefined }));
      }} error={errors.rating} disabled={busy} />
      <TextArea
        label="감상평"
        rows={4}
        maxLength={1000}
        showCount
        placeholder="이 영화의 연출, 연기, 음악에 대한 생각을 자유롭게 남겨 주세요."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setErrors((er) => ({ ...er, content: undefined }));
        }}
        error={errors.content}
        disabled={busy}
      />
      <div className={styles.formFoot}>
        <Checkbox
          label="스포일러가 포함되어 있습니다"
          checked={spoiler}
          onChange={(e) => setSpoiler(e.target.checked)}
          disabled={busy}
        />
        <div className={styles.formActions}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              취소
            </Button>
          )}
          <Button type="submit" variant="soft" loading={busy}>
            {submitLabel}
          </Button>
        </div>
      </div>
      {serverError && (
        <p className={styles.formError} role="alert">
          <IconAlert size={16} />
          {serverError}
        </p>
      )}
    </form>
  );
}
