import { useContext } from 'react';
import { ToastContext } from './toastContext';

// toast.success('저장했습니다'), toast.error(message)
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast는 ToastProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
