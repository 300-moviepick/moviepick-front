import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as PortOne from '@portone/browser-sdk/v2';
import { supportApi } from '../../api/moviepick';
import { useAuth } from '../../auth/AuthContext';
import { useGoLogin } from '../../hooks/useGoLogin';
import { messageOf } from '../../lib/apiErrors';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconAlert, IconArrowRight, IconCheck, IconCheckCircle, IconClock, IconCoffee, IconInfo, IconLock, IconRefresh } from '../../ui/icons';
import styles from './SupportScreen.module.css';

// 백엔드 SupportService가 허용하는 금액만 (그 외 금액은 400 INVALID_SUPPORT_AMOUNT)
const OPTIONS = [
  { amount: 3000, cups: 1, title: '커피 한 잔 후원', desc: '가볍게 전하는 응원' },
  { amount: 6000, cups: 2, title: '커피 두 잔 후원', desc: '밤샘 작업을 위한 든든한 응원' },
  { amount: 9000, cups: 3, title: '커피 세 잔 후원', desc: '서버 운영과 개선을 위한 큰 응원' },
];

const STEPS = ['후원 주문 생성', '결제창에서 결제', '결제 결과 확인'];

const RESULT_VIEW = {
  COMPLETED: { tone: 'success', title: '후원이 완료되었습니다', icon: IconCheckCircle },
  FAILED: { tone: 'error', title: '결제가 완료되지 않았습니다', icon: IconAlert },
  PENDING: { tone: 'pending', title: '결제 확인 중입니다', icon: IconClock },
};

const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;

/**
 * 개발자 후원 (Stitch 12번). 기존 SupportPage와 같은 흐름:
 * 1) POST /api/supports {amount} → { paymentId, amount, orderName, storeId, channelKey }
 * 2) PortOne.requestPayment (카드). 모바일 등은 redirectUrl(/support?paymentId=…&code=…&message=…)로 돌아온다
 * 3) POST /api/supports/{paymentId}/confirm → { status, result: COMPLETED|FAILED|PENDING, message }
 * 브라우저가 보낸 결제 결과는 믿지 않고 서버가 PortOne에 직접 조회해 판단한다(confirm).
 * AI 크레딧과는 무관하다(크레딧 지급 없음).
 */
