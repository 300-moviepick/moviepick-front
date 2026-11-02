import { useCallback, useMemo, useRef, useState } from 'react';
import { IconAlert, IconCheckCircle, IconClose, IconInfo } from '../icons';
import { ToastContext } from './toastContext';
import styles from './Toast.module.css';

const ICONS = { success: IconCheckCircle, error: IconAlert, info: IconInfo };
const DURATION_MS = 3500;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone, message) => {
      const id = ++seq.current;
      setToasts((list) => [...list.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (m) => show('success', m),
      error: (m) => show('error', m),
      info: (m) => show('info', m),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={`mp-portal ${styles.region}`} role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} className={`${styles.toast} ${styles[t.tone]}`}>
              <Icon size={18} />
              <span className={styles.message}>{t.message}</span>
              <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="알림 닫기">
                <IconClose size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
