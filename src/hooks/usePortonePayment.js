import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as PortOne from '@portone/browser-sdk/v2';
import { useAuth } from '../auth/useAuth';
import { messageOf } from '../lib/apiErrors';

const IDLE = { step: null, busy: false, error: null, notice: null, result: null, paymentId: null };

/**
 * PortOne 결제 공통 흐름 (개발자 후원, AI 크레딧 구매).
 * 1) create(arg) → { paymentId, amount, orderName, storeId, channelKey }
 * 2) PortOne.requestPayment (카드). 모바일 등은 redirectUrl?paymentId=…&code=…&message=… 로 돌아온다
 * 3) confirm(paymentId) → { status, result: COMPLETED|FAILED|PENDING, message, … }
 * 브라우저가 보낸 결제 결과는 믿지 않고 서버가 PortOne에 직접 조회해 판단한다(confirm).
 *
 * - flow.step: 진행 중인 단계 번호(0 주문 생성, 1 결제창, 2 결과 확인), 3이면 끝
 * - start(arg): 결제 시작. 로그인 확인은 화면이 먼저 한다
 * - recheck(): 같은 paymentId로 결과를 다시 확인한다
 * - onConfirmed(result): confirm 응답을 받을 때마다 호출(선택)
 */
export function usePortonePayment({ create, confirm, redirectUrl, onConfirmed }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [flow, setFlow] = useState(IDLE);
  const redirectHandledRef = useRef(false);

  // 화면이 렌더마다 새 함수를 넘겨도 effect가 다시 돌지 않도록 최신 함수만 기억한다
  const apiRef = useRef({ create, confirm, onConfirmed });
  useEffect(() => {
    apiRef.current = { create, confirm, onConfirmed };
  });

  const runConfirm = useCallback(async (paymentId) => {
    setFlow((f) => ({ ...f, step: 2, busy: true, error: null, paymentId }));
    try {
      const result = await apiRef.current.confirm(paymentId);
      setFlow((f) => ({ ...f, step: 3, busy: false, result }));
      apiRef.current.onConfirmed?.(result);
    } catch (err) {
      setFlow((f) => ({ ...f, busy: false, error: messageOf(err) }));
    }
  }, []);

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
        runConfirm(paymentId);
      }
    });
  }, [params, setParams, user, runConfirm]);

  const start = async (arg) => {
    setFlow({ ...IDLE, step: 0, busy: true });

    let order;
    try {
      order = await apiRef.current.create(arg);
    } catch (err) {
      return setFlow((f) => ({ ...f, busy: false, error: messageOf(err) }));
    }

    if (!order?.storeId || !order?.channelKey) {
      return setFlow((f) => ({
        ...f,
        busy: false,
        notice: '결제 설정(storeId·channelKey)이 비어 있어 결제창을 열 수 없습니다. 운영자에게 문의해 주세요.',
      }));
    }

    setFlow((f) => ({ ...f, step: 1, paymentId: order.paymentId }));
    let response;
    try {
      response = await PortOne.requestPayment({
        storeId: order.storeId,
        channelKey: order.channelKey,
        paymentId: order.paymentId,
        orderName: order.orderName,
        totalAmount: order.amount,
        currency: 'KRW',
        payMethod: 'CARD',
        redirectUrl,
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

    await runConfirm(response.paymentId || order.paymentId);
  };

  const recheck = () => runConfirm(flow.paymentId);

  return { flow, start, recheck };
}