export default function SupportScreen() {
  const { user } = useAuth();
  const goLogin = useGoLogin();
  const [params, setParams] = useSearchParams();
  const [amount, setAmount] = useState(OPTIONS[0].amount);
  // step: 진행 중인 단계 번호(0~2), done이면 끝
  const [flow, setFlow] = useState({ step: null, busy: false, error: null, notice: null, result: null, paymentId: null });
  const redirectHandledRef = useRef(false);

  const selected = OPTIONS.find((o) => o.amount === amount);

  const confirm = async (paymentId) => {
    setFlow((f) => ({ ...f, step: 2, busy: true, error: null, paymentId }));
    try {
      const result = await supportApi.confirm(paymentId);
      setFlow((f) => ({ ...f, step: 3, busy: false, result }));
    } catch (err) {
      setFlow((f) => ({ ...f, busy: false, error: messageOf(err) }));
    }
  };

  // 리다이렉트 복귀: ?paymentId=…(&code=…&message=…). 쿼리는 한 번만 처리하고 지운다.
  useEffect(() => {
    const paymentId = params.get('paymentId');
    if (!paymentId || redirectHandledRef.current) return;
    const code = params.get('code');
    const message = params.get('message');
    // 결과 확인은 로그인(본인 결제 확인)이 필요하므로, 성공 복귀는 로그인 상태에서만 처리한다
    if (!code && !user) return;
    redirectHandledRef.current = true;
    setParams({}, { replace: true });

    Promise.resolve().then(() => {
      if (code) {
        setFlow({ step: 1, busy: false, error: `결제가 취소되었거나 실패했습니다. (${code}) ${message || ''}`.trim(), notice: null, result: null, paymentId });
      } else {
        confirm(paymentId);
      }
    });
    // 쿼리 처리는 redirectHandledRef로 한 번만 실행된다
  }, [params, setParams, user]);

  const pay = async () => {
    if (!user) return goLogin();
    setFlow({ step: 0, busy: true, error: null, notice: null, result: null, paymentId: null });

    let support;
    try {
      support = await supportApi.create(amount);
    } catch (err) {
      return setFlow((f) => ({ ...f, busy: false, error: messageOf(err) }));
    }

    if (!support?.storeId || !support?.channelKey) {
      return setFlow((f) => ({
        ...f,
        busy: false,
        notice: '결제 설정(storeId·channelKey)이 비어 있어 결제창을 열 수 없습니다. 운영자에게 문의해 주세요.',
      }));
    }

    setFlow((f) => ({ ...f, step: 1, paymentId: support.paymentId }));
    let response;
    try {
      response = await PortOne.requestPayment({
        storeId: support.storeId,
        channelKey: support.channelKey,
        paymentId: support.paymentId,
        orderName: support.orderName,
        totalAmount: support.amount,
        currency: 'KRW',
        payMethod: 'CARD',
        redirectUrl: `${window.location.origin}/support`,
      });
    } catch (err) {
      return setFlow((f) => ({ ...f, busy: false, error: messageOf(err) }));
    }

    if (!response) {
      // 리다이렉트 방식으로 진행된 경우 이 화면으로 돌아와 위 effect가 처리한다
      return setFlow((f) => ({ ...f, busy: false, notice: '결제창 응답이 없습니다. 결제가 다른 창에서 진행되었다면 완료 후 이 화면으로 돌아옵니다.' }));
    }
    if (response.code !== undefined) {
      return setFlow((f) => ({ ...f, busy: false, error: `결제가 취소되었거나 실패했습니다. (${response.code}) ${response.message || ''}`.trim() }));
    }

    await confirm(response.paymentId || support.paymentId);
  };

  const view = flow.result ? RESULT_VIEW[flow.result.result] ?? RESULT_VIEW.PENDING : null;
  const ResultIcon = view?.icon;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`mp-container ${styles.heroInner}`}>
          <Badge tone="primary">PATRON &amp; DONATION · 순수 창작 운영 후원</Badge>
          <h1 className={styles.title}>
            개발자에게 따뜻한 <span className={styles.accent}>커피 한 잔</span> 선물하기
          </h1>
          <p className={styles.desc}>MoviePick이 영화 이야기를 나누는 공간으로 계속 운영될 수 있도록 개발과 운영을 응원해 주세요.</p>
          <div className={styles.noticeBox}>
            <IconInfo size={18} />
            <p>
              후원은 서버 운영과 개발을 위한 자발적 기부입니다. <strong>유료 AI 영화 추천 크레딧 구매와는 별개이며, 후원해도 AI 크레딧은 지급되지 않습니다.</strong>
            </p>
          </div>
        </div>
      </section>

      <div className={`mp-container ${styles.layout}`}>
        <div className={styles.main}>
          <section className={styles.panel} aria-labelledby="support-options">
            <h2 id="support-options" className={styles.panelTitle}>
              <span className={styles.stepNo}>1</span> 후원 옵션 선택
              <span className={styles.panelAside}>1회 결제 후원</span>
            </h2>
            <div className={styles.options} role="radiogroup" aria-label="후원 금액">
              {OPTIONS.map((o) => {
                const active = o.amount === amount;
                return (
                  <label key={o.amount} className={`${styles.option} ${active ? styles.optionActive : ''}`}>
                    <input
                      type="radio"
                      name="support-amount"
                      value={o.amount}
                      checked={active}
                      onChange={() => setAmount(o.amount)}
                      disabled={flow.busy}
                    />
                    <span className={styles.cups} aria-hidden="true">
                      {Array.from({ length: o.cups }, (_, i) => (
                        <IconCoffee key={i} size={20} />
                      ))}
                    </span>
                    <span className={styles.optionText}>
                      <strong>{o.title}</strong>
                      <span>{o.desc}</span>
                    </span>
                    <span className={styles.optionPrice}>{won(o.amount)}</span>
                    {active && (
                      <span className={styles.check} aria-hidden="true">
                        <IconCheck size={14} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className={styles.help}>후원 금액은 3,000원 · 6,000원 · 9,000원 중에서 선택할 수 있습니다.</p>
          </section>

          <section className={styles.panel} aria-labelledby="support-method">
            <h2 id="support-method" className={styles.panelTitle}>
              <span className={styles.stepNo}>2</span> 결제 수단
            </h2>
            <div className={styles.method}>
              <IconLock size={18} />
              <div>
                <strong>신용·체크카드</strong>
                <p>결제는 PortOne 결제창에서 안전하게 진행되며, MoviePick은 카드 정보를 저장하지 않습니다.</p>
              </div>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.faqPanel}`} aria-labelledby="support-faq">
            <h2 id="support-faq" className={styles.panelTitle}>
              후원 관련 자주 묻는 질문
            </h2>
            <details className={styles.faq} open>
              <summary>후원하면 AI 추천 크레딧이 충전되나요?</summary>
              <p>아니요. 개발자 후원과 AI 크레딧은 완전히 별개입니다. AI 크레딧 충전 기능은 준비 중입니다.</p>
            </details>
            <details className={styles.faq}>
              <summary>정기 후원도 가능한가요?</summary>
              <p>현재는 1회 결제 후원만 제공합니다.</p>
            </details>
            <details className={styles.faq}>
              <summary>결제창을 닫았는데 결과가 보이지 않아요.</summary>
              <p>결제가 끝나지 않았다면 다시 후원을 진행해 주세요. 결제 중 화면이 바뀌었다면 이 페이지로 돌아왔을 때 결과를 다시 확인합니다.</p>
            </details>
            <Button to="/ai/credits" variant="ghost" size="sm" iconRight={<IconArrowRight size={14} />}>
              AI 크레딧 충전소 바로가기 (준비 중)
            </Button>
          </section>
        </div>

        <aside className={styles.side}>
          <section className={`${styles.panel} ${styles.summary}`} aria-labelledby="support-summary">
            <h2 id="support-summary" className={styles.panelTitle}>
              최종 후원 내역 확인
            </h2>
            <dl className={styles.summaryList}>
              <div>
                <dt>선택한 후원</dt>
                <dd>{selected.title}</dd>
              </div>
              <div>
                <dt>후원 목적</dt>
                <dd>MoviePick 개발·서버 운영</dd>
              </div>
              <div>
                <dt>AI 크레딧 지급</dt>
                <dd>
                  <Badge tone="secondary">해당 없음</Badge>
                </dd>
              </div>
              <div>
                <dt>결제 수단</dt>
                <dd>신용·체크카드</dd>
              </div>
            </dl>
            <div className={styles.total}>
              <span>최종 결제 예정 금액</span>
              <strong>{won(amount)}</strong>
            </div>
            <Button variant="soft" size="lg" block onClick={pay} loading={flow.busy} icon={<IconCoffee size={18} />}>
              {user ? `${won(amount)} 후원하고 응원 보내기` : '로그인하고 후원하기'}
            </Button>
            {!user && <p className={styles.help}>후원은 로그인 후 이용할 수 있습니다.</p>}
          </section>

          {(flow.step !== null || flow.error || flow.notice) && (
            <section className={styles.panel} aria-live="polite" aria-labelledby="support-status">
              <h2 id="support-status" className={styles.panelTitle}>
                결제 진행 상태
              </h2>
              <ol className={styles.steps}>
                {STEPS.map((label, i) => {
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
                    {flow.result.result === 'COMPLETED' && <p>개발자에게 따뜻한 응원이 전달되었습니다. 고맙습니다!</p>}
                  </div>
                </div>
              )}

              {flow.paymentId && (flow.result?.result === 'PENDING' || (flow.error && flow.step === 2)) && (
                <Button variant="secondary" icon={<IconRefresh size={16} />} onClick={() => confirm(flow.paymentId)} loading={flow.busy}>
                  결제 결과 다시 확인
                </Button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
