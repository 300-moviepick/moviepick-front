import Button from './Button';
import { IconAlert, IconCheck, IconInfo, IconRefresh } from './icons';
import styles from './PaymentStatusPanel.module.css';

/**
 * 결제 진행 상태 (usePortonePayment의 flow를 그린다). 바깥 패널과 제목은 화면이 그린다.
 * - steps: 단계 이름 3개(주문 생성, 결제창, 결과 확인)
 * - resultView: { COMPLETED|FAILED|PENDING: { tone: success|error|pending, title, icon } }
 * - successNote: COMPLETED일 때 덧붙일 문장(선택)
 * - onRecheck: "결제 결과 다시 확인" 버튼 동작. PENDING이거나 결과 확인 단계에서 오류가 났을 때 보인다
 */
export default function PaymentStatusPanel({ flow, steps, resultView, successNote, onRecheck }) {
  const view = flow.result ? resultView[flow.result.result] ?? resultView.PENDING : null;
  const ResultIcon = view?.icon;

  return (
    <>
      <ol className={styles.steps}>
        {steps.map((label, i) => {
          const failed = (flow.error || flow.notice) && i === flow.step;
          const status = failed ? 'fail' : flow.step > i ? 'done' : flow.step === i ? (flow.busy ? 'run' : 'wait') : 'wait';
          return (
            <li key={label} className={styles[`step_${status}`]}>
              <span className={styles.stepMark} aria-hidden="true">
                {status === 'done' && <IconCheck size={14} />}
                {status === 'run' && <span className={styles.spinner} />}
                {status === 'fail' && <IconAlert size={14} />}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {flow.notice && (
        <p className={styles.noticeMsg} role="status">
          <IconInfo size={16} /> {flow.notice}
        </p>
      )}
      {flow.error && (
        <p className={styles.errorMsg} role="alert">
          <IconAlert size={16} /> {flow.error}
        </p>
      )}

      {view && (
        <div className={`${styles.result} ${styles[`result_${view.tone}`]}`}>
          <ResultIcon size={22} />
          <div>
            <strong>{view.title}</strong>
            <p>{flow.result.message}</p>
            {flow.result.result === 'COMPLETED' && successNote && <p>{successNote}</p>}
          </div>
        </div>
      )}

      {flow.paymentId && (flow.result?.result === 'PENDING' || (flow.error && flow.step === 2)) && (
        <Button variant="secondary" icon={<IconRefresh size={16} />} onClick={onRecheck} loading={flow.busy}>
          결제 결과 다시 확인
        </Button>
      )}
    </>
  );
}
