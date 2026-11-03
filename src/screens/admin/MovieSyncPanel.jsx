import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { adminApi } from '../../api/moviepick';
import { errorCodeOf, messageOf } from '../../lib/apiErrors';
import { Badge } from '../../ui/Badge';
import Button from '../../ui/Button';
import { IconAlert, IconCheckCircle, IconClock, IconDatabase, IconInfo, IconRefresh } from '../../ui/icons';
import { ConfirmDialog } from '../../ui/Modal';
import styles from './Admin.module.css';

/*
 * 관리자 영화 수집 (C-03 결정: POST /api/admin/batch/movies/sync 하나만 사용).
 * - 수집 페이지 수는 서버 설정(movie.batch.collect-pages)을 따르며 화면에서 정하지 않는다.
 * - 요청이 Job 완료까지 오래 걸릴 수 있어(동기 실행 추정) 진행 시간을 보여 주고 중복 클릭을 막는다.
 * - 응답: 200 완료 / 202 실행 중 / 409 CONCURRENT_REQUEST(이미 실행 중) / 500 BATCH_EXECUTION_FAILED·INTERNAL_ERROR
 */
function describe(outcome) {
  if (outcome.kind === 'ok') {
    const { status } = outcome.data ?? {};
    if (status === 'COMPLETED') return { tone: 'success', icon: IconCheckCircle, title: '영화 수집이 완료되었습니다' };
    return { tone: 'pending', icon: IconClock, title: '영화 수집이 실행 중입니다', note: '완료까지 시간이 걸릴 수 있습니다. 잠시 후 영화 목록을 새로 고쳐 확인하세요.' };
  }
  if (outcome.code === 'CONCURRENT_REQUEST') {
    return { tone: 'pending', icon: IconInfo, title: '이미 영화 수집이 실행 중입니다', note: '진행 중인 수집이 끝난 뒤 다시 시도해 주세요.' };
  }
  return { tone: 'error', icon: IconAlert, title: '영화 수집에 실패했습니다' };
}

function elapsedText(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}분 ${s}초` : `${s}초`;
}

export default function MovieSyncPanel({ compact = false, onFinished }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(null); // 시작 시각(ms)
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState(null);

  // 진행 시간 표시 (setState는 타이머 콜백에서만)
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - running) / 1000)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const run = async () => {
    setConfirmOpen(false);
    setOutcome(null);
    setElapsed(0);
    const started = Date.now();
    setRunning(started);
    try {
      const data = await adminApi.runMovieSyncBatch();
      setOutcome({ kind: 'ok', data });
    } catch (err) {
      // 500 응답도 data에 실행 결과(executionId, status)가 들어 있을 수 있다
      setOutcome({
        kind: 'error',
        code: errorCodeOf(err),
        message: messageOf(err),
        status: err instanceof ApiError ? err.status : null,
        data: err instanceof ApiError ? err.body?.data : null,
      });
    } finally {
      setRunning(null);
      setElapsed(Math.floor((Date.now() - started) / 1000));
      onFinished?.();
    }
  };

  const view = outcome ? describe(outcome) : null;
  const ViewIcon = view?.icon;
  const detail = outcome?.data;

  return (
    <section className={`${styles.panel} ${compact ? styles.panelCompact : ''}`} aria-labelledby="mp-sync-title">
      <div className={styles.panelHead}>
        <h2 id="mp-sync-title" className={styles.panelTitle}>
          <IconDatabase size={18} /> 영화 데이터 수집 요청
        </h2>
        <Badge tone="tertiary">TMDB · Spring Batch</Badge>
      </div>
      <p className={styles.muted}>
        TMDB 인기 영화를 수집하는 Batch Job(movieSyncJob)을 실행합니다. 수집 페이지 수는 서버 설정을 따르며, 같은 Job이 실행 중이면 새로 시작하지 않습니다.
      </p>

      <Button
        variant="primary"
        icon={<IconRefresh size={16} />}
        loading={Boolean(running)}
        disabled={Boolean(running)}
        onClick={() => setConfirmOpen(true)}
      >
        {running ? `수집 중… ${elapsedText(elapsed)}` : '영화 수집 실행'}
      </Button>

      {running && (
        <p className={styles.runningNote} role="status">
          <IconClock size={16} /> 수집이 끝날 때까지 응답이 오래 걸릴 수 있습니다. 이 화면을 닫지 말고 기다려 주세요.
        </p>
      )}

      {view && (
        <div className={`${styles.result} ${styles[`result_${view.tone}`]}`} role={view.tone === 'error' ? 'alert' : 'status'}>
          <ViewIcon size={20} />
          <div className={styles.resultBody}>
            <strong>{view.title}</strong>
            {outcome.kind === 'error' && <p>{outcome.message}</p>}
            {view.note && <p>{view.note}</p>}
            <dl className={styles.kv}>
              {detail?.executionId != null && (
                <>
                  <dt>실행 번호</dt>
                  <dd>{detail.executionId}</dd>
                </>
              )}
              {detail?.jobName && (
                <>
                  <dt>Job</dt>
                  <dd>{detail.jobName}</dd>
                </>
              )}
              {detail?.status && (
                <>
                  <dt>상태</dt>
                  <dd>{detail.status}</dd>
                </>
              )}
              {outcome.kind === 'error' && outcome.code && (
                <>
                  <dt>오류 코드</dt>
                  <dd>
                    {outcome.code}
                    {outcome.status ? ` (HTTP ${outcome.status})` : ''}
                  </dd>
                </>
              )}
              <dt>소요 시간</dt>
              <dd>{elapsedText(elapsed)}</dd>
            </dl>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="영화 수집을 실행할까요?"
        message={'TMDB에서 영화 데이터를 가져와 저장합니다.\n수집이 끝날 때까지 응답이 오래 걸릴 수 있습니다.'}
        confirmText="수집 실행"
        onConfirm={run}
        onClose={() => setConfirmOpen(false)}
      />
    </section>
  );
}
