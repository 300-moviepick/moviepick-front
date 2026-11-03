import { useState } from 'react';
import { messageOf } from '../lib/apiErrors';
import Button from './Button';
import { TextArea } from './Field';
import Modal from './Modal';
import styles from './ReportDialog.module.css';

// 백엔드 CommunityReportRequest의 허용 사유
const REASONS = [
  { value: 'SPAM', label: '스팸·홍보' },
  { value: 'ABUSE', label: '욕설·비방' },
  { value: 'SPOILER', label: '스포일러' },
  { value: 'ADULT', label: '음란·선정적 내용' },
  { value: 'ETC', label: '기타' },
];

/**
 * 신고 대화상자(게시글·댓글·리뷰 공용).
 * onSubmit({ reason, detail })은 Promise를 돌려준다. 실패하면 서버 메시지를 대화상자 안에 보여 준다.
 */
export default function ReportDialog({ open, targetLabel = '콘텐츠', onSubmit, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setReason('');
    setDetail('');
    setError(null);
    onClose?.();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return setError('신고 사유를 선택해 주세요.');
    if (reason === 'ETC' && !detail.trim()) return setError('기타 사유를 입력해 주세요.');
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ reason, detail: detail.trim() || null });
      setBusy(false);
      setReason('');
      setDetail('');
      onDone?.();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`${targetLabel} 신고`}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            취소
          </Button>
          <Button variant="danger" type="submit" form="mp-report-form" loading={busy}>
            신고하기
          </Button>
        </>
      }
    >
      <form id="mp-report-form" className={styles.form} onSubmit={submit}>
        <fieldset className={styles.reasons}>
          <legend className={styles.legend}>신고 사유</legend>
          {REASONS.map((r) => (
            <label key={r.value} className={`${styles.reason} ${reason === r.value ? styles.selected : ''}`}>
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => {
                  setReason(r.value);
                  setError(null);
                }}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        <TextArea
          label={reason === 'ETC' ? '상세 사유' : '상세 사유 (선택)'}
          required={reason === 'ETC'}
          rows={3}
          maxLength={200}
          showCount
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="운영자가 확인할 수 있도록 구체적으로 적어 주세요."
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
